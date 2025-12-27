import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { 
  catchError, 
  finalize, 
  map, 
  shareReplay, 
  switchMap, 
  tap 
} from 'rxjs/operators';
import { Portfolio, PortfolioSummary, PortfolioStatistics } from '../../../../core/models/portfolio.model';
import { PortfolioService } from '../../../../core/services/portfolio.service';

/**
 * State interface for the portfolio dashboard
 */
export interface PortfolioDashboardState {
  portfolios: Portfolio[];
  portfolioStatistics: Map<string, PortfolioStatistics>;
  portfolioSummary: PortfolioSummary | null;
  loading: boolean;
  loadingSummary: boolean;
  loadingStatistics: boolean;
  error: string | null;
}

/**
 * Initial state for the portfolio dashboard
 */
const initialState: PortfolioDashboardState = {
  portfolios: [],
  portfolioStatistics: new Map(),
  portfolioSummary: null,
  loading: false,
  loadingSummary: false,
  loadingStatistics: false,
  error: null
};

/**
 * State management service for portfolio dashboard
 * Handles all state operations and provides observables for the component
 */
@Injectable()
export class PortfolioDashboardStateService {
  private portfolioService = inject(PortfolioService);
  
  // State subjects
  private state$ = new BehaviorSubject<PortfolioDashboardState>(initialState);
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  
  // Public state observables
  readonly portfolios$: Observable<Portfolio[]> = this.state$.pipe(
    map(state => state.portfolios),
    shareReplay(1)
  );
  
  readonly portfolioSummary$: Observable<PortfolioSummary | null> = this.state$.pipe(
    map(state => state.portfolioSummary),
    shareReplay(1)
  );
  
  readonly portfolioStatistics$: Observable<Map<string, PortfolioStatistics>> = this.state$.pipe(
    map(state => state.portfolioStatistics),
    shareReplay(1)
  );
  
  readonly loading$: Observable<boolean> = this.state$.pipe(
    map(state => state.loading),
    shareReplay(1)
  );
  
  readonly loadingSummary$: Observable<boolean> = this.state$.pipe(
    map(state => state.loadingSummary),
    shareReplay(1)
  );
  
  readonly loadingStatistics$: Observable<boolean> = this.state$.pipe(
    map(state => state.loadingStatistics),
    shareReplay(1)
  );
  
  readonly error$: Observable<string | null> = this.state$.pipe(
    map(state => state.error),
    shareReplay(1)
  );
  
  /**
   * Combined loading state - true if any loading operation is in progress
   */
  readonly anyLoading$: Observable<boolean> = combineLatest([
    this.loading$,
    this.loadingSummary$,
    this.loadingStatistics$
  ]).pipe(
    map(([loading, loadingSummary, loadingStatistics]) => 
      loading || loadingSummary || loadingStatistics
    ),
    shareReplay(1)
  );
  
  constructor() {
    // Set up automatic data loading when refresh is triggered
    this.setupDataLoading();
    
    // Listen to portfolio updates from service
    this.portfolioService.portfoliosUpdated.subscribe(() => {
      this.refresh();
    });
  }
  
  /**
   * Set up automatic data loading pipeline
   */
  private setupDataLoading(): void {
    // Load portfolios when refresh is triggered
    this.refreshTrigger$.pipe(
      tap(() => this.updateState({ loading: true, error: null })),
      switchMap(() => this.portfolioService.getAllPortfolios().pipe(
        catchError(error => {
          this.updateState({ 
            error: 'Failed to load portfolios. Please try again.',
            loading: false 
          });
          console.error('Error loading portfolios:', error);
          return of([]);
        }),
        finalize(() => this.updateState({ loading: false }))
      ))
    ).subscribe(portfolios => {
      this.updateState({ portfolios });
      this.loadPortfolioStatistics(portfolios);
    });
    
    // Load summary when refresh is triggered
    this.refreshTrigger$.pipe(
      tap(() => this.updateState({ loadingSummary: true })),
      switchMap(() => this.portfolioService.getPortfoliosSummary().pipe(
        catchError(error => {
          console.error('Error loading portfolio summary:', error);
          return of(null);
        }),
        finalize(() => this.updateState({ loadingSummary: false }))
      ))
    ).subscribe(portfolioSummary => {
      this.updateState({ portfolioSummary });
    });
  }
  
  /**
   * Load statistics for all portfolios
   */
  private loadPortfolioStatistics(portfolios: Portfolio[]): void {
    if (portfolios.length === 0) {
      this.updateState({ loadingStatistics: false });
      return;
    }
    
    this.updateState({ loadingStatistics: true });
    const newStatisticsMap = new Map<string, PortfolioStatistics>();
    
    // Load statistics for each portfolio
    portfolios.forEach(portfolio => {
      this.portfolioService.getPortfolioStatistics(portfolio.uuid).pipe(
        catchError(error => {
          console.error(`Error loading statistics for portfolio ${portfolio.uuid}:`, error);
          return of(null);
        })
      ).subscribe(statistics => {
        if (statistics) {
          newStatisticsMap.set(portfolio.uuid, statistics);
          this.updateState({ portfolioStatistics: newStatisticsMap });
        }
      });
    });
    
    // Set loading to false after a reasonable timeout
    setTimeout(() => {
      this.updateState({ loadingStatistics: false });
    }, 2000);
  }
  
  /**
   * Refresh all data
   */
  refresh(): void {
    this.refreshTrigger$.next();
  }
  
  /**
   * Get portfolio statistics by UUID
   */
  getPortfolioStatistics(portfolioUuid: string): Observable<PortfolioStatistics | null> {
    return this.portfolioStatistics$.pipe(
      map(statisticsMap => statisticsMap.get(portfolioUuid) || null)
    );
  }
  
  /**
   * Update the state
   */
  private updateState(partialState: Partial<PortfolioDashboardState>): void {
    const currentState = this.state$.value;
    this.state$.next({ ...currentState, ...partialState });
  }
  
  /**
   * Clear error state
   */
  clearError(): void {
    this.updateState({ error: null });
  }
}