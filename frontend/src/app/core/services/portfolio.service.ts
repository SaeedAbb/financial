import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PagedPortfolios,
  PortfolioStatistics,
  PortfolioSummary
} from '../models/portfolio.model';
import { StockGroup } from '../models/stock-group.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/portfolios`;

  // Subject to track when portfolios data changes (for refreshing lists)
  private portfoliosUpdated$ = new BehaviorSubject<void>(undefined);
  public portfoliosUpdated = this.portfoliosUpdated$.asObservable();

  /**
   * Create a new portfolio
   */
  createPortfolio(portfolioData: CreatePortfolioRequest): Observable<Portfolio> {
    return this.http.post<Portfolio>(this.apiUrl, portfolioData).pipe(
      tap(() => this.notifyPortfoliosUpdated())
    );
  }

  /**
   * Get paginated portfolios for the current user
   */
  getPortfolios(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<PagedPortfolios> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedPortfolios>(this.apiUrl, { params });
  }

  /**
   * Get all portfolios for the current user (no pagination)
   */
  getAllPortfolios(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(this.apiUrl);
  }

  /**
   * Get a specific portfolio by UUID
   */
  getPortfolioByUuid(uuid: string): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.apiUrl}/uuid/${uuid}`);
  }

  /**
   * Update an existing portfolio
   */
  updatePortfolio(uuid: string, portfolioData: UpdatePortfolioRequest): Observable<Portfolio> {
    return this.http.put<Portfolio>(`${this.apiUrl}/uuid/${uuid}`, portfolioData).pipe(
      tap(() => this.notifyPortfoliosUpdated())
    );
  }

  /**
   * Delete a portfolio and all associated stocks and transactions
   */
  deletePortfolio(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/uuid/${uuid}`).pipe(
      tap(() => this.notifyPortfoliosUpdated())
    );
  }

  /**
   * Search portfolios by name
   */
  searchPortfolios(name: string): Observable<Portfolio[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Portfolio[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Refresh portfolios data (triggers update notification)
   */
  refreshPortfolios(): void {
    this.notifyPortfoliosUpdated();
  }

  /**
   * Notify components that portfolios data has been updated
   */
  private notifyPortfoliosUpdated(): void {
    this.portfoliosUpdated$.next();
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(percentage: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(percentage / 100);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format datetime for display
   */
  formatDateTime(dateTimeString: string): string {
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get gain/loss color class for styling
   */
  getGainLossColorClass(gainLoss: number): string {
    if (gainLoss > 0) return 'text-green-500';
    if (gainLoss < 0) return 'text-red-500';
    return 'text-gray-500';
  }

  /**
   * Get gain/loss icon for styling
   */
  getGainLossIcon(gainLoss: number): string {
    if (gainLoss > 0) return 'pi pi-trending-up';
    if (gainLoss < 0) return 'pi pi-trending-down';
    return 'pi pi-minus';
  }


  /**
   * Validate portfolio name
   */
  validatePortfolioName(name: string): boolean {
    return !!(name && name.trim().length > 0 && name.trim().length <= 100);
  }

  /**
   * Validate portfolio description
   */
  validatePortfolioDescription(description: string | undefined): boolean {
    return !description || description.length <= 1000;
  }

  // ========== Portfolio Statistics Methods ==========

  /**
   * Get comprehensive statistics for a specific portfolio
   */
  getPortfolioStatistics(uuid: string): Observable<PortfolioStatistics> {
    return this.http.get<PortfolioStatistics>(`${this.apiUrl}/${uuid}/statistics`);
  }

  /**
   * Get summary statistics for all user portfolios
   */
  getPortfoliosSummary(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(`${this.apiUrl}/summary`);
  }

  // ========== Stock Grouping Methods ==========

  /**
   * Get all stock groups for a portfolio
   */
  getStockGroups(
    uuid: string, 
    search?: string, 
    sortBy = 'symbol', 
    sortDir = 'asc'
  ): Observable<StockGroup[]> {
    let params = new HttpParams()
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<StockGroup[]>(`${this.apiUrl}/${uuid}/stock-groups`, { params });
  }

  /**
   * Get a specific stock group for a portfolio
   */
  getStockGroup(uuid: string, symbol: string): Observable<StockGroup> {
    return this.http.get<StockGroup>(`${this.apiUrl}/${uuid}/stock-groups/${symbol}`);
  }

  // ========== Enhanced Utility Methods ==========

  /**
   * Format currency amount (changed to USD)
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format large currency amounts with K, M, B suffixes
   */
  formatCurrencyCompact(amount: number): string {
    if (Math.abs(amount) >= 1e9) {
      return this.formatCurrency(amount / 1e9) + 'B';
    } else if (Math.abs(amount) >= 1e6) {
      return this.formatCurrency(amount / 1e6) + 'M';
    } else if (Math.abs(amount) >= 1e3) {
      return this.formatCurrency(amount / 1e3) + 'K';
    } else {
      return this.formatCurrency(amount);
    }
  }

  /**
   * Format quantity with appropriate decimal places
   */
  formatQuantity(quantity: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: quantity >= 1 ? 2 : 6
    }).format(quantity);
  }

  /**
   * Get performance severity for PrimeNG components
   */
  getPerformanceSeverity(gainLoss: number): 'success' | 'danger' | 'info' {
    if (gainLoss > 0) return 'success';
    if (gainLoss < 0) return 'danger';
    return 'info';
  }

  /**
   * Get performance badge class
   */
  getPerformanceBadgeClass(gainLoss: number): string {
    if (gainLoss > 0) return 'bg-green-100 text-green-800';
    if (gainLoss < 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Calculate days since date
   */
  getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get relative date string (e.g., "2 days ago")
   */
  getRelativeDateString(dateString: string): string {
    const days = this.getDaysSince(dateString);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  /**
   * Validate percentage (0-100)
   */
  validatePercentage(percentage: number): boolean {
    return !isNaN(percentage) && percentage >= -100 && percentage <= 1000;
  }

  /**
   * Validate currency amount (positive)
   */
  validateCurrencyAmount(amount: number): boolean {
    return !isNaN(amount) && amount >= 0 && amount <= 1000000000; // Max 1 billion
  }
}
