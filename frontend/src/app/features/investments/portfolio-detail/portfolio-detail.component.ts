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
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { Portfolio } from '../../../core/models/portfolio.model';
import { Stock, BuyStockRequest, SellStockRequest, StockStatus, getStockStatusLabel, getStockStatusSeverity } from '../../../core/models/stock.model';
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
    SkeletonModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="portfolio-detail">
      <!-- Header -->
      <div class="flex justify-content-between align-items-center mb-4">
        <div class="flex align-items-center">
          <p-button 
            icon="pi pi-arrow-left" 
            severity="secondary" 
            size="small"
            class="mr-3"
            (click)="goBack()">
          </p-button>
          <div>
            <h2 class="m-0">{{ portfolio?.name || 'Loading...' }}</h2>
            <p class="text-500 m-0" *ngIf="portfolio?.description">{{ portfolio!.description }}</p>
          </div>
        </div>
        <p-button 
          label="Buy Stock" 
          icon="pi pi-plus" 
          (click)="showBuyStockDialog()"
          [disabled]="!portfolio">
        </p-button>
      </div>

      <!-- Portfolio Overview -->
      <div class="grid mb-4" *ngIf="portfolio">
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-500">{{ formatAmount(portfolio.totalInvestment) }}</div>
              <div class="text-500">Total Investment</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold" [class]="getGainLossColorClass(portfolio.totalGainLoss)">
                {{ formatAmount(portfolio.totalGainLoss) }}
              </div>
              <div class="text-500">Total Gain/Loss</div>
              <div class="text-sm" [class]="getGainLossColorClass(portfolio.totalGainLoss)">
                {{ formatPercentage(portfolio.gainLossPercentage) }}
              </div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-500">{{ portfolio.activeStocksCount }}</div>
              <div class="text-500">Active Stocks</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-500">{{ portfolio.soldStocksCount }}</div>
              <div class="text-500">Sold Stocks</div>
            </div>
          </p-card>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-8">
        <p-progressSpinner></p-progressSpinner>
        <p class="text-500 mt-3">Loading portfolio...</p>
      </div>

      <!-- Stocks Table -->
      <p-card *ngIf="!loading && portfolio">
        <ng-template pTemplate="header">
          <h3>Portfolio Stocks</h3>
        </ng-template>
        <p-table 
              [value]="allStocks" 
              [paginator]="true" 
              [rows]="10"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} stocks"
              [globalFilterFields]="['symbol', 'companyName']"
              styleClass="p-datatable-gridlines">
              
              <ng-template pTemplate="caption">
                <div class="flex justify-content-between align-items-center">
                  <h3 class="m-0">All Stocks</h3>
                  <span class="p-input-icon-left">
                    <i class="pi pi-search"></i>
                    <input 
                      type="text" 
                      pInputText 
                      placeholder="Search stocks..."
                      (input)="applyGlobalFilter($event, 'allStocks')">
                  </span>
                </div>
              </ng-template>

              <ng-template pTemplate="header">
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Quantity</th>
                  <th>Purchase Price</th>
                  <th>Purchase Date</th>
                  <th>Status</th>
                  <th>Investment Value</th>
                  <th>Gain/Loss</th>
                  <th>Actions</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-stock>
                <tr>
                  <td>
                    <span class="font-bold">{{ stock.symbol }}</span>
                  </td>
                  <td>{{ stock.companyName }}</td>
                  <td>{{ stock.quantity }}</td>
                  <td>{{ formatAmount(stock.purchasePrice) }}</td>
                  <td>{{ formatDate(stock.purchaseDate) }}</td>
                  <td>
                    <p-tag 
                      [value]="getStockStatusLabel(stock.status)" 
                      [severity]="getStockStatusSeverity(stock.status)">
                    </p-tag>
                  </td>
                  <td>{{ formatAmount(stock.investmentValue) }}</td>
                  <td [class]="getGainLossColorClass(stock.gainLoss)">
                    {{ formatAmount(stock.gainLoss) }}
                    <div class="text-sm" *ngIf="stock.gainLossPercentage !== 0">
                      ({{ formatPercentage(stock.gainLossPercentage) }})
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <p-button 
                        icon="pi pi-dollar" 
                        size="small" 
                        severity="success"
                        pTooltip="Sell Stock"
                        [disabled]="stock.status === 'SOLD'"
                        (click)="showSellStockDialog(stock)">
                      </p-button>
                      <p-button 
                        icon="pi pi-eye" 
                        size="small" 
                        severity="secondary"
                        pTooltip="View Details"
                        (click)="viewStockDetails(stock)">
                      </p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="9" class="text-center py-4">
                    <i class="pi pi-chart-line text-4xl text-300 mb-3"></i>
                    <p class="text-600">No stocks in this portfolio yet</p>
                    <p-button 
                      label="Buy First Stock" 
                      icon="pi pi-plus" 
                      size="small"
                      (click)="showBuyStockDialog()">
                    </p-button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
      </p-card>

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
  `,
  styles: [`
    .portfolio-detail {
      padding: 1rem;
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
  `]
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
  selectedStock: Stock | null = null;
  
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
}