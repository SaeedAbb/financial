# Keycloak Session Configuration Guide

## Overview
This guide explains how to configure Keycloak for extended session durations to prevent automatic logouts during periods of inactivity.

## Keycloak Admin Console Configuration

### 1. Session Settings (Realm Settings → Sessions)

| Setting | Recommended Value | Description |
|---------|------------------|-------------|
| SSO Session Idle | 1800 minutes (30 hours) | Time a session remains active without any activity |
| SSO Session Max | 3600 minutes (60 hours) | Maximum time a session can remain active regardless of activity |
| SSO Session Idle Remember Me | 2880 minutes (48 hours) | Idle timeout when "Remember Me" is checked |
| SSO Session Max Remember Me | 43200 minutes (30 days) | Maximum session time when "Remember Me" is checked |
| Client Session Idle | 1800 minutes | Idle timeout for client sessions |
| Client Session Max | 3600 minutes | Maximum client session duration |

### 2. Token Settings (Realm Settings → Tokens)

| Setting | Recommended Value | Description |
|---------|------------------|-------------|
| Access Token Lifespan | 30 minutes | Duration of access tokens |
| Refresh Token Max Reuse | 0 | Number of times a refresh token can be reused |
| Revoke Refresh Token | OFF | Keep refresh tokens valid |
| Refresh Token Max Lifespan | 1800 minutes | Maximum time refresh tokens remain valid |

### 3. Login Settings (Realm Settings → Login)

- Enable "Remember Me" checkbox on login form
- Set "Remember Me" default to ON (optional)

## Frontend Implementation

### Auto Token Refresh
Implement automatic token refresh in your Angular application:

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.keycloak.updateToken(20).pipe(
        switchMap((refreshed: boolean) => {
          this.isRefreshing = false;
          if (refreshed) {
            this.refreshTokenSubject.next(this.keycloak.getToken());
            return next.handle(this.addToken(request));
          }
          return throwError('Token refresh failed');
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addToken(request));
        })
      );
    }
  }

  private addToken(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.keycloak.getToken();
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  }
}
```

### Periodic Token Refresh
Add a service to periodically refresh tokens:

```typescript
// token-refresh.service.ts
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  constructor(private keycloak: KeycloakService) {}

  startTokenRefresh() {
    // Refresh token every 25 minutes (before 30-minute expiry)
    interval(25 * 60 * 1000).subscribe(() => {
      this.keycloak.updateToken(30).then(refreshed => {
        if (refreshed) {
          console.log('Token refreshed');
        }
      }).catch(() => {
        console.error('Failed to refresh token');
        this.keycloak.login();
      });
    });
  }
}

// Initialize in app.component.ts
export class AppComponent implements OnInit {
  constructor(private tokenRefreshService: TokenRefreshService) {}
  
  ngOnInit() {
    this.tokenRefreshService.startTokenRefresh();
  }
}
```

## Docker Compose Configuration

If using Docker, you can set Keycloak session timeouts via environment variables:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:latest
  environment:
    - KC_DB=postgres
    - KC_DB_URL_HOST=postgres
    - KC_DB_URL_DATABASE=keycloak
    - KC_DB_USERNAME=keycloak
    - KC_DB_PASSWORD=keycloak
    - KEYCLOAK_ADMIN=admin
    - KEYCLOAK_ADMIN_PASSWORD=admin
    # Session configuration
    - KC_SPI_LOGIN_PROTOCOL_OPENID_CONNECT_LEGACY_LOGOUT_REDIRECT_URI=true
  command:
    - start-dev
    - --spi-login-protocol-openid-connect-legacy-logout-redirect-uri=true
```

## Testing Session Configuration

1. Log into your application
2. Note the current time
3. Leave the application idle for your configured period
4. Return and verify you're still logged in
5. Check browser developer tools to see token refresh activity

## Security Considerations

- Longer sessions increase security risk if devices are left unattended
- Consider implementing:
  - Screen lock after inactivity
  - Re-authentication for sensitive operations
  - Device-specific session management
  - IP-based session validation

## Troubleshooting

If sessions still expire:
1. Check browser console for token refresh errors
2. Verify Keycloak logs for session timeout events
3. Ensure frontend is properly refreshing tokens
4. Check if corporate proxy or firewall is interfering

## References

- [Keycloak Session Configuration](https://www.keycloak.org/docs/latest/server_admin/#_timeouts)
- [Token Lifespan Documentation](https://www.keycloak.org/docs/latest/server_admin/#_token_lifespan)