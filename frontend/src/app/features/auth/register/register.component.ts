import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { KeycloakAuthService } from '../../../core/services/keycloak-auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DividerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly keycloakAuthService = inject(KeycloakAuthService);
  private readonly keycloakUrl = `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/registrations`;
  private readonly clientId = environment.keycloakClientId;
  private readonly redirectUri = `${environment.appUrl}/auth/login-landing`;

  redirectToKeycloakRegistration(): void {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      kc_locale: 'en'
    });
    
    window.location.href = `${this.keycloakUrl}?${params.toString()}`;
  }

  registerWithGoogle(): void {
    this.keycloakAuthService.loginWithGoogle();
  }
}