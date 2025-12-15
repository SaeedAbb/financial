import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface KeycloakUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  email: string;
  email_verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  private http = inject(HttpClient);

  private readonly keycloakUrl = environment.keycloakUrl;
  private readonly realm = environment.keycloakRealm;
  private readonly clientId = environment.keycloakClientId;
  
  private readonly tokenKey = 'keycloak_token';
  private readonly refreshTokenKey = 'keycloak_refresh_token';
  private readonly userKey = 'keycloak_user';

  login(credentials: LoginRequest): Observable<TokenResponse> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      username: credentials.username,
      password: credentials.password,
      scope: 'openid profile email'
    }).toString();

    return this.http.post<TokenResponse>(tokenUrl, body, { headers }).pipe(
      map(response => {
        this.storeTokens(response);
        this.loadUserInfo();
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (error.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to authentication server.';
        } else if (error.error?.error_description) {
          errorMessage = error.error.error_description;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout(): Observable<void> {
    const logoutUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      const body = new URLSearchParams({
        client_id: this.clientId,
        refresh_token: refreshToken
      }).toString();

      return this.http.post<void>(logoutUrl, body, { headers }).pipe(
        map(() => {
          this.clearTokens();
        }),
        catchError(() => {
          // Even if logout fails on server, clear local tokens
          this.clearTokens();
          return new Observable<void>(subscriber => subscriber.complete());
        })
      );
    } else {
      this.clearTokens();
      return new Observable<void>(subscriber => subscriber.complete());
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  getCurrentUser(): KeycloakUser | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken
    }).toString();

    return this.http.post<TokenResponse>(tokenUrl, body, { headers }).pipe(
      map(response => {
        this.storeTokens(response);
        this.loadUserInfo();
        return response;
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.clearTokens();
        return throwError(() => new Error('Session expired. Please login again.'));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private storeTokens(tokenResponse: TokenResponse): void {
    localStorage.setItem(this.tokenKey, tokenResponse.access_token);
    localStorage.setItem(this.refreshTokenKey, tokenResponse.refresh_token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  private loadUserInfo(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userInfo: KeycloakUser = {
          sub: payload.sub,
          name: payload.name || `${payload.given_name} ${payload.family_name}`,
          given_name: payload.given_name,
          family_name: payload.family_name,
          preferred_username: payload.preferred_username,
          email: payload.email,
          email_verified: payload.email_verified || false
        };
        localStorage.setItem(this.userKey, JSON.stringify(userInfo));
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }

  loginWithGoogle(): void {
    const googleLoginUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard')}&response_type=code&scope=openid&kc_idp_hint=google`;
    window.location.href = googleLoginUrl;
  }
}