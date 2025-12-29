import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import {
  StockMaster,
  CreateStockMasterRequest,
  PagedStockMasters,
  MarketCapCategory
} from '../models/stock-master.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockMasterService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/stocks/master`;

  // Subject to track when stock masters data changes (for refreshing lists)
  private stockMastersUpdated$ = new BehaviorSubject<void>(undefined);
  public stockMastersUpdated = this.stockMastersUpdated$.asObservable();

  /**
   * Create a new stock master record
   */
  createStockMaster(stockData: CreateStockMasterRequest): Observable<StockMaster> {
    return this.http.post<StockMaster>(this.apiUrl, stockData).pipe(
      tap(() => this.notifyStockMastersUpdated())
    );
  }

  /**
   * Get paginated stock masters
   */
  getStockMasters(page = 0, size = 10, sortBy = 'symbol', sortDir = 'asc'): Observable<PagedStockMasters> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedStockMasters>(this.apiUrl, { params });
  }

  /**
   * Get all stock masters (no pagination)
   */
  getAllStockMasters(): Observable<StockMaster[]> {
    return this.http.get<StockMaster[]>(`${this.apiUrl}/all`);
  }

  /**
   * Get a specific stock master by symbol
   */
  getStockMasterBySymbol(symbol: string): Observable<StockMaster> {
    return this.http.get<StockMaster>(`${this.apiUrl}/symbol/${symbol}`);
  }

  /**
   * Get a specific stock master by ID
   */
  getStockMasterById(id: number): Observable<StockMaster> {
    return this.http.get<StockMaster>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update an existing stock master
   */
  updateStockMaster(id: number, stockData: CreateStockMasterRequest): Observable<StockMaster> {
    return this.http.put<StockMaster>(`${this.apiUrl}/${id}`, stockData).pipe(
      tap(() => this.notifyStockMastersUpdated())
    );
  }

  /**
   * Delete a stock master
   */
  deleteStockMaster(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.notifyStockMastersUpdated())
    );
  }

  /**
   * Search stock masters by symbol or company name
   */
  searchStockMasters(query: string): Observable<StockMaster[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<StockMaster[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Get stock masters by market cap category
   */
  getStockMastersByMarketCap(marketCapCategory: MarketCapCategory): Observable<StockMaster[]> {
    const params = new HttpParams().set('marketCapCategory', marketCapCategory);
    return this.http.get<StockMaster[]>(`${this.apiUrl}/by-market-cap`, { params });
  }

  /**
   * Get stock masters by sector
   */
  getStockMastersBySector(sector: string): Observable<StockMaster[]> {
    const params = new HttpParams().set('sector', sector);
    return this.http.get<StockMaster[]>(`${this.apiUrl}/by-sector`, { params });
  }

  /**
   * Get stock masters by exchange
   */
  getStockMastersByExchange(exchange: string): Observable<StockMaster[]> {
    const params = new HttpParams().set('exchange', exchange);
    return this.http.get<StockMaster[]>(`${this.apiUrl}/by-exchange`, { params });
  }

  /**
   * Refresh stock masters data (triggers update notification)
   */
  refreshStockMasters(): void {
    this.notifyStockMastersUpdated();
  }

  /**
   * Notify components that stock masters data has been updated
   */
  private notifyStockMastersUpdated(): void {
    this.stockMastersUpdated$.next();
  }

  /**
   * Validate stock master data
   */
  validateStockMaster(stockData: CreateStockMasterRequest): boolean {
    return !!(
      stockData.symbol && stockData.symbol.trim().length > 0 &&
      stockData.companyName && stockData.companyName.trim().length > 0
    );
  }

  /**
   * Format symbol for display (uppercase)
   */
  formatSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  /**
   * Get available sectors (this could be enhanced to fetch from backend)
   */
  getAvailableSectors(): string[] {
    return [
      'Technology',
      'Healthcare',
      'Financial Services',
      'Consumer Cyclical',
      'Communication Services',
      'Industrials',
      'Consumer Defensive',
      'Energy',
      'Utilities',
      'Real Estate',
      'Basic Materials'
    ];
  }

  /**
   * Get available exchanges (this could be enhanced to fetch from backend)
   */
  getAvailableExchanges(): string[] {
    return [
      'NASDAQ',
      'NYSE',
      'XETRA',
      'LSE',
      'TSE',
      'ASX',
      'TSX'
    ];
  }
}