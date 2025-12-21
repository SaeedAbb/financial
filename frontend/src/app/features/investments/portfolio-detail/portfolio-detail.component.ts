import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { Subject, takeUntil } from 'rxjs';
import { Portfolio } from '../../../core/models/portfolio.model';
import { Stock, BuyStockRequest, SellStockRequest, StockStatus, StockGroup, getStockStatusLabel, getStockStatusSeverity } from '../../../core/models/stock.model';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { StockService } from '../../../core/services/stock.service';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  providers: [MessageService, ConfirmationService],
  styleUrls: ['./portfolio-detail.component.scss'],
  template: `
    <div class="portfolio-detail">
      <!-- Header -->
      <div class="portfolio-header">
        <div class="flex justify-content-between align-items-center">
          <div class="flex align-items-center back-button-container">
            <p-button 
              icon="pi pi-arrow-left" 
              severity="secondary" 
              size="small"
              class="back-nav-button mr-3"
              (click)="goBack()">
            </p-button>
            <div class="portfolio-title">
              <h2>{{ portfolio?.name || 'Loading...' }}</h2>
              <p *ngIf="portfolio?.description">{{ portfolio!.description }}</p>
            </div>
          </div>
          <p-button 
            label="Buy Stock" 
            icon="pi pi-plus" 
            class="buy-stock-button"
            (click)="showBuyStockDialog()"
            [disabled]="!portfolio">
          </p-button>
        </div>
      </div>

      <!-- Portfolio Overview -->
      <div class="portfolio-overview grid" *ngIf="portfolio">
        <div class="col-12 md:col-3">
          <p-card>
            <div class="stats-card">
              <div class="stats-value investment">{{ formatAmount(portfolio.totalInvestment) }}</div>
              <div class="stats-label">Total Investment</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="stats-card">
              <div class="stats-value" [ngClass]="getGainLossColorClass(portfolio.totalGainLoss)">
                {{ formatAmount(portfolio.totalGainLoss) }}
              </div>
              <div class="stats-label">Total Gain/Loss</div>
              <div class="stats-percentage" [ngClass]="getGainLossColorClass(portfolio.totalGainLoss)">
                {{ formatPercentage(portfolio.gainLossPercentage) }}
              </div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="stats-card">
              <div class="stats-value count">{{ portfolio.activeStocksCount }}</div>
              <div class="stats-label">Active Stocks</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="stats-card">
              <div class="stats-value sold-count">{{ portfolio.soldStocksCount }}</div>
              <div class="stats-label">Sold Stocks</div>
            </div>
          </p-card>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <p-progressSpinner></p-progressSpinner>
        <p class="loading-text">Loading portfolio...</p>
      </div>

      <!-- Stocks List -->
      <div *ngIf="!loading && portfolio" class="stock-groups-container">
        <!-- Search Bar -->
        <div class="section-header">
          <h3>Portfolio Holdings</h3>
          <div class="search-container">
            <i class="pi pi-search search-icon"></i>
            <input 
              type="text" 
              pInputText 
              placeholder="Search stocks..."
              class="search-input">
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="stockGroups.length === 0" class="empty-state">
          <i class="pi pi-chart-line empty-icon"></i>
          <h3>No Stocks Yet</h3>
          <p>Start building your portfolio by purchasing your first stock</p>
          <p-button 
            label="Buy First Stock" 
            icon="pi pi-plus" 
            class="buy-stock-button"
            (click)="showBuyStockDialog()">
          </p-button>
        </div>

        <!-- Stock Groups List -->
        <div *ngIf="stockGroups.length > 0" class="stock-groups">
          <div *ngFor="let group of stockGroups; trackBy: trackBySymbol" class="stock-group">
            <div class="stock-group-card">
              <!-- Stock Group Header -->
              <div class="stock-group-header cursor-pointer" 
                   (click)="toggleGroup(group)"
                   [class.expanded]="isGroupExpanded(group)">
                <div class="header-content">
                  <!-- Status Indicator -->
                  <div class="status-indicator"></div>
                  
                  <!-- Company Icon -->
                  <div class="company-icon">
                    <i class="pi pi-building"></i>
                  </div>
                  
                  <!-- Stock Info -->
                  <div class="stock-info">
                    <div class="stock-header-row">
                      <span class="stock-symbol">{{ group.symbol }}</span>
                      <span class="long-tag">LONG</span>
                      <span class="stock-quantity">{{ group.totalQuantity }}</span>
                    </div>
                    <div class="company-name">{{ group.companyName }}</div>
                  </div>
                  
                  <!-- Current Price -->
                  <div class="price-info">
                    <div class="current-price">{{ formatAmount(26.08) }}</div>
                    <div class="price-label">Current</div>
                  </div>
                  
                  <!-- Performance -->
                  <div class="performance-info">
                    <div class="performance" 
                         [ngClass]="{
                           'gain': group.totalGainLoss > 0,
                           'loss': group.totalGainLoss < 0,
                           'neutral': group.totalGainLoss === 0
                         }">
                      {{ formatPercentage(group.totalGainLossPercentage) }}
                    </div>
                    <div class="performance-label">Performance</div>
                  </div>
                  
                  <!-- Expand Icon -->
                  <div class="expand-icon" [class.expanded]="isGroupExpanded(group)">
                    <i class="pi pi-chevron-down"></i>
                  </div>
                </div>
              </div>
              
              <!-- Stock Group Positions (Expanded Content) -->
              <div class="stock-group-content" *ngIf="isGroupExpanded(group)">
                <!-- Active Positions -->
                <div *ngIf="group.activePositions.length > 0" class="positions-section">
                  <div class="section-header">
                    <span class="active-positions">Active Positions ({{ group.activePositionsCount }})</span>
                  </div>
                  <div *ngFor="let position of group.activePositions" class="position-row">
                    <div class="position-content">
                      <div class="position-info">
                        <div class="position-details">
                          <span class="position-amount">{{ position.quantity }}</span>
                          <span class="position-price">@ {{ formatAmount(position.purchasePrice) }}</span>
                          <span class="position-date">{{ formatDate(position.purchaseDate) }}</span>
                        </div>
                        <div class="position-investment">
                          <strong>Investment:</strong> {{ formatAmount(position.investmentValue) }}
                        </div>
                      </div>
                      <div class="position-actions">
                        <div class="position-performance">
                          <div class="performance-value" 
                               [ngClass]="{
                                 'gain': position.gainLoss > 0,
                                 'loss': position.gainLoss < 0,
                                 'neutral': position.gainLoss === 0
                               }">
                            {{ formatAmount(position.gainLoss) }}
                          </div>
                          <div class="performance-percentage" *ngIf="position.gainLossPercentage !== 0">
                            {{ formatPercentage(position.gainLossPercentage) }}
                          </div>
                        </div>
                        <p-button 
                          icon="pi pi-dollar" 
                          size="small" 
                          class="sell-button"
                          pTooltip="Sell Position"
                          (click)="showSellStockDialog(position)">
                        </p-button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Sold Positions -->
                <div *ngIf="group.soldPositions.length > 0" class="positions-section">
                  <div class="section-header">
                    <span class="sold-positions">Sold Positions ({{ group.soldPositionsCount }})</span>
                  </div>
                  <div *ngFor="let position of group.soldPositions" class="position-row sold-position">
                    <div class="position-content">
                      <div class="position-info">
                        <div class="position-details">
                          <span class="position-amount">{{ position.quantity }}</span>
                          <span class="position-price">{{ formatAmount(position.purchasePrice) }} → {{ formatAmount(position.salePrice!) }}</span>
                        </div>
                        <div class="position-date">
                          {{ formatDate(position.purchaseDate) }} → {{ formatDate(position.saleDate!) }}
                        </div>
                      </div>
                      <div class="position-actions">
                        <div class="position-performance">
                          <div class="performance-value" 
                               [ngClass]="{
                                 'gain': position.gainLoss > 0,
                                 'loss': position.gainLoss < 0,
                                 'neutral': position.gainLoss === 0
                               }">
                            {{ formatAmount(position.gainLoss) }}
                          </div>
                          <div class="performance-percentage">
                            {{ formatPercentage(position.gainLossPercentage) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Buy Stock Dialog -->
      <p-dialog 
        header="Buy Stock"
        [(visible)]="showBuyDialog"
        [modal]="true"
        [closable]="false"
        [style]="{width: '500px'}">
        
        <form [formGroup]="buyStockForm" (ngSubmit)="onBuySubmit()">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="field">
                <label for="symbol">Stock Symbol *</label>
                <input 
                  type="text" 
                  id="symbol"
                  formControlName="symbol"
                  pInputText 
                  class="w-full"
                  placeholder="e.g., AAPL"
                  style="text-transform: uppercase">
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label for="quantity">Quantity *</label>
                <p-inputNumber
                  id="quantity"
                  formControlName="quantity"
                  mode="decimal"
                  [minFractionDigits]="0"
                  [maxFractionDigits]="6"
                  [min]="0.000001"
                  styleClass="w-full">
                </p-inputNumber>
              </div>
            </div>
            <div class="col-12">
              <div class="field">
                <label for="companyName">Company Name *</label>
                <input 
                  type="text" 
                  id="companyName"
                  formControlName="companyName"
                  pInputText 
                  class="w-full"
                  placeholder="e.g., Apple Inc.">
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label for="purchasePrice">Purchase Price *</label>
                <p-inputNumber
                  id="purchasePrice"
                  formControlName="purchasePrice"
                  mode="currency"
                  currency="EUR"
                  [minFractionDigits]="2"
                  [min]="0.01"
                  styleClass="w-full">
                </p-inputNumber>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label for="purchaseDate">Purchase Date *</label>
                <p-datePicker
                  id="purchaseDate"
                  formControlName="purchaseDate"
                  [maxDate]="today"
                  dateFormat="yy-mm-dd"
                  styleClass="w-full">
                </p-datePicker>
              </div>
            </div>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            (click)="hideBuyDialog()"
            [disabled]="submittingBuy">
          </p-button>
          <p-button 
            label="Buy Stock"
            (click)="onBuySubmit()"
            [loading]="submittingBuy"
            [disabled]="buyStockForm.invalid">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Sell Stock Dialog -->
      <p-dialog 
        header="Sell Stock"
        [(visible)]="showSellDialog"
        [modal]="true"
        [closable]="false"
        [style]="{width: '400px'}">
        
        <div *ngIf="selectedStock" class="mb-4">
          <h4>{{ selectedStock.symbol }} - {{ selectedStock.companyName }}</h4>
          <p>Quantity: {{ selectedStock.quantity }}</p>
          <p>Purchase Price: {{ formatAmount(selectedStock.purchasePrice) }}</p>
          <p>Investment Value: {{ formatAmount(selectedStock.investmentValue) }}</p>
        </div>

        <form [formGroup]="sellStockForm" (ngSubmit)="onSellSubmit()">
          <div class="field">
            <label for="salePrice">Sale Price *</label>
            <p-inputNumber
              id="salePrice"
              formControlName="salePrice"
              mode="currency"
              currency="EUR"
              [minFractionDigits]="2"
              [min]="0.01"
              styleClass="w-full">
            </p-inputNumber>
          </div>

          <div class="field">
            <label for="saleDate">Sale Date *</label>
            <p-datePicker
              id="saleDate"
              formControlName="saleDate"
              [maxDate]="today"
              [minDate]="getMinDateForSale()"
              dateFormat="yy-mm-dd"
              styleClass="w-full">
            </p-datePicker>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            (click)="hideSellDialog()"
            [disabled]="submittingSell">
          </p-button>
          <p-button 
            label="Sell Stock"
            severity="success"
            (click)="onSellSubmit()"
            [loading]="submittingSell"
            [disabled]="sellStockForm.invalid">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Toast Messages -->
      <p-toast></p-toast>
      
      <!-- Confirm Dialog -->
      <p-confirmDialog></p-confirmDialog>
    </div>
  `
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
  selectedStock: Stock | null = null;
  expandedGroups: Set<string> = new Set();
  
  loading = false;
  submittingBuy = false;
  submittingSell = false;
  showBuyDialog = false;
  showSellDialog = false;
  
  today = new Date();

  buyStockForm: FormGroup = this.fb.group({
    symbol: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9.-]+$/)]],
    companyName: ['', [Validators.required, Validators.maxLength(255)]],
    quantity: [null, [Validators.required, Validators.min(0.000001)]],
    purchasePrice: [null, [Validators.required, Validators.min(0.01)]],
    purchaseDate: [new Date(), [Validators.required]]
  });

  sellStockForm: FormGroup = this.fb.group({
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
    this.sellStockForm.reset({
      saleDate: new Date()
    });
    this.showSellDialog = true;
  }

  hideSellDialog(): void {
    this.showSellDialog = false;
    this.sellStockForm.reset();
    this.selectedStock = null;
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
    if (this.sellStockForm.valid && this.selectedStock) {
      this.submittingSell = true;
      const formValue = this.sellStockForm.value;
      
      const request: SellStockRequest = {
        stockUuid: this.selectedStock.uuid,
        salePrice: formValue.salePrice,
        saleDate: this.formatDateForAPI(formValue.saleDate)
      };

      this.stockService.sellStock(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stock) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Stock sold successfully'
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
  }

  viewStockDetails(stock: Stock): void {
    // Could navigate to a detailed stock view or show a detailed dialog
    console.log('View stock details:', stock);
  }

  goBack(): void {
    this.router.navigate(['/investments']);
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
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          activePositions: [],
          soldPositions: [],
          activePositionsCount: 0,
          soldPositionsCount: 0
        });
      }

      const group = groupMap.get(stock.symbol)!;
      group.positions.push(stock);

      if (stock.status === StockStatus.ACTIVE) {
        group.activePositions.push(stock);
        group.totalQuantity += stock.quantity;
        group.totalInvestment += stock.investmentValue;
        group.activePositionsCount++;
      } else {
        group.soldPositions.push(stock);
        group.totalGainLoss += stock.gainLoss;
        group.soldPositionsCount++;
      }
    });

    // Calculate performance metrics for each group
    groupMap.forEach(group => {
      if (group.totalInvestment > 0) {
        group.totalGainLossPercentage = (group.totalGainLoss / group.totalInvestment) * 100;
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  applyGlobalFilter(event: any, target: string): void {
    const value = (event.target as HTMLInputElement).value;
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
}