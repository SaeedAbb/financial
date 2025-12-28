import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { 
  catchError, 
  finalize, 
  map, 
  shareReplay, 
  tap
} from 'rxjs/operators';
import { Portfolio } from '../../../../core/models/portfolio.model';
import { PortfolioPosition, PositionStatus } from '../../../../core/models/portfolio-position.model';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { PortfolioPositionService } from '../../../../core/services/portfolio-position.service';

/**
 * State interface for the portfolio detail page
 */
export interface PortfolioDetailState {
  portfolio: Portfolio | null;
  positions: PortfolioPosition[];
  activePositions: PortfolioPosition[];
  closedPositions: PortfolioPosition[];
  filteredPositions: PortfolioPosition[];
  selectedPosition: PortfolioPosition | null;
  selectedPositionForTransactions: PortfolioPosition | null;
  loading: boolean;
  loadingPositions: boolean;
  error: string | null;
  showTransactionSidebar: boolean;
  filterText: string;
  filterStatus: 'all' | 'active' | 'closed';
}

/**
 * Initial state for the portfolio detail
 */
const initialState: PortfolioDetailState = {
  portfolio: null,
  positions: [],
  activePositions: [],
  closedPositions: [],
  filteredPositions: [],
  selectedPosition: null,
  selectedPositionForTransactions: null,
  loading: false,
  loadingPositions: false,
  error: null,
  showTransactionSidebar: false,
  filterText: '',
  filterStatus: 'all'
};

/**
 * State management service for portfolio detail
 * Handles all state operations and provides observables for the component
 */
@Injectable()
export class PortfolioDetailStateService {
  private portfolioService = inject(PortfolioService);
  private positionService = inject(PortfolioPositionService);
  
  // State subject
  private state$ = new BehaviorSubject<PortfolioDetailState>(initialState);
  
  // Public state observables
  readonly portfolio$: Observable<Portfolio | null> = this.state$.pipe(
    map(state => state.portfolio),
    shareReplay(1)
  );
  
  readonly positions$: Observable<PortfolioPosition[]> = this.state$.pipe(
    map(state => state.positions),
    shareReplay(1)
  );
  
  readonly activePositions$: Observable<PortfolioPosition[]> = this.state$.pipe(
    map(state => state.activePositions),
    shareReplay(1)
  );
  
  readonly closedPositions$: Observable<PortfolioPosition[]> = this.state$.pipe(
    map(state => state.closedPositions),
    shareReplay(1)
  );
  
  readonly filteredPositions$: Observable<PortfolioPosition[]> = this.state$.pipe(
    map(state => state.filteredPositions),
    shareReplay(1)
  );
  
  readonly selectedPosition$: Observable<PortfolioPosition | null> = this.state$.pipe(
    map(state => state.selectedPosition),
    shareReplay(1)
  );
  
  readonly selectedPositionForTransactions$: Observable<PortfolioPosition | null> = this.state$.pipe(
    map(state => state.selectedPositionForTransactions),
    shareReplay(1)
  );
  
  readonly loading$: Observable<boolean> = this.state$.pipe(
    map(state => state.loading),
    shareReplay(1)
  );
  
  readonly loadingPositions$: Observable<boolean> = this.state$.pipe(
    map(state => state.loadingPositions),
    shareReplay(1)
  );
  
  readonly error$: Observable<string | null> = this.state$.pipe(
    map(state => state.error),
    shareReplay(1)
  );
  
  readonly showTransactionSidebar$: Observable<boolean> = this.state$.pipe(
    map(state => state.showTransactionSidebar),
    shareReplay(1)
  );
  
  /**
   * Combined loading state
   */
  readonly anyLoading$: Observable<boolean> = combineLatest([
    this.loading$,
    this.loadingPositions$
  ]).pipe(
    map(([loading, loadingPositions]) => loading || loadingPositions),
    shareReplay(1)
  );
  
  /**
   * Portfolio statistics computed from positions
   */
  readonly portfolioStats$ = this.positions$.pipe(
    map(positions => ({
      totalPositions: positions.length,
      activePositions: positions.filter(p => p.status === PositionStatus.ACTIVE).length,
      closedPositions: positions.filter(p => p.status === PositionStatus.CLOSED).length,
      totalInvestment: positions.reduce((sum, p) => sum + p.totalCost, 0),
      totalCurrentValue: positions.reduce((sum, p) => sum + (p.currentValue || p.totalCost), 0),
      totalGainLoss: positions.reduce((sum, p) => sum + p.unrealizedGainLoss, 0)
    })),
    shareReplay(1)
  );
  
