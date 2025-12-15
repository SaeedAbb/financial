import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { KeycloakAuthService } from '../services/keycloak-auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const keycloakAuthService = inject(KeycloakAuthService);

  if (!keycloakAuthService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const token = keycloakAuthService.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const realmRoles = payload.realm_access?.roles || [];
      const resourceRoles = payload.resource_access?.[keycloakAuthService['clientId']]?.roles || [];
      const userRoles = [...realmRoles, ...resourceRoles];
      
      const hasRequiredRoles = requiredRoles.every(role => userRoles.includes(role));
      
      if (!hasRequiredRoles) {
        // Redirect to unauthorized page or dashboard
        router.navigate(['/dashboard']);
        return false;
      }
    } catch {
      return true;
    }
  }

  return true;
};