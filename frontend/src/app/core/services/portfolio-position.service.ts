import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  PortfolioPosition,
  BuyPositionRequest,
  SellPositionRequest,
  PagedPositions,
  PositionStatus
} from '../models/portfolio-position.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PortfolioPositionService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/portfolios`;

  // Subject to track when positions data changes (for refreshing lists)
  private positionsUpdated$ = new BehaviorSubject<void>(undefined);
  public positionsUpdated = this.positionsUpdated$.asObservable();

  /**
   * Buy a new position in a portfolio
   */
  buyPosition(portfolioUuid: string, positionData: BuyPositionRequest): Observable<PortfolioPosition> {
    return this.http.post<PortfolioPosition>(`${this.apiUrl}/uuid/${portfolioUuid}/positions`, positionData).pipe(
      tap(() => this.notifyPositionsUpdated())
    );
  }

  /**
   * Get all positions for a specific portfolio
   */
  getPortfolioPositions(portfolioUuid: string): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(`${this.apiUrl}/uuid/${portfolioUuid}/positions`);
  }

  /**
   * Get paginated positions for a specific portfolio
   */
  getPortfolioPositionsPaged(portfolioUuid: string, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<PagedPositions> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedPositions>(`${this.apiUrl}/uuid/${portfolioUuid}/positions`, { params });
  }

  /**
   * Get a specific position by UUID
   */
  getPositionByUuid(portfolioUuid: string, positionUuid: string): Observable<PortfolioPosition> {
    return this.http.get<PortfolioPosition>(`${this.apiUrl}/uuid/${portfolioUuid}/positions/${positionUuid}`);
  }

  /**
   * Sell part or all of a position
   */
  sellPosition(portfolioUuid: string, positionUuid: string, sellData: SellPositionRequest): Observable<PortfolioPosition> {
    return this.http.post<PortfolioPosition>(`${this.apiUrl}/uuid/${portfolioUuid}/positions/${positionUuid}/sell`, sellData).pipe(
      tap(() => this.notifyPositionsUpdated())
    );
  }

  /**
   * Get positions filtered by status
   */
  getPositionsByStatus(portfolioUuid: string, status: PositionStatus): Observable<PortfolioPosition[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<PortfolioPosition[]>(`${this.apiUrl}/uuid/${portfolioUuid}/positions`, { params });
  }

  /**
   * Search positions by stock symbol
   */
  searchPositions(portfolioUuid: string, symbol: string): Observable<PortfolioPosition[]> {
    const params = new HttpParams().set('symbol', symbol);
    return this.http.get<PortfolioPosition[]>(`${this.apiUrl}/uuid/${portfolioUuid}/positions/search`, { params });
  }

  /**
   * Refresh positions data (triggers update notification)
   */
  refreshPositions(): void {
    this.notifyPositionsUpdated();
  }

  /**
   * Notify components that positions data has been updated
   */
  private notifyPositionsUpdated(): void {
    this.positionsUpdated$.next();
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
   * Calculate position metrics
   */
  calculatePositionMetrics(position: PortfolioPosition) {
    return {
      isProfit: position.unrealizedGainLoss > 0,
      isLoss: position.unrealizedGainLoss < 0,
      canSell: position.status === PositionStatus.ACTIVE && position.quantity > 0
    };
  }

  /**
   * Validate buy position request
   */
  validateBuyPositionRequest(request: BuyPositionRequest): boolean {
    return !!(
      request.stockSymbol && request.stockSymbol.trim().length > 0 &&
      request.quantity && request.quantity > 0 &&
      request.pricePerShare && request.pricePerShare > 0 &&
      request.transactionDate && request.transactionDate.length > 0
    );
  }

  /**
   * Validate sell position request
   */
  validateSellPositionRequest(request: SellPositionRequest, availableQuantity: number): boolean {
    return !!(
      request.quantity && request.quantity > 0 && request.quantity <= availableQuantity &&
      request.pricePerShare && request.pricePerShare > 0 &&
      request.transactionDate && request.transactionDate.length > 0
    );
  }
}