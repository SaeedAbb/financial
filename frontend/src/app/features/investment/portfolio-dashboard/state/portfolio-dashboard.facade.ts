import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Portfolio, PortfolioStatistics } from '../../../../core/models/portfolio.model';
import { PortfolioDashboardStateService } from './portfolio-dashboard.state';
import { PortfolioFormService } from '../services/portfolio-form.service';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { ConfirmationService } from 'primeng/api';
import { 
  CurrencyFormatter, 
  PercentageFormatter, 
  DateFormatter, 
  StyleUtils 
} from '../../../../shared/utils';

/**
 * Facade service for portfolio dashboard
 * Provides a clean API for the component to interact with state and services
 */
@Injectable()
export class PortfolioDashboardFacade {
  private state = inject(PortfolioDashboardStateService);
  private formService = inject(PortfolioFormService);
  private portfolioService = inject(PortfolioService);
  private confirmationService = inject(ConfirmationService);
  
  // Expose state observables
  readonly portfolios$ = this.state.portfolios$;
  readonly portfolioSummary$ = this.state.portfolioSummary$;
  readonly loading$ = this.state.loading$;
  readonly loadingSummary$ = this.state.loadingSummary$;
  readonly loadingStatistics$ = this.state.loadingStatistics$;
  readonly anyLoading$ = this.state.anyLoading$;
  readonly error$ = this.state.error$;
  
  // Expose form state
  readonly formState$ = this.formService.formState$;
  readonly form = this.formService.form;
  
  // Computed observables
  readonly hasPortfolios$ = this.portfolios$.pipe(
    map(portfolios => portfolios.length > 0)
  );
  
  readonly totalPortfolios$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalPortfolios || 0)
  );
  
  readonly totalInvestment$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalInvestment || 0)
  );
  
  readonly totalCurrentValue$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalCurrentValue || 0)
  );
  
  readonly totalGainLoss$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalGainLoss || 0)
  );
  
  readonly totalGainLossPercentage$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalGainLossPercentage || 0)
  );
  
  readonly totalActivePositions$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalActivePositions || 0)
  );
  
  readonly totalDistinctStocks$ = this.portfolioSummary$.pipe(
    map(summary => summary?.totalDistinctStocks || 0)
  );
  
  /**
   * Initialize the dashboard
   */
  init(): void {
    this.state.refresh();
  }
  
  /**
   * Refresh all data
   */
  refresh(): void {
    this.state.refresh();
  }
  
  /**
   * Show create portfolio dialog
   */
  showCreateDialog(): void {
    this.formService.showCreateDialog();
  }
  
  /**
   * Show edit portfolio dialog
   */
  showEditDialog(portfolio: Portfolio): void {
    this.formService.showEditDialog(portfolio);
  }
  
  /**
   * Hide portfolio dialog
   */
  hideDialog(): void {
    this.formService.hideDialog();
  }
  
  /**
   * Submit portfolio form
   */
  submitForm(): void {
    this.formService.submit().subscribe();
  }
  
  /**
   * Delete portfolio with confirmation
   */
  deletePortfolio(portfolio: Portfolio): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the portfolio "${portfolio.name}"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.portfolioService.deletePortfolio(portfolio.uuid).subscribe();
      }
    });
  }
  
  /**
   * Get portfolio statistics
   */
  getPortfolioStatistics(portfolioUuid: string): Observable<PortfolioStatistics | null> {
    return this.state.getPortfolioStatistics(portfolioUuid);
  }
  
  // Formatting methods using shared utilities
  formatCurrency(amount: number): string {
    return CurrencyFormatter.formatCurrency(amount);
  }
  
  formatCurrencyCompact(amount: number): string {
    return CurrencyFormatter.formatCurrencyCompact(amount);
  }
  
  formatPercentage(percentage: number): string {
    return PercentageFormatter.formatPercentage(percentage);
  }
  
  formatDate(dateString: string): string {
    return DateFormatter.formatDate(dateString);
  }
  
  getRelativeDateString(dateString: string): string {
    return DateFormatter.getRelativeDateString(dateString);
  }
  
  getGainLossColorClass(gainLoss: number): string {
    return StyleUtils.getGainLossColorClass(gainLoss);
  }
  
  getPerformanceSeverity(gainLoss: number): 'success' | 'danger' | 'info' {
    return StyleUtils.getPerformanceSeverity(gainLoss);
  }
  
  getPerformanceBadgeClass(gainLoss: number): string {
    return StyleUtils.getPerformanceBadgeClass(gainLoss);
  }
  
  // Form helper methods
  get formTitle(): string {
    return this.formService.formTitle;
  }
  
  get submitLabel(): string {
    return this.formService.submitLabel;
  }
  
  get isFormSubmitting(): boolean {
    return this.formService.isSubmitting;
  }
  
  hasFormError(controlName: string, errorName?: string): boolean {
    return this.formService.hasError(controlName, errorName);
  }
  
  getFormErrorMessage(controlName: string): string {
    return this.formService.getErrorMessage(controlName);
  }
}