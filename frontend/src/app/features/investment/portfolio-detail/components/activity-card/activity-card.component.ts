import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { Transaction, TransactionType } from '../../../../../core/models/transaction.model';

/**
 * Activity card component for displaying individual transaction activity.
 * Shows stock logo, symbol, company name, date/time, and rich description.
 */
@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, CurrencyPipe],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityCardComponent {
  transaction = input.required<Transaction>();
  portfolioPercentage = input<number>(0);
  companyName = input<string>('');

  readonly TransactionType = TransactionType;

  private readonly FINNHUB_LOGO_URL = 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/';

  logoUrl = computed(() => `${this.FINNHUB_LOGO_URL}${this.transaction().symbol}.png`);

  logoFailed = false;

  description = computed(() => {
    const t = this.transaction();
    const percentage = this.portfolioPercentage();
    const quantity = this.formatQuantity(t.quantity);
    const price = this.formatCurrency(t.pricePerUnit);
    const symbol = t.symbol;

    if (t.transactionType === TransactionType.BUY) {
      const portfolioText = percentage > 0 ? ` ${symbol} is now ${percentage.toFixed(2)}% of portfolio.` : '';
      return `Purchased ${quantity} shares at ${price}.${portfolioText}`;
    } else if (t.transactionType === TransactionType.SELL) {
      const portfolioText = percentage > 0
        ? ` ${symbol} is now ${percentage.toFixed(2)}% of portfolio.`
        : ' Position closed.';
      return `Sold ${quantity} shares at ${price}.${portfolioText}`;
    } else if (t.transactionType === TransactionType.DIVIDEND) {
      return `Received dividend of ${this.formatCurrency(t.totalAmount)}.`;
    }
    return `${t.transactionType} transaction: ${quantity} shares at ${price}.`;
  });

  formattedDateTime = computed(() => {
    const date = new Date(this.transaction().transactionDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  });

  onLogoError(): void {
    this.logoFailed = true;
  }

  getInitial(): string {
    return this.transaction().symbol.charAt(0).toUpperCase();
  }

  private formatQuantity(quantity: number): string {
    if (Number.isInteger(quantity)) {
      return quantity.toString();
    }
    return quantity.toFixed(2);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}
