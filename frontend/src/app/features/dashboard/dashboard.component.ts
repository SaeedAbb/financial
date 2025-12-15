import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Subject, takeUntil } from 'rxjs';
import { SavingService } from '../../core/services/saving.service';
import { SavingsSummary } from '../../core/models/saving.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  totalSavings = 0;
  savingsSummary: SavingsSummary | null = null;
  loading = true;
  
  constructor(private savingService: SavingService) {}
  
  ngOnInit(): void {
    this.loadSavingsSummary();
    
    // Subscribe to savings updates
    this.savingService.savingsUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSavingsSummary();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadSavingsSummary(): void {
    this.savingService.getSavingsSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.savingsSummary = summary;
          this.totalSavings = summary.totalAmount;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading savings summary:', error);
          this.loading = false;
        }
      });
  }
  
  formatCurrency(amount: number): string {
    return this.savingService.formatAmount(amount);
  }
}