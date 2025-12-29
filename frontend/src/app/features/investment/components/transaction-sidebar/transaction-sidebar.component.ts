import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';

import { Transaction, TransactionType } from '../../../../core/models/transaction.model';
import { PortfolioPosition } from '../../../../core/models/portfolio-position.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-transaction-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    TableModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    CardModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DatePickerModule,
    TooltipModule
  ],
  templateUrl: './transaction-sidebar.component.html',
  styleUrls: ['./transaction-sidebar.component.scss']
})
export class TransactionSidebarComponent implements OnChanges {
  @Input() visible = false;
  @Input() position: PortfolioPosition | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  loading = false;
  
  // Sorting
  sortField = 'transactionDate';
  sortOrder = -1; // -1 for DESC, 1 for ASC

  // Filtering
  filterValue = '';
  dateFilterStart: Date | null = null;
  dateFilterEnd: Date | null = null;
  selectedTransactionTypes: TransactionType[] = [];

  readonly TransactionType = TransactionType;

  private transactionService = inject(TransactionService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['position'] && this.position && this.visible) {
      this.loadPositionTransactions();
    }
    if (changes['visible'] && this.visible && this.position) {
      this.loadPositionTransactions();
    }
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetFilters();
  }

  private loadPositionTransactions(): void {
    if (!this.position?.id) return;

    this.loading = true;
    this.transactionService.getPositionTransactions(this.position.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading position transactions:', error);
          this.transactions = [];
          this.filteredTransactions = [];
        }
      });
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    } else {
      this.sortField = field;
      this.sortOrder = -1;
    }
    this.applyFilters();
  }

  onFilter(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filterValue = '';
    this.dateFilterStart = null;
    this.dateFilterEnd = null;
    this.selectedTransactionTypes = [];
    this.sortField = 'transactionDate';
    this.sortOrder = -1;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.transactions];

    // Text filter
    if (this.filterValue.trim()) {
      const searchTerm = this.filterValue.toLowerCase().trim();
      filtered = filtered.filter(transaction =>
        transaction.symbol?.toLowerCase().includes(searchTerm) ||
        transaction.transactionType?.toLowerCase().includes(searchTerm) ||
        transaction.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Date range filter
    if (this.dateFilterStart) {
      filtered = filtered.filter(transaction =>
        new Date(transaction.transactionDate) >= this.dateFilterStart!
      );
    }
    if (this.dateFilterEnd) {
      filtered = filtered.filter(transaction =>
        new Date(transaction.transactionDate) <= this.dateFilterEnd!
      );
    }

    // Transaction type filter
    if (this.selectedTransactionTypes.length > 0) {
      filtered = filtered.filter(transaction =>
        this.selectedTransactionTypes.includes(transaction.transactionType)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (this.sortField) {
        case 'transactionDate':
          aValue = new Date(a.transactionDate).getTime();
          bValue = new Date(b.transactionDate).getTime();
          break;
        case 'transactionType':
          aValue = a.transactionType;
          bValue = b.transactionType;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'pricePerUnit':
          aValue = a.pricePerUnit;
          bValue = b.pricePerUnit;
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default:
          aValue = a.transactionDate;
          bValue = b.transactionDate;
      }

      if (aValue < bValue) return this.sortOrder * -1;
      if (aValue > bValue) return this.sortOrder * 1;
      return 0;
    });

    this.filteredTransactions = filtered;
  }

  getTransactionTypeIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.BUY:
        return 'pi pi-plus-circle';
      case TransactionType.SELL:
        return 'pi pi-minus-circle';
      case TransactionType.DIVIDEND:
        return 'pi pi-money-bill';
      case TransactionType.FEE:
        return 'pi pi-exclamation-triangle';
      default:
        return 'pi pi-info-circle';
    }
  }

  getTransactionTypeSeverity(type: TransactionType): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (type) {
      case TransactionType.BUY:
        return 'success';
      case TransactionType.SELL:
        return 'info';
      case TransactionType.DIVIDEND:
        return 'warn';
      case TransactionType.FEE:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'pi pi-sort-alt';
    return this.sortOrder === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
  }

  getTotalBought(): number {
    return this.filteredTransactions
      .filter(t => t.transactionType === TransactionType.BUY)
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }

  getTotalSold(): number {
    return this.filteredTransactions
      .filter(t => t.transactionType === TransactionType.SELL)
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }

  getTotalFees(): number {
    return this.filteredTransactions
      .reduce((sum, t) => sum + (t.fees || 0), 0);
  }

  getNetQuantity(): number {
    return this.filteredTransactions
      .reduce((sum, t) => {
        if (t.transactionType === TransactionType.BUY) return sum + t.quantity;
        if (t.transactionType === TransactionType.SELL) return sum - t.quantity;
        return sum;
      }, 0);
  }
}