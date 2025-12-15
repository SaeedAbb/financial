import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { KeycloakAuthService, KeycloakUser, LoginRequest, TokenResponse } from './keycloak-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private keycloakAuthService = inject(KeycloakAuthService);
  private router = inject(Router);

  public getLoggedUser(): KeycloakUser | null {
    return this.keycloakAuthService.getCurrentUser();
  }

  public isLoggedIn(): boolean {
    return this.keycloakAuthService.isAuthenticated();
  }

  public login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.keycloakAuthService.login(credentials);
  }


  public logout(): void {
    this.keycloakAuthService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even on error, navigate to login
        this.router.navigate(['/auth/login']);
      }
    });
  }

  public getToken(): string | null {
    return this.keycloakAuthService.getToken();
  }

  public getUsername(): string | undefined {
    const user = this.getLoggedUser();
    return user?.preferred_username;
  }

  public getUserId(): string | undefined {
    const user = this.getLoggedUser();
    return user?.sub;
  }

  public getEmail(): string | undefined {
    const user = this.getLoggedUser();
    return user?.email;
  }

  public isTokenExpired(): boolean {
    return !this.keycloakAuthService.isAuthenticated();
  }

  public refreshToken(): Observable<TokenResponse> {
    return this.keycloakAuthService.refreshToken();
  }

  public hasRole(role: string): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const realmRoles = payload.realm_access?.roles || [];
      const resourceRoles = payload.resource_access?.[this.keycloakAuthService['clientId']]?.roles || [];
      const userRoles = [...realmRoles, ...resourceRoles];
      
      return userRoles.includes(role);
    } catch (error) {
      console.error('Error parsing token for roles:', error);
      return false;
    }
  }

  public getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const realmRoles = payload.realm_access?.roles || [];
      const resourceRoles = payload.resource_access?.[this.keycloakAuthService['clientId']]?.roles || [];
      
      return [...realmRoles, ...resourceRoles];
    } catch (error) {
      console.error('Error parsing token for roles:', error);
      return [];
    }
  }
}