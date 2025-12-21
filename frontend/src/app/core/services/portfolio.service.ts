import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioSummary,
  PagedPortfolios
} from '../models/portfolio.model';
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
    return this.http.get<Portfolio[]>(`${this.apiUrl}/all`);
  }

  /**
   * Get a specific portfolio by UUID
   */
  getPortfolioByUuid(uuid: string): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.apiUrl}/${uuid}`);
  }

  /**
   * Update an existing portfolio
   */
  updatePortfolio(uuid: string, portfolioData: UpdatePortfolioRequest): Observable<Portfolio> {
    return this.http.put<Portfolio>(`${this.apiUrl}/${uuid}`, portfolioData).pipe(
      tap(() => this.notifyPortfoliosUpdated())
    );
  }

  /**
   * Delete a portfolio and all associated stocks and transactions
   */
  deletePortfolio(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uuid}`).pipe(
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
   * Get portfolios summary (totals, counts, etc.)
   */
  getPortfoliosSummary(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(`${this.apiUrl}/summary`);
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
   * Calculate portfolio performance metrics
   */
  calculatePerformanceMetrics(portfolio: Portfolio) {
    return {
      totalValue: portfolio.totalInvestment + portfolio.totalGainLoss,
      isProfit: portfolio.totalGainLoss > 0,
      isLoss: portfolio.totalGainLoss < 0,
      hasStocks: portfolio.activeStocksCount > 0 || portfolio.soldStocksCount > 0
    };
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
}
