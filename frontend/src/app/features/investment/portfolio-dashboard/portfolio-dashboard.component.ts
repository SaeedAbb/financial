import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { Portfolio, PortfolioStatistics } from '../../../core/models/portfolio.model';
import { PortfolioDashboardStateService } from './state/portfolio-dashboard.state';
import { PortfolioDashboardFacade } from './state/portfolio-dashboard.facade';
import { PortfolioFormService } from './services/portfolio-form.service';

/**
 * Portfolio Dashboard Component
 * Refactored to follow Angular best practices with:
 * - OnPush change detection for better performance
 * - Facade pattern for clean component API
 * - State management separated from component
 * - All business logic moved to services
 * - Async pipe used throughout template
 */
@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  templateUrl: './portfolio-dashboard.component.html',
  styleUrls: ['./portfolio-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    SkeletonModule
  ],
  providers: [
    MessageService,
    ConfirmationService,
    PortfolioDashboardStateService,
    PortfolioDashboardFacade,
    PortfolioFormService
  ]
})
export class PortfolioDashboardComponent implements OnInit {
  protected readonly facade = inject(PortfolioDashboardFacade);
  private readonly router = inject(Router);
  
  // Expose observables for template
  readonly portfolios$ = this.facade.portfolios$;
  readonly portfolioSummary$ = this.facade.portfolioSummary$;
  readonly loading$ = this.facade.loading$;
  readonly loadingSummary$ = this.facade.loadingSummary$;
  readonly loadingStatistics$ = this.facade.loadingStatistics$;
  readonly anyLoading$ = this.facade.anyLoading$;
  readonly error$ = this.facade.error$;
  readonly hasPortfolios$ = this.facade.hasPortfolios$;
  
  // Summary observables
  readonly totalPortfolios$ = this.facade.totalPortfolios$;
  readonly totalInvestment$ = this.facade.totalInvestment$;
  readonly totalCurrentValue$ = this.facade.totalCurrentValue$;
  readonly totalGainLoss$ = this.facade.totalGainLoss$;
  readonly totalGainLossPercentage$ = this.facade.totalGainLossPercentage$;
  readonly totalActivePositions$ = this.facade.totalActivePositions$;
  readonly totalDistinctStocks$ = this.facade.totalDistinctStocks$;
  
  // Form related
  readonly formState$ = this.facade.formState$;
  readonly form = this.facade.form;
  
  ngOnInit(): void {
    this.facade.init();
  }
  
  /**
   * Navigate to portfolio detail page
   */
  viewPortfolio(portfolio: Portfolio): void {
    this.router.navigate(['/investment/portfolios', portfolio.uuid]);
  }
  
  /**
   * Navigate to statement import page
   */
  navigateToImport(): void {
    this.router.navigate(['/investment/portfolios/import']);
  }
  
  /**
   * Get portfolio statistics as observable
   */
  getPortfolioStatistics$(portfolioUuid: string): Observable<PortfolioStatistics | null> {
    return this.facade.getPortfolioStatistics(portfolioUuid);
  }
  
  /**
   * Track by function for ngFor performance
   */
  trackByPortfolioUuid(index: number, portfolio: Portfolio): string {
    return portfolio.uuid;
  }
  
  /**
   * Track by function for table rows
   */
  trackByIndex(index: number): number {
    return index;
  }
}