import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Router } from '@angular/router';
import { KeycloakAuthService } from './core/services/keycloak-auth.service';

describe('AppComponent', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockKeycloakAuthService: jasmine.SpyObj<KeycloakAuthService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: { pipe: () => ({ subscribe: () => { /* Empty handler for testing */ } }) },
      url: '/'
    });
    
    mockKeycloakAuthService = jasmine.createSpyObj('KeycloakAuthService', ['isAuthenticated', 'login', 'getCurrentUser']);
    mockKeycloakAuthService.isAuthenticated.and.returnValue(false);
    mockKeycloakAuthService.getCurrentUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: KeycloakAuthService, useValue: mockKeycloakAuthService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.isLoading).toBeTruthy();
  });
});
