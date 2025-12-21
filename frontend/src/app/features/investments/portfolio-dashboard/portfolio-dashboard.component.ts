import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { Portfolio, CreatePortfolioRequest, PortfolioSummary } from '../../../core/models/portfolio.model';
import { PortfolioService } from '../../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-dashboard',
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
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    SkeletonModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="portfolio-dashboard">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2>Investment Portfolios</h2>
        <p-button 
          label="Create Portfolio" 
          icon="pi pi-plus" 
          (click)="showCreateDialog()"
          [loading]="loading">
        </p-button>
      </div>

      <!-- Summary Cards -->
      <div class="grid mb-4" *ngIf="summary">
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{{ summary.totalPortfolios }}</div>
              <div class="text-500">Total Portfolios</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-500">{{ summary.totalActiveStocks }}</div>
              <div class="text-500">Active Stocks</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-500">{{ formatAmount(summary.totalInvestment) }}</div>
              <div class="text-500">Total Investment</div>
            </div>
          </p-card>
        </div>
        <div class="col-12 md:col-3">
          <p-card>
            <div class="text-center">
              <div class="text-2xl font-bold" [class]="getGainLossColorClass(summary.totalGainLoss)">
                {{ formatAmount(summary.totalGainLoss) }}
              </div>
              <div class="text-500">Total Gain/Loss</div>
            </div>
          </p-card>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="grid">
        <div class="col-12" *ngFor="let item of [1,2,3]">
          <p-card>
            <p-skeleton height="4rem"></p-skeleton>
          </p-card>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && portfolios.length === 0" class="text-center py-8">
        <i class="pi pi-briefcase text-6xl text-300 mb-3"></i>
        <h3 class="text-900 font-bold mb-2">No Portfolios Yet</h3>
        <p class="text-600 mb-4">Create your first portfolio to start tracking your investments</p>
        <p-button 
          label="Create Portfolio" 
          icon="pi pi-plus" 
          (click)="showCreateDialog()">
        </p-button>
      </div>

      <!-- Portfolios Grid -->
      <div class="grid" *ngIf="!loading && portfolios.length > 0">
        <div class="col-12 md:col-6 lg:col-4" *ngFor="let portfolio of portfolios">
          <p-card 
            [header]="portfolio.name"
            styleClass="h-full cursor-pointer hover:shadow-lg transition-all transition-duration-200"
            (click)="viewPortfolio(portfolio)">
            
            <div class="portfolio-metrics">
              <div class="flex justify-content-between align-items-center mb-3">
                <span class="text-500">Investment</span>
                <span class="font-bold">{{ formatAmount(portfolio.totalInvestment) }}</span>
              </div>
              
              <div class="flex justify-content-between align-items-center mb-3">
                <span class="text-500">Gain/Loss</span>
                <span class="font-bold" [class]="getGainLossColorClass(portfolio.totalGainLoss)">
                  {{ formatAmount(portfolio.totalGainLoss) }}
                  <span class="text-sm ml-1">({{ formatPercentage(portfolio.gainLossPercentage) }})</span>
                </span>
              </div>

              <div class="flex justify-content-between align-items-center mb-3">
                <span class="text-500">Active Stocks</span>
                <p-tag [value]="portfolio.activeStocksCount.toString()" severity="success"></p-tag>
              </div>

              <div class="flex justify-content-between align-items-center mb-3" *ngIf="portfolio.soldStocksCount > 0">
                <span class="text-500">Sold Stocks</span>
                <p-tag [value]="portfolio.soldStocksCount.toString()" severity="info"></p-tag>
              </div>

              <div *ngIf="portfolio.description" class="text-500 text-sm mt-2">
                {{ portfolio.description }}
              </div>
            </div>

            <ng-template pTemplate="footer">
              <div class="flex justify-content-between">
                <p-button 
                  icon="pi pi-eye" 
                  severity="secondary" 
                  size="small"
                  pTooltip="View Portfolio"
                  (click)="viewPortfolio(portfolio); $event.stopPropagation()">
                </p-button>
                <p-button 
                  icon="pi pi-pencil" 
                  severity="secondary" 
                  size="small"
                  pTooltip="Edit Portfolio"
                  (click)="editPortfolio(portfolio); $event.stopPropagation()">
                </p-button>
                <p-button 
                  icon="pi pi-trash" 
                  severity="danger" 
                  size="small"
                  pTooltip="Delete Portfolio"
                  (click)="confirmDeletePortfolio(portfolio); $event.stopPropagation()">
                </p-button>
              </div>
            </ng-template>
          </p-card>
        </div>
      </div>

      <!-- Create/Edit Portfolio Dialog -->
      <p-dialog 
        [header]="isEditMode ? 'Edit Portfolio' : 'Create Portfolio'"
        [(visible)]="showDialog"
        [modal]="true"
        [closable]="false"
        [style]="{width: '450px'}">
        
        <form [formGroup]="portfolioForm" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="name">Portfolio Name *</label>
            <input 
              type="text" 
              id="name"
              formControlName="name"
              pInputText 
              class="w-full"
              [class.ng-invalid]="portfolioForm.get('name')?.invalid && portfolioForm.get('name')?.touched"
              placeholder="Enter portfolio name">
            <small 
              class="p-error" 
              *ngIf="portfolioForm.get('name')?.hasError('required') && portfolioForm.get('name')?.touched">
              Portfolio name is required
            </small>
            <small 
              class="p-error" 
              *ngIf="portfolioForm.get('name')?.hasError('maxlength')">
              Portfolio name cannot exceed 100 characters
            </small>
          </div>

          <div class="field">
            <label for="description">Description</label>
            <textarea 
              id="description"
              formControlName="description"
              pTextarea 
              rows="3" 
              class="w-full"
              [class.ng-invalid]="portfolioForm.get('description')?.invalid"
              placeholder="Enter portfolio description (optional)">
            </textarea>
            <small 
              class="p-error" 
              *ngIf="portfolioForm.get('description')?.hasError('maxlength')">
              Description cannot exceed 1000 characters
            </small>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            (click)="hideDialog()"
            [disabled]="submitting">
          </p-button>
          <p-button 
            [label]="isEditMode ? 'Update' : 'Create'"
            (click)="onSubmit()"
            [loading]="submitting"
            [disabled]="portfolioForm.invalid">
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
    .portfolio-dashboard {
      padding: 1rem;
    }

    .portfolio-metrics {
      min-height: 140px;
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
export class PortfolioDashboardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  portfolios: Portfolio[] = [];
  summary: PortfolioSummary | null = null;
  loading = false;
  submitting = false;
  showDialog = false;
  isEditMode = false;
  selectedPortfolio: Portfolio | null = null;

  portfolioForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]]
  });

  ngOnInit(): void {
    this.loadPortfolios();
    this.loadSummary();
    
    // Subscribe to portfolio updates
    this.portfolioService.portfoliosUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPortfolios();
        this.loadSummary();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPortfolios(): void {
    this.loading = true;
    this.portfolioService.getAllPortfolios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (portfolios) => {
          this.portfolios = portfolios;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading portfolios:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load portfolios. Please try again.'
          });
          this.loading = false;
        }
      });
  }

  loadSummary(): void {
    this.portfolioService.getPortfoliosSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: (error) => {
          console.error('Error loading summary:', error);
        }
      });
  }

  showCreateDialog(): void {
    this.isEditMode = false;
    this.selectedPortfolio = null;
    this.portfolioForm.reset();
    this.showDialog = true;
  }

  editPortfolio(portfolio: Portfolio): void {
    this.isEditMode = true;
    this.selectedPortfolio = portfolio;
    this.portfolioForm.patchValue({
      name: portfolio.name,
      description: portfolio.description
    });
    this.showDialog = true;
  }

  hideDialog(): void {
    this.showDialog = false;
    this.portfolioForm.reset();
    this.selectedPortfolio = null;
  }

  onSubmit(): void {
    if (this.portfolioForm.valid) {
      this.submitting = true;
      const formValue = this.portfolioForm.value;
      
      const request: CreatePortfolioRequest = {
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined
      };

      const operation = this.isEditMode && this.selectedPortfolio
        ? this.portfolioService.updatePortfolio(this.selectedPortfolio.uuid, request)
        : this.portfolioService.createPortfolio(request);

      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (portfolio) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Portfolio ${this.isEditMode ? 'updated' : 'created'} successfully`
            });
            this.hideDialog();
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error saving portfolio:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} portfolio. Please try again.`
            });
            this.submitting = false;
          }
        });
    }
  }

  viewPortfolio(portfolio: Portfolio): void {
    this.router.navigate(['/investments/portfolios', portfolio.uuid]);
  }

  confirmDeletePortfolio(portfolio: Portfolio): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the portfolio "${portfolio.name}"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletePortfolio(portfolio);
      }
    });
  }

  deletePortfolio(portfolio: Portfolio): void {
    this.portfolioService.deletePortfolio(portfolio.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Portfolio deleted successfully'
          });
        },
        error: (error) => {
          console.error('Error deleting portfolio:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to delete portfolio. Please try again.'
          });
        }
      });
  }

  formatAmount(amount: number): string {
    return this.portfolioService.formatAmount(amount);
  }

  formatPercentage(percentage: number): string {
    return this.portfolioService.formatPercentage(percentage);
  }

  getGainLossColorClass(gainLoss: number): string {
    return this.portfolioService.getGainLossColorClass(gainLoss);
  }
}