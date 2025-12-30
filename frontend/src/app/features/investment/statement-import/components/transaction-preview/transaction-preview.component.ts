import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ParsedTransaction } from '../../models/parsed-transaction.model';

@Component({
  selector: 'app-transaction-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    InputNumberModule,
    MessageModule
  ],
  templateUrl: './transaction-preview.component.html',
  styleUrls: ['./transaction-preview.component.scss']
})
export class TransactionPreviewComponent implements OnChanges {
  @Input() transactions: ParsedTransaction[] = [];
  @Output() readonly confirm = new EventEmitter<ParsedTransaction[]>();
  @Output() readonly cancelled = new EventEmitter<void>();

  editableTransactions: ParsedTransaction[] = [];

  ngOnChanges(): void {
    // Create a deep copy for editing
    this.editableTransactions = this.transactions.map(t => ({ ...t }));
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getBuyCount(): number {
    return this.editableTransactions.filter(t => t.type === 'BUY').length;
  }

  getSellCount(): number {
    return this.editableTransactions.filter(t => t.type === 'SELL').length;
  }

  getTotalValue(): number {
    return this.editableTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  }

  confirmImport(): void {
    this.confirm.emit(this.editableTransactions);
  }
}