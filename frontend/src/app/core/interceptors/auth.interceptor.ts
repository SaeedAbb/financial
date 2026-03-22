import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakAuthService } from '../services/keycloak-auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakAuthService = inject(KeycloakAuthService);
  const router = inject(Router);
  
  // Skip token attachment for Keycloak URLs (auth endpoints)
  if (req.url.includes('/realms/') || req.url.includes('/auth/')) {
    return next(req);
  }

  // Get token (even if expired - let 401 response trigger refresh)
  const token = keycloakAuthService.getToken();

  // If no token at all, redirect to login for protected endpoints
  if (!token && req.url.includes('/api/v1/') && !req.url.includes('/api/v1/auth/')) {
    router.navigate(['/auth/login']);
    return throwError(() => new Error('Authentication required'));
  }

  // If no token and not a protected endpoint, proceed without token
  if (!token) {
    return next(req);
  }

  // Add token to request
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized, try to refresh the token once
      if (error.status === 401 && !req.headers.has('X-Token-Refresh-Attempted')) {
        const refreshToken = keycloakAuthService.getRefreshToken();
        
        // Only attempt refresh if we have a refresh token
        if (refreshToken) {
          return keycloakAuthService.refreshToken().pipe(
            switchMap(tokenResponse => {
              // Retry the original request with new token and a flag to prevent infinite refresh
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                  'X-Token-Refresh-Attempted': 'true'
                }
              });
              return next(retryReq);
            }),
            catchError(refreshError => {
              // If refresh fails, redirect to login
              keycloakAuthService.clearTokens();
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token available, redirect to login
          keycloakAuthService.clearTokens();
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }
      }
      
      return throwError(() => error);
    })
  );
};