import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Portfolio } from '../../../core/models/portfolio.model';
import { Stock, BuyStockRequest, SellStockRequest, StockStatus, StockGroup, getStockStatusLabel, getStockStatusSeverity } from '../../../core/models/stock.model';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { StockService } from '../../../core/services/stock.service';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  templateUrl: './portfolio-detail.component.html',
  styleUrls: ['./portfolio-detail.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    AccordionModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class PortfolioDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);
  private stockService = inject(StockService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();

  portfolio: Portfolio | null = null;
  allStocks: Stock[] = [];
  activeStocks: Stock[] = [];
  soldStocks: Stock[] = [];
  stockGroups: StockGroup[] = [];
  filteredStockGroups: StockGroup[] = [];
  selectedStock: Stock | null = null;
  selectedStockGroup: StockGroup | null = null;
  expandedGroups: Set<string> = new Set();
  
  loading = false;
  submittingBuy = false;
  submittingSell = false;
  showBuyDialog = false;
  showSellDialog = false;
  
  // Search and Filter properties
  searchTerm = '';
  activeFilter: 'all' | 'gainers' | 'losers' | 'recent' = 'all';
  currentSort: 'performance' | 'value' | 'alphabetical' = 'performance';
  
  today = new Date();

  buyStockForm: FormGroup = this.fb.group({
    symbol: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9.-]+$/)]],
    companyName: ['', [Validators.required, Validators.maxLength(255)]],
    quantity: [null, [Validators.required, Validators.min(0.000001)]],
    purchasePrice: [null, [Validators.required, Validators.min(0.01)]],
    purchaseDate: [new Date(), [Validators.required]]
  });

  sellStockForm: FormGroup = this.fb.group({
    quantity: [null, [Validators.required, Validators.min(0.000001)]],
    salePrice: [null, [Validators.required, Validators.min(0.01)]],
    saleDate: [new Date(), [Validators.required]]
  });

  ngOnInit(): void {
    const portfolioUuid = this.route.snapshot.paramMap.get('uuid');
    if (portfolioUuid) {
      this.loadPortfolio(portfolioUuid);
      this.loadStocks(portfolioUuid);
    }

    // Subscribe to stock updates
    this.stockService.stocksUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.portfolio) {
          this.loadPortfolio(this.portfolio.uuid);
          this.loadStocks(this.portfolio.uuid);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPortfolio(uuid: string): void {
    this.loading = true;
    this.portfolioService.getPortfolioByUuid(uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (portfolio) => {
          this.portfolio = portfolio;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading portfolio:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load portfolio. Please try again.'
          });
          this.loading = false;
        }
      });
  }

  loadStocks(portfolioUuid: string): void {
    this.stockService.getPortfolioStocks(portfolioUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stocks) => {
          this.allStocks = stocks;
          this.activeStocks = stocks.filter(s => s.status === StockStatus.ACTIVE);
          this.soldStocks = stocks.filter(s => s.status === StockStatus.SOLD);
          this.stockGroups = this.groupStocksBySymbol(stocks);
          this.applyFiltersAndSort();
        },
        error: (error) => {
          console.error('Error loading stocks:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load stocks. Please try again.'
          });
        }
      });
  }

  showBuyStockDialog(): void {
    this.buyStockForm.reset({
      purchaseDate: new Date()
    });
    this.showBuyDialog = true;
  }

  hideBuyDialog(): void {
    this.showBuyDialog = false;
    this.buyStockForm.reset();
  }

  showSellStockDialog(stock: Stock): void {
    this.selectedStock = stock;
    this.selectedStockGroup = null;
    this.sellStockForm.reset({
      quantity: stock.availableQuantity,
      saleDate: new Date()
    });
    this.showSellDialog = true;
  }

  showSellStockGroupDialog(group: StockGroup, event: Event): void {
    event.stopPropagation(); // Prevent group expansion
    this.selectedStockGroup = group;
    this.selectedStock = null;
    this.sellStockForm.reset({
      quantity: group.totalAvailableQuantity,
      saleDate: new Date()
    });
    this.showSellDialog = true;
  }

  hideSellDialog(): void {
    this.showSellDialog = false;
    this.sellStockForm.reset();
    this.selectedStock = null;
    this.selectedStockGroup = null;
  }

  onBuySubmit(): void {
    if (this.buyStockForm.valid && this.portfolio) {
      this.submittingBuy = true;
      const formValue = this.buyStockForm.value;
      
      const request: BuyStockRequest = {
        portfolioUuid: this.portfolio.uuid,
        symbol: formValue.symbol.toUpperCase(),
        companyName: formValue.companyName.trim(),
        quantity: formValue.quantity,
        purchasePrice: formValue.purchasePrice,
        purchaseDate: this.formatDateForAPI(formValue.purchaseDate)
      };

      this.stockService.buyStock(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stock) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Stock purchased successfully'
            });
            this.hideBuyDialog();
            this.submittingBuy = false;
          },
          error: (error) => {
            console.error('Error buying stock:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to purchase stock. Please try again.'
            });
            this.submittingBuy = false;
          }
        });
    }
  }

  onSellSubmit(): void {
    if (this.sellStockForm.valid && (this.selectedStock || this.selectedStockGroup)) {
      this.submittingSell = true;
      const formValue = this.sellStockForm.value;
      
      if (this.selectedStock) {
        // Individual stock sale
        this.sellIndividualStock(formValue);
      } else if (this.selectedStockGroup) {
        // Stock group sale
        this.sellStockGroup(formValue);
      }
    }
  }

  sellIndividualStock(formValue: {quantity: number; salePrice: number; saleDate: Date}): void {
    const request: SellStockRequest = {
      stockUuid: this.selectedStock!.uuid,
      quantity: formValue.quantity,
      salePrice: formValue.salePrice,
      saleDate: this.formatDateForAPI(formValue.saleDate)
    };

    this.stockService.sellStock(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stock) => {
          const quantitySold = formValue.quantity;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Successfully sold ${quantitySold} shares of ${this.selectedStock?.symbol}`
          });
          this.hideSellDialog();
          this.submittingSell = false;
        },
        error: (error) => {
          console.error('Error selling stock:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to sell stock. Please try again.'
          });
          this.submittingSell = false;
        }
      });
  }

  sellStockGroup(formValue: {quantity: number; salePrice: number; saleDate: Date}): void {
    const group = this.selectedStockGroup!;
    const quantityToSell = formValue.quantity;
    const salePrice = formValue.salePrice;
    const saleDate = this.formatDateForAPI(formValue.saleDate);

    // Get active positions sorted by purchase date (FIFO)
    const activePositions = group.activePositions
      .filter(stock => stock.availableQuantity > 0)
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

    // Calculate which positions to sell and how much from each
    const sellInstructions = this.calculateSellInstructions(activePositions, quantityToSell);
    
    if (sellInstructions.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No available shares to sell'
      });
      this.submittingSell = false;
      return;
    }

    // Execute sales sequentially
    this.executeSales(sellInstructions, salePrice, saleDate, quantityToSell);
  }

  calculateSellInstructions(positions: Stock[], quantityToSell: number): {stock: Stock, quantity: number}[] {
    const instructions: {stock: Stock, quantity: number}[] = [];
    let remainingToSell = quantityToSell;

    for (const position of positions) {
      if (remainingToSell <= 0) break;
      
      const availableFromThis = position.availableQuantity;
      const sellFromThis = Math.min(remainingToSell, availableFromThis);
      
      instructions.push({
        stock: position,
        quantity: sellFromThis
      });
      
      remainingToSell -= sellFromThis;
    }

    return instructions;
  }

  executeSales(instructions: {stock: Stock, quantity: number}[], salePrice: number, saleDate: string, totalQuantity: number): void {
    const saleObservables = instructions.map(instruction => {
      const request: SellStockRequest = {
        stockUuid: instruction.stock.uuid,
        quantity: instruction.quantity,
        salePrice: salePrice,
        saleDate: saleDate
      };
      return this.stockService.sellStock(request);
    });

    // Execute all sales and handle results
    forkJoin(saleObservables)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.submittingSell = false)
      )
      .subscribe({
        next: (results) => {
          const symbol = this.selectedStockGroup?.symbol;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Successfully sold ${totalQuantity} shares of ${symbol} across ${results.length} positions`
          });
          this.hideSellDialog();
        },
        error: (error) => {
          console.error('Error selling stock group:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Some sales may have failed. Please refresh and check your positions.'
          });
        }
      });
  }

  viewStockDetails(_stock: Stock): void {
    // Could navigate to a detailed stock view or show a detailed dialog
    // console.log('View stock details:', stock);
  }

  goBack(): void {
    this.router.navigate(['/investment']);
  }

  groupStocksBySymbol(stocks: Stock[]): StockGroup[] {
    const groupMap = new Map<string, StockGroup>();

    stocks.forEach(stock => {
      if (!groupMap.has(stock.symbol)) {
        groupMap.set(stock.symbol, {
          symbol: stock.symbol,
          companyName: stock.companyName,
          positions: [],
          totalQuantity: 0,
          totalAvailableQuantity: 0,
          totalSoldQuantity: 0,
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          activePositions: [],
          soldPositions: [],
          activePositionsCount: 0,
          soldPositionsCount: 0,
          earliestPurchaseDate: '',
          latestPurchaseDate: '',
          weightedAveragePurchaseDate: '',
          averagePurchasePrice: 0,
          canSell: false
        });
      }

      const group = groupMap.get(stock.symbol)!;
      group.positions.push(stock);

      // Update total quantities
      group.totalQuantity += stock.quantity;
      group.totalAvailableQuantity += stock.availableQuantity;
      group.totalSoldQuantity += stock.soldQuantity;

      // Add to appropriate position lists
      if (stock.status === StockStatus.ACTIVE || stock.availableQuantity > 0) {
        group.activePositions.push(stock);
        group.activePositionsCount++;
      }
      
      if (stock.status === StockStatus.SOLD || stock.soldQuantity > 0) {
        group.soldPositions.push(stock);
        group.soldPositionsCount++;
      }

      // Add gain/loss from all sales
      group.totalGainLoss += stock.gainLoss;
    });

    // Calculate derived fields for each group
    groupMap.forEach(group => {
      // Calculate total investment (original investment for all positions)
      group.totalInvestment = group.positions.reduce((sum, stock) => 
        sum + (stock.quantity * stock.purchasePrice), 0);

      // Calculate average purchase price (weighted by original quantities)
      const totalOriginalValue = group.positions.reduce((sum, stock) => 
        sum + (stock.quantity * stock.purchasePrice), 0);
      group.averagePurchasePrice = group.totalQuantity > 0 ? totalOriginalValue / group.totalQuantity : 0;

      // Calculate performance metrics
      if (group.totalInvestment > 0) {
        group.totalGainLossPercentage = (group.totalGainLoss / group.totalInvestment) * 100;
      }

      // Calculate date fields
      if (group.positions.length > 0) {
        const sortedPositions = group.positions.sort((a, b) => 
          new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
        
        group.earliestPurchaseDate = sortedPositions[0].purchaseDate;
        group.latestPurchaseDate = sortedPositions[sortedPositions.length - 1].purchaseDate;
        
        // Calculate weighted average purchase date
        group.weightedAveragePurchaseDate = this.calculateWeightedAverageDate(group.positions);
      }

      // Set canSell flag
      group.canSell = group.totalAvailableQuantity > 0;
    });

    return Array.from(groupMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  applyGlobalFilter(_event: Event, _target: string): void {
    // This would typically be handled by the PrimeNG table component's global filter
    // but since we're using a basic implementation, we'll leave this for now
  }

  formatAmount(amount: number): string {
    return this.stockService.formatAmount(amount);
  }

  formatPercentage(percentage: number): string {
    return this.stockService.formatPercentage(percentage);
  }

  formatDate(dateString: string): string {
    return this.stockService.formatDate(dateString);
  }

  getGainLossColorClass(gainLoss: number): string {
    return this.stockService.getGainLossColorClass(gainLoss);
  }

  getStockStatusLabel(status: StockStatus): string {
    return getStockStatusLabel(status);
  }

  getStockStatusSeverity(status: StockStatus): 'success' | 'info' | 'warn' | 'danger' {
    return getStockStatusSeverity(status);
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getMinDateForSale(): Date | undefined {
    return this.selectedStock ? new Date(this.selectedStock.purchaseDate) : undefined;
  }

  toggleGroup(group: StockGroup): void {
    if (this.expandedGroups.has(group.symbol)) {
      this.expandedGroups.delete(group.symbol);
    } else {
      this.expandedGroups.add(group.symbol);
    }
  }

  isGroupExpanded(group: StockGroup): boolean {
    return this.expandedGroups.has(group.symbol);
  }

  trackBySymbol(index: number, group: StockGroup): string {
    return group.symbol;
  }

  setSellAllQuantity(): void {
    const maxQuantity = this.selectedStock?.availableQuantity || this.selectedStockGroup?.totalAvailableQuantity || 0;
    this.sellStockForm.patchValue({
      quantity: maxQuantity
    });
  }

  setSellHalfQuantity(): void {
    const maxQuantity = this.selectedStock?.availableQuantity || this.selectedStockGroup?.totalAvailableQuantity || 0;
    const halfQuantity = maxQuantity / 2;
    this.sellStockForm.patchValue({
      quantity: Math.round(halfQuantity * 1000000) / 1000000 // Round to 6 decimal places
    });
  }

  calculateWeightedAverageDate(positions: Stock[]): string {
    if (positions.length === 0) return '';
    if (positions.length === 1) return positions[0].purchaseDate;

    let totalWeightedDays = 0;
    let totalWeight = 0;

    // Use original quantity as weight for the calculation
    positions.forEach(position => {
      const purchaseDate = new Date(position.purchaseDate);
      const daysSinceEpoch = Math.floor(purchaseDate.getTime() / (1000 * 60 * 60 * 24));
      const weight = position.quantity;

      totalWeightedDays += daysSinceEpoch * weight;
      totalWeight += weight;
    });

    if (totalWeight === 0) return positions[0].purchaseDate;

    const averageDays = Math.round(totalWeightedDays / totalWeight);
    const averageDate = new Date(averageDays * 1000 * 60 * 60 * 24);
    
    // Format as YYYY-MM-DD
    return averageDate.toISOString().split('T')[0];
  }

  // Enhanced UI helper methods for the new portfolio overview design

  getPerformanceIcon(gainLoss: number): string {
    if (gainLoss > 0) return 'pi-trending-up';
    if (gainLoss < 0) return 'pi-trending-down';
    return 'pi-minus';
  }

  getPerformanceStatusClass(gainLoss: number): string {
    if (gainLoss > 0) return 'status-gain';
    if (gainLoss < 0) return 'status-loss';
    return 'status-neutral';
  }

  getPerformanceStatusLabel(gainLoss: number): string {
    if (gainLoss > 0) return 'Profitable';
    if (gainLoss < 0) return 'Loss';
    return 'Break Even';
  }

  getDiversificationScore(): string {
    const uniqueStocks = this.stockGroups.length;
    if (uniqueStocks <= 2) return 'Low';
    if (uniqueStocks <= 5) return 'Medium';
    if (uniqueStocks <= 10) return 'Good';
    return 'High';
  }

  getDiversificationLevel(): string {
    const uniqueStocks = this.stockGroups.length;
    if (uniqueStocks === 0) return 'No positions';
    if (uniqueStocks === 1) return 'Single stock';
    if (uniqueStocks <= 2) return 'Concentrated';
    if (uniqueStocks <= 5) return 'Moderately diversified';
    if (uniqueStocks <= 10) return 'Well diversified';
    return 'Highly diversified';
  }

  getPerformanceColorClass(gainLoss: number): string {
    if (gainLoss > 0) return 'performance-gain';
    if (gainLoss < 0) return 'performance-loss';
    return 'performance-neutral';
  }

  getHoldingDuration(dateString: string): string {
    const purchaseDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays}d`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}m`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    }
  }

  // Search and Filter Methods

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFiltersAndSort();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFiltersAndSort();
  }

  setFilter(filter: 'all' | 'gainers' | 'losers' | 'recent'): void {
    this.activeFilter = filter;
    this.applyFiltersAndSort();
  }

  toggleSort(): void {
    const sortOptions = ['performance', 'value', 'alphabetical'] as const;
    const currentIndex = sortOptions.indexOf(this.currentSort);
    this.currentSort = sortOptions[(currentIndex + 1) % sortOptions.length];
    this.applyFiltersAndSort();
  }

  getSortLabel(sort: 'performance' | 'value' | 'alphabetical'): string {
    switch (sort) {
      case 'performance': return 'Performance';
      case 'value': return 'Market Value';
      case 'alphabetical': return 'A-Z';
      default: return 'Performance';
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'all';
    this.currentSort = 'performance';
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    let filtered = [...this.stockGroups];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.symbol.toLowerCase().includes(searchLower) ||
        group.companyName.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    switch (this.activeFilter) {
      case 'gainers': {
        filtered = filtered.filter(group => group.totalGainLoss > 0);
        break;
      }
      case 'losers': {
        filtered = filtered.filter(group => group.totalGainLoss < 0);
        break;
      }
      case 'recent': {
        // Show positions purchased in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(group => 
          new Date(group.weightedAveragePurchaseDate) >= thirtyDaysAgo
        );
        break;
      }
      default: {
        // 'all' - no additional filtering
        break;
      }
    }

    // Apply sorting
    switch (this.currentSort) {
      case 'performance':
        filtered.sort((a, b) => b.totalGainLossPercentage - a.totalGainLossPercentage);
        break;
      case 'value':
        filtered.sort((a, b) => (b.totalAvailableQuantity * 26.08) - (a.totalAvailableQuantity * 26.08));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
    }

    this.filteredStockGroups = filtered;
  }

  // Transaction Timeline Helper Methods

  getTransactionHistory(group: StockGroup): TransactionHistoryItem[] {
    const transactions: TransactionHistoryItem[] = [];

    // Add all purchase transactions
    group.positions.forEach(stock => {
      transactions.push({
        id: `${stock.id}-buy`,
        type: 'buy',
        date: stock.purchaseDate,
        quantity: stock.quantity,
        price: stock.purchasePrice,
        totalValue: stock.investmentValue,
        stockId: stock.id
      });

      // Add sale transaction if stock was sold (partially or completely)
      if (stock.soldQuantity > 0 && stock.saleDate && stock.salePrice) {
        transactions.push({
          id: `${stock.id}-sell`,
          type: 'sell',
          date: stock.saleDate,
          quantity: stock.soldQuantity,
          price: stock.salePrice,
          totalValue: stock.soldQuantity * stock.salePrice,
          profitLoss: stock.gainLoss,
          profitLossPercentage: stock.gainLossPercentage,
          originalPurchaseDate: stock.purchaseDate,
          remainingShares: stock.availableQuantity,
          stockId: stock.id
        });
      }
    });

    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getTransactionIcon(type: 'buy' | 'sell'): string {
    return type === 'buy' ? 'pi-plus-circle' : 'pi-minus-circle';
  }

  getProfitLossClass(profitLoss: number): string {
    if (profitLoss > 0) return 'profit';
    if (profitLoss < 0) return 'loss';
    return 'neutral';
  }

  getProfitLossIcon(profitLoss: number): string {
    if (profitLoss > 0) return 'pi-trending-up';
    if (profitLoss < 0) return 'pi-trending-down';
    return 'pi-minus';
  }

  getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  trackByTransactionId(_index: number, transaction: TransactionHistoryItem): string {
    return transaction.id;
  }
}

// Interface for transaction history timeline
interface TransactionHistoryItem {
  id: string;
  type: 'buy' | 'sell';
  date: string;
  quantity: number;
  price: number;
  totalValue: number;
  profitLoss?: number;
  profitLossPercentage?: number;
  originalPurchaseDate?: string;
  remainingShares?: number;
  stockId: number;
}
