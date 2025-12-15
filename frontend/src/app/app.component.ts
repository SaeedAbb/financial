import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakAuthService } from './core/services/keycloak-auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly keycloakAuthService = inject(KeycloakAuthService);
  private readonly router = inject(Router);
  
  isLoading = true;

  ngOnInit() {
    setTimeout(() => {
      this.checkAuthenticationAndRoute();
      this.isLoading = false;
    }, 100);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAuthenticationAndRoute();
      });
  }

  private checkAuthenticationAndRoute() {
    const isLoggedIn = this.keycloakAuthService.isAuthenticated();
    const currentUrl = this.router.url;

    if (isLoggedIn && (currentUrl.startsWith('/auth') || currentUrl === '/')) {
      this.router.navigate(['/dashboard']);
    } else if (!isLoggedIn && !currentUrl.startsWith('/auth')) {
      this.router.navigate(['/auth']);
    }
  }
}
