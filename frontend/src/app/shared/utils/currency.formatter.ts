/**
 * Currency formatting utility functions
 * Provides consistent currency formatting across the application
 */

export class CurrencyFormatter {
  private static readonly DEFAULT_CURRENCY = 'EUR';
  private static readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Format a number as currency with full precision
   * @param amount The amount to format
   * @param currency The currency code (default: EUR)
   * @returns Formatted currency string
   */
  static formatCurrency(amount: number, currency: string = this.DEFAULT_CURRENCY): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${this.getCurrencySymbol(currency)}0.00`;
    }

    return new Intl.NumberFormat(this.DEFAULT_LOCALE, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format a number as compact currency (e.g., €1.2K, €1.5M)
   * @param amount The amount to format
   * @param currency The currency code (default: EUR)
   * @returns Formatted compact currency string
   */
  static formatCurrencyCompact(amount: number, currency: string = this.DEFAULT_CURRENCY): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${this.getCurrencySymbol(currency)}0`;
    }

    const absAmount = Math.abs(amount);
    let formattedAmount: string;
    
    if (absAmount >= 1_000_000) {
      formattedAmount = `${this.getCurrencySymbol(currency)}${(amount / 1_000_000).toFixed(1)}M`;
    } else if (absAmount >= 1_000) {
      formattedAmount = `${this.getCurrencySymbol(currency)}${(amount / 1_000).toFixed(1)}K`;
    } else {
      formattedAmount = this.formatCurrency(amount, currency);
    }
    
    return formattedAmount;
  }

  /**
   * Format a number as a monetary amount without currency symbol
   * @param amount The amount to format
   * @returns Formatted amount string
   */
  static formatAmount(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }

    return new Intl.NumberFormat(this.DEFAULT_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get the currency symbol for a given currency code
   * @param currency The currency code
   * @returns Currency symbol
   */
  private static getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'CHF': 'Fr.'
    };
    
    return symbols[currency] || currency + ' ';
  }

  /**
   * Parse a formatted currency string back to number
   * @param value The formatted currency string
   * @returns Parsed number value
   */
  static parseCurrency(value: string): number {
    if (!value) return 0;
    
    // Remove currency symbols and separators
    const cleanedValue = value
      .replace(/[€$£¥]/g, '')
      .replace(/[^\d.-]/g, '')
      .replace(',', '.');
    
    return parseFloat(cleanedValue) || 0;
  }
}