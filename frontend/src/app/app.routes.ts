import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/login-landing/login-landing.component').then(m => m.LoginLandingComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./core/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'savings',
        loadComponent: () => import('./features/savings/savings.component').then(m => m.SavingsComponent)
      },
      {
        path: 'investment',
        loadComponent: () => import('./features/investment/investment.component').then(m => m.InvestmentComponent)
      },
      {
        path: 'income',
        loadComponent: () => import('./features/income/income.component').then(m => m.IncomeComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
