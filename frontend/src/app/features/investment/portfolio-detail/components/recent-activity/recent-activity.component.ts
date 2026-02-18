import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  inject,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { finalize } from 'rxjs';
import { TransactionService } from '../../../../../core/services/transaction.service';
import { Transaction, PagedResponse } from '../../../../../core/models/transaction.model';
import { PortfolioPosition } from '../../../../../core/models/portfolio-position.model';
import { ActivityCardComponent } from '../activity-card/activity-card.component';

/**
 * Recent activity container component for displaying portfolio transaction history.
 * Shows rich activity cards with stock logos, descriptions, and portfolio context.
 */
@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule,
    ActivityCardComponent
  ],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentActivityComponent implements OnChanges {
  private readonly transactionService = inject(TransactionService);

  portfolioId = input.required<number>();
  positions = input<PortfolioPosition[]>([]);

  transactions = signal<Transaction[]>([]);
  loading = signal<boolean>(false);
  loadingMore = signal<boolean>(false);
  hasMore = signal<boolean>(false);
  totalElements = signal<number>(0);

  private currentPage = 0;
  private readonly pageSize = 10;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['portfolioId'] && this.portfolioId()) {
      this.loadInitialTransactions();
    }
  }

  private loadInitialTransactions(): void {
    this.currentPage = 0;
    this.loading.set(true);

    this.transactionService.getPortfolioTransactionsPaged(this.portfolioId(), 0, this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.handleResponse(response, true),
        error: (error) => console.error('Error loading transactions:', error)
      });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.currentPage++;
    this.loadingMore.set(true);

    this.transactionService.getPortfolioTransactionsPaged(this.portfolioId(), this.currentPage, this.pageSize)
      .pipe(finalize(() => this.loadingMore.set(false)))
      .subscribe({
        next: (response) => this.handleResponse(response, false),
        error: (error) => console.error('Error loading more transactions:', error)
      });
  }

  private handleResponse(response: PagedResponse<Transaction>, reset: boolean): void {
    if (reset) {
      this.transactions.set(response.content);
    } else {
      this.transactions.update(existing => [...existing, ...response.content]);
    }
    this.hasMore.set(!response.last);
    this.totalElements.set(response.totalElements);
  }

  /**
   * Calculate the current portfolio percentage for a stock symbol.
   * Returns 0 if the position is not found (e.g., closed position).
   */
  getPortfolioPercentage(symbol: string): number {
    const positionsList = this.positions();
    if (!positionsList || positionsList.length === 0) return 0;

    const totalValue = positionsList.reduce((sum, p) => sum + (p.currentValue || p.totalCost), 0);
    if (totalValue === 0) return 0;

    const position = positionsList.find(p => p.stock.symbol === symbol);
    if (!position) return 0;

    const positionValue = position.currentValue || position.totalCost;
    return (positionValue / totalValue) * 100;
  }

  /**
   * Get company name for a stock symbol from positions.
   */
  getCompanyName(symbol: string): string {
    const position = this.positions().find(p => p.stock.symbol === symbol);
    return position?.stock.companyName || '';
  }

  trackByTransactionId(_index: number, transaction: Transaction): string {
    return transaction.uuid;
  }
}
