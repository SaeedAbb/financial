/**
 * Number formatting utility functions
 * Provides consistent number formatting across the application
 */

export class NumberFormatter {
  private static readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Format a quantity with appropriate decimal places
   * @param quantity The quantity to format
   * @param decimalPlaces Number of decimal places (default: auto)
   * @returns Formatted quantity string
   */
  static formatQuantity(quantity: number, decimalPlaces?: number): string {
    if (quantity === null || quantity === undefined || isNaN(quantity)) {
      return '0';
    }

    // Auto-detect decimal places if not specified
    if (decimalPlaces === undefined) {
      // If whole number, show no decimals
      if (Number.isInteger(quantity)) {
        decimalPlaces = 0;
      } else {
        // Otherwise, show up to 6 decimal places, removing trailing zeros
        const str = quantity.toFixed(6);
        const trimmed = parseFloat(str).toString();
        decimalPlaces = (trimmed.split('.')[1] || '').length;
      }
    }

    return new Intl.NumberFormat(this.DEFAULT_LOCALE, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces
    }).format(quantity);
  }

  /**
   * Format a large number with abbreviation (K, M, B)
   * @param value The number to format
   * @param decimalPlaces Number of decimal places (default: 1)
   * @returns Formatted abbreviated number string
   */
  static formatCompactNumber(value: number, decimalPlaces = 1): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    const absValue = Math.abs(value);
    let formattedValue: string;

    if (absValue >= 1_000_000_000) {
      formattedValue = `${(value / 1_000_000_000).toFixed(decimalPlaces)}B`;
    } else if (absValue >= 1_000_000) {
      formattedValue = `${(value / 1_000_000).toFixed(decimalPlaces)}M`;
    } else if (absValue >= 1_000) {
      formattedValue = `${(value / 1_000).toFixed(decimalPlaces)}K`;
    } else {
      formattedValue = value.toFixed(decimalPlaces);
    }

    // Remove trailing zeros after decimal point
    formattedValue = formattedValue.replace(/\.0+([BMK])?$/, '$1');
    
    return formattedValue;
  }

  /**
   * Format a number with grouping separators
   * @param value The number to format
   * @param decimalPlaces Number of decimal places (default: 0)
   * @returns Formatted number with separators
   */
  static formatWithSeparators(value: number, decimalPlaces = 0): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    return new Intl.NumberFormat(this.DEFAULT_LOCALE, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  }

  /**
   * Format a number as an ordinal (1st, 2nd, 3rd, etc.)
   * @param value The number to format
   * @returns Formatted ordinal string
   */
  static formatOrdinal(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }

    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = value % 100;
    
    return value + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  /**
   * Round a number to specified decimal places
   * @param value The number to round
   * @param decimalPlaces Number of decimal places
   * @returns Rounded number
   */
  static round(value: number, decimalPlaces = 2): number {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }

    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  /**
   * Parse a formatted number string back to number
   * @param value The formatted number string
   * @returns Parsed number value
   */
  static parseNumber(value: string): number {
    if (!value) return 0;
    
    // Remove thousand separators and convert decimal comma to dot
    const cleanedValue = value
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '');
    
    return parseFloat(cleanedValue) || 0;
  }
}