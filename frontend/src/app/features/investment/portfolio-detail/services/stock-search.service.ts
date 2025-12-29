import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  catchError,
  map,
  shareReplay
} from 'rxjs/operators';
import { StockMaster } from '../../../../core/models/stock-master.model';
import { StockMasterService } from '../../../../core/services/stock-master.service';

/**
 * Service for handling stock search functionality
 */
@Injectable()
export class StockSearchService {
  private stockMasterService = inject(StockMasterService);
  
  // Search query subject
  private searchQuery$ = new BehaviorSubject<string>('');
  
  // Loading state
  private searching$ = new BehaviorSubject<boolean>(false);
  
  // Search results
  readonly stockSuggestions$: Observable<StockMaster[]> = this.searchQuery$.pipe(
    map(query => query.trim()),
    distinctUntilChanged(),
    debounceTime(300),
    switchMap(query => {
      if (query.length < 1) {
        return of([]);
      }
      
      this.searching$.next(true);
      
      return this.stockMasterService.searchStockMasters(query).pipe(
        catchError(error => {
          console.error('Error searching stocks:', error);
          return of([]);
        }),
        map(stocks => {
          this.searching$.next(false);
          return stocks;
        })
      );
    }),
    shareReplay(1)
  );
  
  // Public observables
  readonly searching = this.searching$.asObservable();
  
  /**
   * Search for stocks
   */
  search(query: string): void {
    this.searchQuery$.next(query);
  }
  
  /**
   * Clear search results
   */
  clearSearch(): void {
    this.searchQuery$.next('');
  }
  
  /**
   * Get formatted stock display name
   */
  getStockDisplayName(stock: StockMaster | null): string {
    if (!stock) return '';
    
    return `${stock.symbol} - ${stock.companyName}`;
  }
  
  /**
   * Get stock info for display
   */
  getStockInfo(stock: StockMaster): {
    symbol: string;
    companyName: string;
    exchange?: string;
    stockType?: string;
    sector?: string;
  } {
    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      exchange: stock.exchange,
      stockType: stock.stockType,
      sector: stock.sector
    };
  }
  
  /**
   * Validate stock selection
   */
  validateStockSelection(stock: StockMaster | null): boolean {
    return stock !== null && 
           stock.symbol !== undefined && 
           stock.companyName !== undefined;
  }
}