  constructor() {
    // Listen to position updates from service
    this.positionService.positionsUpdated.subscribe(() => {
      if (this.state$.value.portfolio) {
        this.loadPositions(this.state$.value.portfolio.uuid).subscribe();
      }
    });
  }
  
  /**
   * Load portfolio by UUID
   */
  loadPortfolio(uuid: string): Observable<Portfolio | null> {
    this.updateState({ loading: true, error: null });
    
    return this.portfolioService.getPortfolioByUuid(uuid).pipe(
      tap(portfolio => {
        this.updateState({ portfolio, loading: false });
      }),
      catchError(error => {
        console.error('Error loading portfolio:', error);
        this.updateState({ 
          error: 'Failed to load portfolio. Please try again.',
          loading: false 
        });
        return of(null);
      })
    );
  }
  
  /**
   * Load positions for the portfolio
   */
  loadPositions(portfolioUuid: string): Observable<PortfolioPosition[]> {
    this.updateState({ loadingPositions: true });
    
    return this.positionService.getPortfolioPositions(portfolioUuid).pipe(
      tap(positions => {
        const activePositions = positions.filter(p => p.status === PositionStatus.ACTIVE);
        const closedPositions = positions.filter(p => p.status === PositionStatus.CLOSED);
        
        this.updateState({ 
          positions,
          activePositions,
          closedPositions,
          filteredPositions: this.applyFilters(positions),
          loadingPositions: false 
        });
      }),
      catchError(error => {
        console.error('Error loading positions:', error);
        this.updateState({ 
          error: 'Failed to load positions. Please try again.',
          loadingPositions: false 
        });
        return of([]);
      }),
      finalize(() => {
        // Ensure loading state is always cleared
        this.updateState({ loadingPositions: false });
      })
    );
  }
  
  /**
   * Set selected position for transactions
   */
  setSelectedPositionForTransactions(position: PortfolioPosition | null): void {
    this.updateState({ 
      selectedPositionForTransactions: position,
      showTransactionSidebar: position !== null
    });
  }
  
  /**
   * Set transaction sidebar visibility
   */
  setTransactionSidebarVisibility(visible: boolean): void {
    this.updateState({ 
      showTransactionSidebar: visible,
      selectedPositionForTransactions: visible ? this.state$.value.selectedPositionForTransactions : null
    });
  }
  
  /**
   * Set filter text
   */
  setFilterText(filterText: string): void {
    const currentState = this.state$.value;
    this.updateState({ 
      filterText,
      filteredPositions: this.applyFilters(currentState.positions, filterText, currentState.filterStatus)
    });
  }
  
  /**
   * Set filter status
   */
  setFilterStatus(filterStatus: 'all' | 'active' | 'closed'): void {
    const currentState = this.state$.value;
    this.updateState({ 
      filterStatus,
      filteredPositions: this.applyFilters(currentState.positions, currentState.filterText, filterStatus)
    });
  }
  
  /**
   * Apply filters to positions
   */
  private applyFilters(
    positions: PortfolioPosition[], 
    filterText?: string, 
    filterStatus?: 'all' | 'active' | 'closed'
  ): PortfolioPosition[] {
    const currentState = this.state$.value;
    const text = (filterText ?? currentState.filterText).toLowerCase();
    const status = filterStatus ?? currentState.filterStatus;
    
    let filtered = positions;
    
    // Apply status filter
    if (status !== 'all') {
      const targetStatus = status === 'active' ? PositionStatus.ACTIVE : PositionStatus.CLOSED;
      filtered = filtered.filter(p => p.status === targetStatus);
    }
    
    // Apply text filter
    if (text) {
      filtered = filtered.filter(p => 
        p.stock.symbol.toLowerCase().includes(text) ||
        p.stock.companyName.toLowerCase().includes(text)
      );
    }
    
    return filtered;
  }
  
  /**
   * Refresh data
   */
  refresh(): void {
    const portfolio = this.state$.value.portfolio;
    if (portfolio) {
      this.loadPortfolio(portfolio.uuid).subscribe();
      this.loadPositions(portfolio.uuid).subscribe();
    }
  }
  
  /**
   * Update the state
   */
  private updateState(partialState: Partial<PortfolioDetailState>): void {
    const currentState = this.state$.value;
    this.state$.next({ ...currentState, ...partialState });
  }
  
  /**
   * Clear error state
   */
  clearError(): void {
    this.updateState({ error: null });
  }
  
  /**
   * Get current state value
   */
  get currentState(): PortfolioDetailState {
    return this.state$.value;
  }
}