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
      <div class="portfolio-overview" *ngIf="portfolio">
        <!-- Main Performance Card -->
        <div class="main-performance-card">
          <p-card styleClass="performance-highlight-card">
            <div class="main-performance-content">
              <div class="performance-header">
                <div class="current-value-section">
                  <div class="current-value">{{ formatAmount(portfolio.totalCurrentValue || portfolio.totalInvestment) }}</div>
                  <div class="value-label">Portfolio Value</div>
                </div>
                <div class="investment-section">
                  <div class="investment-value">{{ formatAmount(portfolio.totalInvestment) }}</div>
                  <div class="investment-label">Total Invested</div>
                </div>
              </div>
              <div class="performance-metrics">
                <div class="gain-loss-section">
                  <div class="gain-loss-main">
                    <div class="gain-loss-icon" [ngClass]="getPerformanceIcon(portfolio.totalGainLoss)">
                      <i class="pi" [ngClass]="getPerformanceIcon(portfolio.totalGainLoss)"></i>
                    </div>
                    <div class="gain-loss-values">
                      <div class="gain-loss-amount" [ngClass]="getGainLossColorClass(portfolio.totalGainLoss)">
                        {{ formatAmount(portfolio.totalGainLoss) }}
                      </div>
                      <div class="gain-loss-percentage" [ngClass]="getGainLossColorClass(portfolio.totalGainLoss)">
                        {{ formatPercentage(portfolio.gainLossPercentage) }}
                      </div>
                    </div>
                  </div>
                  <div class="performance-status">
                    <div class="status-badge" [ngClass]="getPerformanceStatusClass(portfolio.totalGainLoss)">
                      {{ getPerformanceStatusLabel(portfolio.totalGainLoss) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Quick Stats Grid -->
        <div class="quick-stats-grid grid">
          <div class="col-12 md:col-4">
            <p-card styleClass="quick-stat-card">
              <div class="quick-stat">
                <div class="stat-icon positions-icon">
                  <i class="pi pi-chart-line"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ portfolio.activeStocksCount }}</div>
                  <div class="stat-label">Active Positions</div>
                  <div class="stat-detail" *ngIf="stockGroups.length > 0">
                    {{ stockGroups.length }} different stocks
                  </div>
                </div>
              </div>
            </p-card>
          </div>
          <div class="col-12 md:col-4">
            <p-card styleClass="quick-stat-card">
              <div class="quick-stat">
                <div class="stat-icon transactions-icon">
                  <i class="pi pi-history"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ portfolio.soldStocksCount }}</div>
                  <div class="stat-label">Completed Sales</div>
                  <div class="stat-detail" *ngIf="portfolio.soldStocksCount > 0">
                    Realized transactions
                  </div>
                </div>
              </div>
            </p-card>
          </div>
          <div class="col-12 md:col-4">
            <p-card styleClass="quick-stat-card">
              <div class="quick-stat">
                <div class="stat-icon diversity-icon">
                  <i class="pi pi-th-large"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ getDiversificationScore() }}</div>
                  <div class="stat-label">Diversification</div>
                  <div class="stat-detail">
                    {{ getDiversificationLevel() }}
                  </div>
                </div>
              </div>
            </p-card>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <p-progressSpinner></p-progressSpinner>
        <p class="loading-text">Loading portfolio...</p>
      </div>

      <!-- Stocks List -->
      <div *ngIf="!loading && portfolio" class="stock-groups-container">
        <!-- Enhanced Search and Filter Section -->
        <div class="section-header">
          <div class="header-title-section">
            <h3>Portfolio Holdings</h3>
            <div class="holdings-summary">
              {{ stockGroups.length }} stocks • {{ portfolio.activeStocksCount }} positions
            </div>
          </div>
          
          <!-- Mobile-friendly search and filters -->
          <div class="search-and-filters">
            <!-- Search Input -->
            <div class="search-container">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                pInputText 
                placeholder="Search stocks..."
                class="search-input"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange($event)">
              <button 
                *ngIf="searchTerm" 
                class="clear-search-btn"
                (click)="clearSearch()"
                type="button">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Quick Filter Chips -->
            <div class="filter-chips">
              <button 
                class="filter-chip" 
                [class.active]="activeFilter === 'all'"
                (click)="setFilter('all')">
                All
              </button>
              <button 
                class="filter-chip gain-chip" 
                [class.active]="activeFilter === 'gainers'"
                (click)="setFilter('gainers')">
                <i class="pi pi-arrow-up"></i>
                Winners
              </button>
              <button 
                class="filter-chip loss-chip" 
                [class.active]="activeFilter === 'losers'"
                (click)="setFilter('losers')">
                <i class="pi pi-arrow-down"></i>
                Losers
              </button>
              <button 
                class="filter-chip recent-chip" 
                [class.active]="activeFilter === 'recent'"
                (click)="setFilter('recent')">
                <i class="pi pi-clock"></i>
                Recent
              </button>
            </div>

            <!-- Sort Options -->
            <div class="sort-container">
              <p-button 
                icon="pi pi-sort-alt"
                severity="secondary"
                size="small"
                class="sort-button"
                [pTooltip]="'Sort by: ' + getSortLabel(currentSort)"
                (click)="toggleSort()">
              </p-button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredStockGroups.length === 0 && stockGroups.length === 0" class="empty-state">
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

        <!-- No Results State -->
        <div *ngIf="filteredStockGroups.length === 0 && stockGroups.length > 0" class="no-results-state">
          <i class="pi pi-filter empty-icon"></i>
          <h3>No Results Found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <p-button 
            label="Clear Filters" 
            severity="secondary"
            (click)="clearFilters()">
          </p-button>
        </div>

        <!-- Stock Groups List -->
        <div *ngIf="filteredStockGroups.length > 0" class="stock-groups">
          <div *ngFor="let group of filteredStockGroups; trackBy: trackBySymbol" class="stock-group">
            <div class="stock-group-card">
              <!-- Simplified Stock Card -->
              <div class="simplified-stock-card">
                <!-- Performance Indicator -->
                <div class="performance-indicator-stripe" 
                     [ngClass]="getPerformanceColorClass(group.totalGainLoss)">
                </div>

                <!-- Main Card Content -->
                <div class="card-content">
                  <!-- Header Section -->
                  <div class="stock-header">
                    <div class="company-info">
                      <div class="symbol-and-icon">
                        <div class="company-icon" [ngClass]="getPerformanceColorClass(group.totalGainLoss)">
                          <i class="pi pi-building"></i>
                        </div>
                        <div class="symbol-info">
                          <h3 class="stock-symbol">{{ group.symbol }}</h3>
                          <p class="company-name">{{ group.companyName }}</p>
                        </div>
                      </div>
                      <div class="shares-owned">
                        <span class="shares-count">{{ group.totalAvailableQuantity }}</span>
                        <span class="shares-label">shares owned</span>
                      </div>
                    </div>
                  </div>

                  <!-- Value and Performance Row -->
                  <div class="value-performance-row">
                    <div class="current-value-section">
                      <div class="current-value">{{ formatAmount(group.totalAvailableQuantity * 26.08) }}</div>
                      <div class="value-label">current value</div>
                    </div>
                    
                    <div class="performance-section">
                      <div class="performance-amount" [ngClass]="getGainLossColorClass(group.totalGainLoss)">
                        <i class="pi performance-icon" [ngClass]="getPerformanceIcon(group.totalGainLoss)"></i>
                        {{ formatAmount(group.totalGainLoss) }}
                      </div>
                      <div class="performance-percentage" [ngClass]="getGainLossColorClass(group.totalGainLoss)">
                        {{ formatPercentage(group.totalGainLossPercentage) }}
                      </div>
                    </div>
                  </div>

                  <!-- Price Information Row -->
                  <div class="price-info-row">
                    <div class="current-price-info">
                      <span class="current-price">{{ formatAmount(26.08) }}</span>
                      <span class="price-label">per share</span>
                    </div>
                    <div class="avg-cost-info">
                      <span class="avg-cost">{{ formatAmount(group.averagePurchasePrice) }}</span>
                      <span class="cost-label">avg cost</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="action-buttons">
                    <p-button 
                      label="Buy More" 
                      icon="pi pi-plus" 
                      severity="secondary"
                      class="buy-button"
                      (click)="showBuyStockDialog(); $event.stopPropagation()">
                    </p-button>
                    <p-button 
                      label="Sell Position" 
                      icon="pi pi-minus" 
                      severity="success"
                      class="sell-button"
                      (click)="showSellStockGroupDialog(group, $event)"
                      [disabled]="!group.canSell">
                    </p-button>
                  </div>

                  <!-- Transaction History Toggle -->
                  <div class="history-toggle"
                       tabindex="0"
                       role="button"
                       [attr.aria-expanded]="isGroupExpanded(group)"
                       [attr.aria-label]="'Toggle ' + group.symbol + ' transaction history'"
                       (click)="toggleGroup(group)"
                       (keydown.enter)="toggleGroup(group)"
                       (keydown.space)="toggleGroup(group); $event.preventDefault()">
                    <div class="history-info">
                      <i class="pi pi-history"></i>
                      <span class="history-text">Transaction History ({{ group.positions.length }} trades)</span>
                    </div>
                    <div class="toggle-icon" [class.expanded]="isGroupExpanded(group)">
                      <i class="pi pi-chevron-down"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Transaction History Timeline (Expanded Content) -->
              <div class="transaction-timeline" *ngIf="isGroupExpanded(group)">
                <div class="timeline-header">
                  <h4 class="timeline-title">
                    <i class="pi pi-history"></i>
                    Transaction Timeline
                  </h4>
                  <div class="timeline-summary">
                    <span class="total-transactions">{{ getTransactionHistory(group).length }} transactions</span>
                    <span class="separator">•</span>
                    <span class="holding-period">held for {{ getHoldingDuration(group.earliestPurchaseDate) }}</span>
                  </div>
                </div>

                <div class="timeline-content">
                  <div *ngFor="let transaction of getTransactionHistory(group); trackBy: trackByTransactionId; let last = last" 
                       class="timeline-item"
                       [ngClass]="transaction.type">
                    
                    <!-- Transaction Icon and Line -->
                    <div class="timeline-marker">
                      <div class="timeline-icon" [ngClass]="transaction.type">
                        <i class="pi" [ngClass]="getTransactionIcon(transaction.type)"></i>
                      </div>
                      <div class="timeline-line" *ngIf="!last"></div>
                    </div>

                    <!-- Transaction Details -->
                    <div class="timeline-details">
                      <div class="transaction-header">
                        <div class="transaction-type-label">
                          <span class="type-text" [ngClass]="transaction.type">
                            {{ transaction.type === 'buy' ? 'BUY' : 'SELL' }}
                          </span>
                          <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
                        </div>
                        <div class="transaction-amount" [ngClass]="transaction.type">
                          {{ formatAmount(transaction.totalValue) }}
                        </div>
                      </div>

                      <div class="transaction-info">
                        <div class="quantity-price">
                          <span class="quantity">{{ transaction.quantity }} shares</span>
                          <span class="separator">@</span>
                          <span class="price">{{ formatAmount(transaction.price) }}</span>
                        </div>
                        
                        <div class="transaction-details-extra" *ngIf="transaction.type === 'sell'">
                          <div class="profit-loss" [ngClass]="getProfitLossClass(transaction.profitLoss!)">
                            <i class="pi" [ngClass]="getProfitLossIcon(transaction.profitLoss!)"></i>
                            {{ formatAmount(transaction.profitLoss!) }}
                            ({{ formatPercentage(transaction.profitLossPercentage!) }})
                          </div>
                          <div class="holding-period">
                            held {{ getDaysBetween(transaction.originalPurchaseDate!, transaction.date) }} days
                          </div>
                        </div>
                      </div>

                      <!-- Remaining Position Info for Partial Sales -->
                      <div *ngIf="transaction.type === 'sell' && transaction.remainingShares! > 0" 
                           class="remaining-position">
                        <small class="remaining-info">
                          <i class="pi pi-info-circle"></i>
                          {{ transaction.remainingShares }} shares remaining from original position
                        </small>
                      </div>
                    </div>
                  </div>

                  <!-- Current Position Summary -->
                  <div class="timeline-item current-position">
                    <div class="timeline-marker">
                      <div class="timeline-icon current">
                        <i class="pi pi-circle-fill"></i>
                      </div>
                    </div>
                    <div class="timeline-details">
                      <div class="current-position-summary">
                        <div class="current-header">
                          <span class="current-label">Current Position</span>
                          <span class="current-value">{{ formatAmount(group.totalAvailableQuantity * 26.08) }}</span>
                        </div>
                        <div class="current-info">
                          <span class="current-shares">{{ group.totalAvailableQuantity }} shares</span>
                          <span class="separator">•</span>
                          <span class="unrealized-pnl" [ngClass]="getGainLossColorClass(group.totalGainLoss)">
                            {{ formatAmount(group.totalGainLoss) }} unrealized
                          </span>
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