import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { PortfolioPosition } from '../../../../core/models/portfolio-position.model';
import { StockMaster } from '../../../../core/models/stock-master.model';
import { PortfolioDetailStateService } from './portfolio-detail.state';
import { PositionFormService } from '../services/position-form.service';
import { StockSearchService } from '../services/stock-search.service';
import { PortfolioPositionService } from '../../../../core/services/portfolio-position.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  CurrencyFormatter, 
  PercentageFormatter, 
  DateFormatter, 
  StyleUtils,
  NumberFormatter
} from '../../../../shared/utils';

/**
 * Facade service for portfolio detail
 * Provides a clean API for the component to interact with state and services
 */
@Injectable()
export class PortfolioDetailFacade {
  private state = inject(PortfolioDetailStateService);
  private positionFormService = inject(PositionFormService);
  private stockSearchService = inject(StockSearchService);
  private portfolioPositionService = inject(PortfolioPositionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  
  // Expose state observables
  readonly portfolio$ = this.state.portfolio$;
  readonly positions$ = this.state.positions$;
  readonly activePositions$ = this.state.activePositions$;
  readonly closedPositions$ = this.state.closedPositions$;
  readonly filteredPositions$ = this.state.filteredPositions$;
  readonly selectedPositionForTransactions$ = this.state.selectedPositionForTransactions$;
  readonly loading$ = this.state.loading$;
  readonly loadingPositions$ = this.state.loadingPositions$;
  readonly anyLoading$ = this.state.anyLoading$;
  readonly error$ = this.state.error$;
  readonly showTransactionSidebar$ = this.state.showTransactionSidebar$;
  readonly portfolioStats$ = this.state.portfolioStats$;
  
  // Expose form states
  readonly buyFormState$ = this.positionFormService.buyFormState$;
  readonly sellFormState$ = this.positionFormService.sellFormState$;
  readonly buyForm = this.positionFormService.buyForm;
  readonly sellForm = this.positionFormService.sellForm;
  readonly today = this.positionFormService.today;
  
  // Expose stock search
  readonly stockSuggestions$ = this.stockSearchService.stockSuggestions$;
  readonly searchingStocks$ = this.stockSearchService.searching;
  
  /**
   * Initialize the detail page with portfolio UUID
   */
  init(portfolioUuid: string): void {
    this.state.loadPortfolio(portfolioUuid).pipe(
      switchMap(portfolio => {
        if (portfolio) {
          return this.state.loadPositions(portfolioUuid);
        }
        return of([]);
      }),
      take(1)
    ).subscribe();
  }
  
  /**
   * Refresh all data
   */
  refresh(): void {
    this.state.refresh();
  }
  
  /**
   * Navigate back to portfolios list
   */
  goBack(): void {
    this.router.navigate(['/investment']);
  }
  
  /**
   * Show buy position dialog
   */
  showBuyPositionDialog(): void {
    this.positionFormService.showBuyDialog();
  }
  
  /**
   * Show sell position dialog
   */
  showSellPositionDialog(position: PortfolioPosition): void {
    this.positionFormService.showSellDialog(position);
  }
  
  /**
   * Hide buy dialog
   */
  hideBuyDialog(): void {
    this.positionFormService.hideBuyDialog();
  }
  
  /**
   * Hide sell dialog
   */
  hideSellDialog(): void {
    this.positionFormService.hideSellDialog();
  }
  
  /**
   * Submit buy form
   */
  submitBuyForm(): void {
    const portfolio = this.state.currentState.portfolio;
    if (portfolio) {
      this.positionFormService.submitBuy(portfolio.uuid).subscribe();
    }
  }
  
  /**
   * Submit sell form
   */
  submitSellForm(): void {
    const portfolio = this.state.currentState.portfolio;
    if (portfolio) {
      this.positionFormService.submitSell(portfolio.uuid).subscribe();
    }
  }
  
  /**
   * Search stocks
   */
  searchStocks(query: string): void {
    this.stockSearchService.search(query);
  }
  
  /**
   * Handle position row click
   */
  onPositionRowClick(position: PortfolioPosition): void {
    this.state.setSelectedPositionForTransactions(position);
  }
  
  /**
   * Handle transaction sidebar visibility change
   */
  onTransactionSidebarVisibilityChange(visible: boolean): void {
    this.state.setTransactionSidebarVisibility(visible);
  }
  
  /**
   * Set position filter text
   */
  setFilterText(filterText: string): void {
    this.state.setFilterText(filterText);
  }
  
  /**
   * Set position filter status
   */
  setFilterStatus(filterStatus: 'all' | 'active' | 'closed'): void {
    this.state.setFilterStatus(filterStatus);
  }
  
  // Formatting methods using shared utilities
  formatAmount(amount: number): string {
    return CurrencyFormatter.formatCurrency(amount);
  }
  
  formatCurrency(amount: number): string {
    return CurrencyFormatter.formatCurrency(amount);
  }
  
  formatPercentage(percentage: number): string {
    return PercentageFormatter.formatPercentage(percentage);
  }
  
  formatQuantity(quantity: number): string {
    return NumberFormatter.formatQuantity(quantity);
  }
  
  formatDate(dateString: string): string {
    return DateFormatter.formatDate(dateString);
  }
  
  getGainLossColorClass(gainLoss: number): string {
    return StyleUtils.getGainLossColorClass(gainLoss);
  }
  
  getPerformanceSeverity(gainLoss: number): 'success' | 'danger' | 'info' {
    return StyleUtils.getPerformanceSeverity(gainLoss);
  }
  
  // Form helper methods - Buy Form
  get isBuyFormSubmitting(): boolean {
    return this.positionFormService.isBuySubmitting;
  }
  
  get selectedStock(): StockMaster | null {
    return this.positionFormService.getSelectedStock();
  }
  
  setSelectedStock(stock: StockMaster | null): void {
    this.positionFormService.setSelectedStock(stock);
  }
  
  hasBuyFormError(controlName: string, errorName?: string): boolean {
    return this.positionFormService.hasBuyError(controlName, errorName);
  }
  
  getBuyFormErrorMessage(controlName: string): string {
    return this.positionFormService.getBuyErrorMessage(controlName);
  }
  
  // Form helper methods - Sell Form
  get isSellFormSubmitting(): boolean {
    return this.positionFormService.isSellSubmitting;
  }
  
  get selectedPosition(): PortfolioPosition | null {
    return this.positionFormService.currentSellState.position;
  }
  
  hasSellFormError(controlName: string, errorName?: string): boolean {
    return this.positionFormService.hasSellError(controlName, errorName);
  }
  
  getSellFormErrorMessage(controlName: string): string {
    return this.positionFormService.getSellErrorMessage(controlName);
  }
  
  // Stock search helpers
  getStockDisplayName(stock: StockMaster | null): string {
    return this.stockSearchService.getStockDisplayName(stock);
  }
  
  /**
   * Track by function for positions
   */
  trackByPositionUuid(index: number, position: PortfolioPosition): string {
    return position.uuid;
  }
  
  /**
   * Track by function for general items
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Delete a position from the portfolio
   */
  deletePosition(position: PortfolioPosition): void {
    const hasShares = position.quantity > 0;
    const warningMessage = hasShares 
      ? `Are you sure you want to permanently delete this ${position.stock.symbol} position? You still have ${position.quantity} shares worth ${this.formatAmount(position.currentValue || position.totalCost)}. This will remove all history and cannot be undone.`
      : `Are you sure you want to permanently delete this ${position.stock.symbol} position? This will remove all history and cannot be undone.`;
    
    this.confirmationService.confirm({
      message: warningMessage,
      header: 'Confirm Permanent Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Get portfolio UUID from the current portfolio in state
        this.portfolio$.pipe(take(1)).subscribe(portfolio => {
          if (!portfolio?.uuid || !position.uuid) return;
          
          this.portfolioPositionService.deletePosition(portfolio.uuid, position.uuid).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Position Deleted',
                detail: `${position.stock.symbol} position has been deleted successfully`
              });
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Delete Failed',
                detail: error.error?.message || 'Failed to delete position'
              });
            }
          });
        });
      }
    });
  }
}