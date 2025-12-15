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

  // Check if user is authenticated
  if (!keycloakAuthService.isAuthenticated()) {
    // Check if this is a request to a protected API endpoint
    if (req.url.includes('/api/v1/') && !req.url.includes('/api/v1/auth/')) {
      router.navigate(['/auth/login']);
      return throwError(() => new Error('Authentication required'));
    }
    return next(req);
  }
  
  const token = keycloakAuthService.getToken();

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