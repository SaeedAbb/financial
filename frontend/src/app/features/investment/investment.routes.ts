import { Routes } from '@angular/router';

export const investmentRoutes: Routes = [
  {
    path: '',
    redirectTo: 'portfolios',
    pathMatch: 'full'
  },
  {
    path: 'portfolios',
    loadComponent: () => import('./portfolio-dashboard/portfolio-dashboard.component')
      .then(c => c.PortfolioDashboardComponent),
    title: 'Investment Portfolios'
  },
  {
    path: 'portfolios/:uuid',
    loadComponent: () => import('./portfolio-detail/portfolio-detail.component')
      .then(c => c.PortfolioDetailComponent),
    title: 'Portfolio Details'
  }
];