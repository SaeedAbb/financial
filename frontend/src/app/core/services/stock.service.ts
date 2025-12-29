import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  Stock,
  BuyStockRequest,
  SellStockRequest,
  StockSummary,
  PagedStocks,
  StockStatus
} from '../models/stock.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/stocks`;

  // Subject to track when stocks data changes (for refreshing lists)
  private stocksUpdated$ = new BehaviorSubject<void>(undefined);
  public stocksUpdated = this.stocksUpdated$.asObservable();

  /**
   * Buy a stock (add to portfolio)
   */
  buyStock(stockData: BuyStockRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.apiUrl}/buy`, stockData).pipe(
      tap(() => this.notifyStocksUpdated())
    );
  }

  /**
   * Sell a stock
   */
  sellStock(stockData: SellStockRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.apiUrl}/sell`, stockData).pipe(
      tap(() => this.notifyStocksUpdated())
    );
  }

  /**
   * Get all stocks in a portfolio
   */
  getPortfolioStocks(portfolioUuid: string): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/portfolio/${portfolioUuid}`);
  }

  /**
   * Get stocks in a portfolio with pagination
   */
  getPortfolioStocksPaginated(portfolioUuid: string, page = 0, size = 10, sortBy = 'purchaseDate', sortDir = 'desc'): Observable<PagedStocks> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedStocks>(`${this.apiUrl}/portfolio/${portfolioUuid}/paginated`, { params });
  }

  /**
   * Get active stocks in a portfolio
   */
  getActivePortfolioStocks(portfolioUuid: string): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/portfolio/${portfolioUuid}/active`);
  }

  /**
   * Get sold stocks in a portfolio
   */
  getSoldPortfolioStocks(portfolioUuid: string): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/portfolio/${portfolioUuid}/sold`);
  }

  /**
   * Get a specific stock by UUID
   */
  getStockByUuid(uuid: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/${uuid}`);
  }

  /**
   * Get all stocks for a specific symbol across all portfolios
   */
  getStocksBySymbol(symbol: string): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/symbol/${symbol}`);
  }

  /**
   * Get stocks within a date range
   */
  getStocksInDateRange(startDate: string, endDate: string): Observable<Stock[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<Stock[]>(`${this.apiUrl}/date-range`, { params });
  }

  /**
   * Get distinct stock symbols for the user
   */
  getDistinctSymbols(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/symbols`);
  }

  /**
   * Get stocks summary (totals, counts, etc.)
   */
  getStocksSummary(): Observable<StockSummary> {
    return this.http.get<StockSummary>(`${this.apiUrl}/summary`);
  }

  /**
   * Delete a stock (administrative function)
   */
  deleteStock(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uuid}`).pipe(
      tap(() => this.notifyStocksUpdated())
    );
  }

  /**
   * Refresh stocks data (triggers update notification)
   */
  refreshStocks(): void {
    this.notifyStocksUpdated();
  }

  /**
   * Notify components that stocks data has been updated
   */
  private notifyStocksUpdated(): void {
    this.stocksUpdated$.next();
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
   * Get stock status color class for styling
   */
  getStatusColorClass(status: StockStatus): string {
    switch (status) {
      case StockStatus.ACTIVE:
        return 'text-green-500';
      case StockStatus.SOLD:
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Calculate stock performance metrics
   */
  calculateStockMetrics(stock: Stock) {
    const isProfit = stock.gainLoss > 0;
    const isLoss = stock.gainLoss < 0;

    return {
      totalValue: stock.status === StockStatus.ACTIVE ? stock.investmentValue : (stock.salePrice! * stock.quantity),
      isProfit,
      isLoss,
      isSold: stock.status === StockStatus.SOLD,
      daysSincepurchase: this.calculateDaysBetween(stock.purchaseDate, new Date().toISOString().split('T')[0]),
      daysSinceSale: stock.saleDate ? this.calculateDaysBetween(stock.saleDate, new Date().toISOString().split('T')[0]) : null
    };
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate stock symbol
   */
  validateStockSymbol(symbol: string): boolean {
    return !!(symbol && symbol.trim().length > 0 && symbol.trim().length <= 20 && 
             /^[A-Z0-9.-]+$/.test(symbol.trim()));
  }

  /**
   * Validate company name
   */
  validateCompanyName(companyName: string): boolean {
    return !!(companyName && companyName.trim().length > 0 && companyName.trim().length <= 255);
  }

  /**
   * Validate stock quantity
   */
  validateQuantity(quantity: number): boolean {
    return quantity > 0 && quantity <= 999999999;
  }

  /**
   * Validate stock price
   */
  validatePrice(price: number): boolean {
    return price > 0 && price <= 999999999999.99;
  }

  /**
   * Validate stock date (not in future)
   */
  validateDate(dateString: string): boolean {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return inputDate <= today;
  }

  /**
   * Validate sale date (not before purchase date, not in future)
   */
  validateSaleDate(saleDate: string, purchaseDate: string): boolean {
    const sale = new Date(saleDate);
    const purchase = new Date(purchaseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return sale >= purchase && sale <= today;
  }

  /**
   * Format stock symbol for display (uppercase)
   */
  formatSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  /**
   * Generate stock tooltip text
   */
  generateStockTooltip(stock: Stock): string {
    // Note: metrics was previously calculated but not used
    const purchaseDateFormatted = this.formatDate(stock.purchaseDate);
    const investmentValue = this.formatAmount(stock.investmentValue);

    let tooltip = `${stock.companyName} (${stock.symbol})\n`;
    tooltip += `Purchased: ${purchaseDateFormatted}\n`;
    tooltip += `Investment: ${investmentValue}\n`;
    tooltip += `Quantity: ${stock.quantity}\n`;

    if (stock.status === StockStatus.SOLD && stock.saleDate && stock.salePrice) {
      const saleValue = this.formatAmount(stock.salePrice * stock.quantity);
      const gainLoss = this.formatAmount(stock.gainLoss);
      const percentage = this.formatPercentage(stock.gainLossPercentage);

      tooltip += `Sold: ${this.formatDate(stock.saleDate)}\n`;
      tooltip += `Sale Value: ${saleValue}\n`;
      tooltip += `Gain/Loss: ${gainLoss} (${percentage})`;
    }

    return tooltip;
  }
}
