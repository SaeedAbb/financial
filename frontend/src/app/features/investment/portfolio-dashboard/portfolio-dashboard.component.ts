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
import { Portfolio, CreatePortfolioRequest, PortfolioSummary, PortfolioStatistics } from '../../../core/models/portfolio.model';
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
  portfolioStatistics: Map<string, PortfolioStatistics> = new Map();
  portfolioSummary: PortfolioSummary | null = null;
  loading = false;
  loadingSummary = false;
  loadingStatistics = false;
  submitting = false;
  showDialog = false;
  isEditMode = false;
  selectedPortfolio: Portfolio | null = null;

  portfolioForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]]
  });

  ngOnInit(): void {
    this.loadData();
    
    // Subscribe to portfolio updates
    this.portfolioService.portfoliosUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loadPortfolios();
    this.loadSummary();
  }

  loadPortfolios(): void {
    this.loading = true;
    this.portfolioService.getAllPortfolios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (portfolios) => {
          this.portfolios = portfolios;
          this.loading = false;
          // Load individual portfolio statistics
          this.loadPortfolioStatistics();
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
    this.loadingSummary = true;
    this.portfolioService.getPortfoliosSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.portfolioSummary = summary;
          this.loadingSummary = false;
        },
        error: (error) => {
          console.error('Error loading portfolio summary:', error);
          this.loadingSummary = false;
        }
      });
  }

  loadPortfolioStatistics(): void {
    if (this.portfolios.length === 0) return;
    
    this.loadingStatistics = true;
    this.portfolioStatistics.clear();
    
    // Load statistics for each portfolio
    const statisticsPromises = this.portfolios.map(portfolio =>
      this.portfolioService.getPortfolioStatistics(portfolio.uuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (statistics) => {
            this.portfolioStatistics.set(portfolio.uuid, statistics);
          },
          error: (error) => {
            console.error(`Error loading statistics for portfolio ${portfolio.uuid}:`, error);
          }
        })
    );
    
    // Set loading to false when all are done (or after a timeout)
    setTimeout(() => {
      this.loadingStatistics = false;
    }, 2000);
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

  // Utility methods for getting portfolio statistics
  getPortfolioStatistics(portfolioUuid: string): PortfolioStatistics | null {
    return this.portfolioStatistics.get(portfolioUuid) || null;
  }

  getPortfolioInvestment(portfolioUuid: string): number {
    const stats = this.getPortfolioStatistics(portfolioUuid);
    return stats?.totalInvestment || 0;
  }

  getPortfolioCurrentValue(portfolioUuid: string): number {
    const stats = this.getPortfolioStatistics(portfolioUuid);
    return stats?.totalCurrentValue || 0;
  }

  getPortfolioGainLoss(portfolioUuid: string): number {
    const stats = this.getPortfolioStatistics(portfolioUuid);
    return stats?.totalGainLoss || 0;
  }

  getPortfolioGainLossPercentage(portfolioUuid: string): number {
    const stats = this.getPortfolioStatistics(portfolioUuid);
    return stats?.gainLossPercentage || 0;
  }

  getPortfolioActivePositions(portfolioUuid: string): number {
    const stats = this.getPortfolioStatistics(portfolioUuid);
    return stats?.activePositionsCount || 0;
  }

  getPortfolioDistinctStocks(portfolioUuid: string): number {
    const stats = this.getPortfolioStatistics(portfolioUuid);
    return stats?.distinctStocksCount || 0;
  }

  // Formatting methods
  formatCurrency(amount: number): string {
    return this.portfolioService.formatCurrency(amount);
  }

  formatCurrencyCompact(amount: number): string {
    return this.portfolioService.formatCurrencyCompact(amount);
  }

  formatPercentage(percentage: number): string {
    return this.portfolioService.formatPercentage(percentage);
  }

  formatQuantity(quantity: number): string {
    return this.portfolioService.formatQuantity(quantity);
  }

  getGainLossColorClass(gainLoss: number): string {
    return this.portfolioService.getGainLossColorClass(gainLoss);
  }

  getPerformanceSeverity(gainLoss: number): 'success' | 'danger' | 'info' {
    return this.portfolioService.getPerformanceSeverity(gainLoss);
  }

  getPerformanceBadgeClass(gainLoss: number): string {
    return this.portfolioService.getPerformanceBadgeClass(gainLoss);
  }

  formatDate(dateString: string): string {
    return this.portfolioService.formatDate(dateString);
  }

  getRelativeDateString(dateString: string): string {
    return this.portfolioService.getRelativeDateString(dateString);
  }

  // Summary calculations
  get totalPortfolios(): number {
    return this.portfolioSummary?.totalPortfolios || 0;
  }

  get totalInvestment(): number {
    return this.portfolioSummary?.totalInvestment || 0;
  }

  get totalCurrentValue(): number {
    return this.portfolioSummary?.totalCurrentValue || 0;
  }

  get totalGainLoss(): number {
    return this.portfolioSummary?.totalGainLoss || 0;
  }

  get totalGainLossPercentage(): number {
    return this.portfolioSummary?.totalGainLossPercentage || 0;
  }

  get totalActivePositions(): number {
    return this.portfolioSummary?.totalActivePositions || 0;
  }

  get totalDistinctStocks(): number {
    return this.portfolioSummary?.totalDistinctStocks || 0;
  }

  // Helper methods
  hasData(): boolean {
    return this.portfolios.length > 0;
  }

  isGainer(portfolioUuid: string): boolean {
    return this.getPortfolioGainLoss(portfolioUuid) > 0;
  }

  isLoser(portfolioUuid: string): boolean {
    return this.getPortfolioGainLoss(portfolioUuid) < 0;
  }
}