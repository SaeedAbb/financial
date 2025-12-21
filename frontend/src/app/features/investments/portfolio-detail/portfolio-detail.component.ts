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
import { Subject, takeUntil, forkJoin, of, concat, EMPTY } from 'rxjs';
import { switchMap, map, catchError, finalize } from 'rxjs/operators';
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
                      <span class="stock-quantity">
                        {{ group.totalAvailableQuantity }}
                        <small *ngIf="group.totalSoldQuantity > 0" class="sold-info">
                          ({{ group.totalSoldQuantity }} sold)
                        </small>
                      </span>
                    </div>
                    <div class="company-name">{{ group.companyName }}</div>
                    <div class="holdings-date">
                      <small>Held since {{ formatDate(group.weightedAveragePurchaseDate) }}</small>
                    </div>
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

                  <!-- Sell Button -->
                  <div class="header-actions" *ngIf="group.canSell">
                    <p-button 
                      icon="pi pi-dollar" 
                      size="small" 
                      class="sell-button header-sell-button"
                      [pTooltip]="'Sell ' + group.symbol + ' (' + group.totalAvailableQuantity + ' available)'"
                      (click)="showSellStockGroupDialog(group, $event)"
                      [disabled]="!group.canSell">
                    </p-button>
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
                          <div class="position-quantity-info">
                            <span class="position-amount">{{ position.availableQuantity }}</span>
                            <span *ngIf="position.soldQuantity > 0" class="sold-portion">
                              ({{ position.soldQuantity }} sold)
                            </span>
                            <span class="position-total">of {{ position.quantity }} total</span>
                          </div>
                          <span class="position-price">@ {{ formatAmount(position.purchasePrice) }}</span>
                          <span class="position-date">{{ formatDate(position.purchaseDate) }}</span>
                        </div>
                        <div class="position-investment">
                          <div class="investment-row">
                            <strong>Original Investment:</strong> {{ formatAmount(position.investmentValue) }}
                          </div>
                          <div *ngIf="position.soldQuantity > 0" class="remaining-investment">
                            <strong>Remaining Value:</strong> {{ formatAmount(position.availableQuantity * position.purchasePrice) }}
                          </div>
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
                          <div class="position-quantity-info">
                            <span class="position-amount sold-amount">{{ position.soldQuantity }}</span>
                            <span *ngIf="position.availableQuantity > 0" class="remaining-portion">
                              ({{ position.availableQuantity }} remaining)
                            </span>
                            <span class="position-total">of {{ position.quantity }} total</span>
                          </div>
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
                  [showIcon]="true"
                  [appendTo]="'body'"
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
        
        <!-- Individual Stock Sale Info -->
        <div *ngIf="selectedStock && !selectedStockGroup" class="mb-4">
          <h4>{{ selectedStock.symbol }} - {{ selectedStock.companyName }}</h4>
          <div class="stock-quantity-info mb-3">
            <p><strong>Total Quantity:</strong> {{ selectedStock.quantity }}</p>
            <p><strong>Available to Sell:</strong> {{ selectedStock.availableQuantity }}</p>
            <p *ngIf="selectedStock.soldQuantity > 0"><strong>Already Sold:</strong> {{ selectedStock.soldQuantity }}</p>
          </div>
          <p>Purchase Price: {{ formatAmount(selectedStock.purchasePrice) }}</p>
          <p>Investment Value: {{ formatAmount(selectedStock.investmentValue) }}</p>
        </div>

        <!-- Stock Group Sale Info -->
        <div *ngIf="selectedStockGroup && !selectedStock" class="mb-4">
          <h4>{{ selectedStockGroup.symbol }} - {{ selectedStockGroup.companyName }}</h4>
          <div class="stock-quantity-info mb-3">
            <p><strong>Total Positions:</strong> {{ selectedStockGroup.positions.length }}</p>
            <p><strong>Total Quantity:</strong> {{ selectedStockGroup.totalQuantity }}</p>
            <p><strong>Available to Sell:</strong> {{ selectedStockGroup.totalAvailableQuantity }}</p>
            <p *ngIf="selectedStockGroup.totalSoldQuantity > 0"><strong>Already Sold:</strong> {{ selectedStockGroup.totalSoldQuantity }}</p>
          </div>
          <p>Average Purchase Price: {{ formatAmount(selectedStockGroup.averagePurchasePrice) }}</p>
          <p>Total Investment: {{ formatAmount(selectedStockGroup.totalInvestment) }}</p>
          <p>Holdings Period: {{ formatDate(selectedStockGroup.weightedAveragePurchaseDate) }} - Today</p>
        </div>

        <form [formGroup]="sellStockForm" (ngSubmit)="onSellSubmit()">
          <div class="field">
            <label for="quantity">Quantity to Sell *</label>
            <div class="quantity-input-container">
              <p-inputNumber
                id="quantity"
                formControlName="quantity"
                [min]="0.000001"
                [max]="selectedStock?.availableQuantity || selectedStockGroup?.totalAvailableQuantity || 0"
                [minFractionDigits]="0"
                [maxFractionDigits]="6"
                [step]="0.1"
                styleClass="w-full">
              </p-inputNumber>
              <div class="quantity-actions mt-2">
                <p-button 
                  label="Sell All" 
                  size="small" 
                  severity="secondary" 
                  type="button"
                  (click)="setSellAllQuantity()">
                </p-button>
                <p-button 
                  label="Half" 
                  size="small" 
                  severity="secondary" 
                  type="button"
                  class="ml-2"
                  (click)="setSellHalfQuantity()">
                </p-button>
              </div>
            </div>
            <small class="form-text text-muted" *ngIf="sellStockForm.get('quantity')?.value">
              Selling {{ sellStockForm.get('quantity')?.value }} shares
              <span *ngIf="sellStockForm.get('salePrice')?.value">
                for a total of {{ formatAmount(sellStockForm.get('quantity')?.value * sellStockForm.get('salePrice')?.value) }}
              </span>
            </small>
          </div>

          <div class="field">
            <label for="salePrice">Sale Price per Share *</label>
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
              [showIcon]="true"
              [appendTo]="'body'"
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
  selectedStockGroup: StockGroup | null = null;
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

  sellIndividualStock(formValue: any): void {
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

  sellStockGroup(formValue: any): void {
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

  calculateSellInstructions(positions: Stock[], quantityToSell: number): Array<{stock: Stock, quantity: number}> {
    const instructions: Array<{stock: Stock, quantity: number}> = [];
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

  executeSales(instructions: Array<{stock: Stock, quantity: number}>, salePrice: number, saleDate: string, totalQuantity: number): void {
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
}