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
import { Subject, takeUntil } from 'rxjs';
import { Portfolio } from '../../../core/models/portfolio.model';
import { PortfolioPosition, BuyPositionRequest, SellPositionRequest, PositionStatus } from '../../../core/models/portfolio-position.model';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { PortfolioPositionService } from '../../../core/services/portfolio-position.service';

// TODO: This component needs significant refactoring to work with the new backend structure
// The backend has been refactored to separate portfolio positions, stock master data, and transactions
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
  private positionService = inject(PortfolioPositionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();

  portfolio: Portfolio | null = null;
  positions: PortfolioPosition[] = [];
  activePositions: PortfolioPosition[] = [];
  closedPositions: PortfolioPosition[] = [];
  filteredPositions: PortfolioPosition[] = [];
  selectedPosition: PortfolioPosition | null = null;
  
  loading = false;
  submittingBuy = false;
  submittingSell = false;
  showBuyDialog = false;
  showSellDialog = false;
  
  today = new Date();

  buyPositionForm: FormGroup = this.fb.group({
    stockSymbol: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9.-]+$/)]],
    companyName: ['', [Validators.maxLength(255)]],
    quantity: [null, [Validators.required, Validators.min(0.000001)]],
    pricePerShare: [null, [Validators.required, Validators.min(0.01)]],
    transactionDate: [new Date(), [Validators.required]]
  });

  sellPositionForm: FormGroup = this.fb.group({
    quantity: [null, [Validators.required, Validators.min(0.000001)]],
    pricePerShare: [null, [Validators.required, Validators.min(0.01)]],
    transactionDate: [new Date(), [Validators.required]]
  });

  ngOnInit(): void {
    const portfolioUuid = this.route.snapshot.paramMap.get('uuid');
    if (portfolioUuid) {
      this.loadPortfolio(portfolioUuid);
      this.loadPositions(portfolioUuid);
    }

    // Subscribe to position updates
    this.positionService.positionsUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.portfolio) {
          this.loadPortfolio(this.portfolio.uuid);
          this.loadPositions(this.portfolio.uuid);
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

  loadPositions(portfolioUuid: string): void {
    this.positionService.getPortfolioPositions(portfolioUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (positions) => {
          this.positions = positions;
          this.activePositions = positions.filter(p => p.status === PositionStatus.ACTIVE);
          this.closedPositions = positions.filter(p => p.status === PositionStatus.CLOSED);
          this.filteredPositions = [...positions];
        },
        error: (error) => {
          console.error('Error loading positions:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load positions. Please try again.'
          });
        }
      });
  }

  showBuyPositionDialog(): void {
    this.buyPositionForm.reset({
      transactionDate: new Date()
    });
    this.showBuyDialog = true;
  }

  hideBuyDialog(): void {
    this.showBuyDialog = false;
    this.buyPositionForm.reset();
  }

  showSellPositionDialog(position: PortfolioPosition): void {
    this.selectedPosition = position;
    this.sellPositionForm.reset({
      quantity: position.quantity,
      transactionDate: new Date()
    });
    this.showSellDialog = true;
  }

  hideSellDialog(): void {
    this.showSellDialog = false;
    this.sellPositionForm.reset();
    this.selectedPosition = null;
  }

  onBuySubmit(): void {
    if (this.buyPositionForm.valid && this.portfolio) {
      this.submittingBuy = true;
      const formValue = this.buyPositionForm.value;
      
      const request: BuyPositionRequest = {
        stockSymbol: formValue.stockSymbol.toUpperCase(),
        quantity: formValue.quantity,
        pricePerShare: formValue.pricePerShare,
        transactionDate: this.formatDateForAPI(formValue.transactionDate),
        companyName: formValue.companyName?.trim()
      };

      this.positionService.buyPosition(this.portfolio.uuid, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (position) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Position created successfully'
            });
            this.hideBuyDialog();
            this.submittingBuy = false;
          },
          error: (error) => {
            console.error('Error buying position:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to create position. Please try again.'
            });
            this.submittingBuy = false;
          }
        });
    }
  }

  onSellSubmit(): void {
    if (this.sellPositionForm.valid && this.selectedPosition && this.portfolio) {
      this.submittingSell = true;
      const formValue = this.sellPositionForm.value;
      
      const request: SellPositionRequest = {
        quantity: formValue.quantity,
        pricePerShare: formValue.pricePerShare,
        transactionDate: this.formatDateForAPI(formValue.transactionDate)
      };

      this.positionService.sellPosition(this.portfolio.uuid, this.selectedPosition.uuid, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (position) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Position sold successfully'
            });
            this.hideSellDialog();
            this.submittingSell = false;
          },
          error: (error) => {
            console.error('Error selling position:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to sell position. Please try again.'
            });
            this.submittingSell = false;
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/investment']);
  }

  formatAmount(amount: number): string {
    return this.positionService.formatAmount(amount);
  }

  formatPercentage(percentage: number): string {
    return this.positionService.formatPercentage(percentage);
  }

  formatDate(dateString: string): string {
    return this.positionService.formatDate(dateString);
  }

  getGainLossColorClass(gainLoss: number): string {
    return this.positionService.getGainLossColorClass(gainLoss);
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  trackByPositionId(index: number, position: PortfolioPosition): string {
    return position.uuid;
  }
}