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
  templateUrl: './portfolio-dashboard.component.html',
  styleUrls: ['./portfolio-dashboard.component.scss'],
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
  providers: [MessageService, ConfirmationService]
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
    this.router.navigate(['/investment/portfolios', portfolio.uuid]);
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