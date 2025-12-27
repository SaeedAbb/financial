/**
 * Percentage formatting utility functions
 * Provides consistent percentage formatting across the application
 */

export class PercentageFormatter {
  private static readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Format a number as a percentage with specified decimal places
   * @param value The percentage value (e.g., 0.1234 for 12.34%)
   * @param decimalPlaces Number of decimal places (default: 2)
   * @returns Formatted percentage string with % symbol
   */
  static formatPercentage(value: number, decimalPlaces: number = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%';
    }

    return new Intl.NumberFormat(this.DEFAULT_LOCALE, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value / 100); // Divide by 100 as our values are already in percentage form
  }

  /**
   * Format a percentage value with sign (+/-) always shown
   * @param value The percentage value
   * @param decimalPlaces Number of decimal places (default: 2)
   * @returns Formatted percentage string with sign
   */
  static formatPercentageWithSign(value: number, decimalPlaces: number = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%';
    }

    const formatted = this.formatPercentage(Math.abs(value), decimalPlaces);
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  /**
   * Format a decimal as percentage (e.g., 0.1234 becomes "12.34%")
   * @param decimal The decimal value
   * @param decimalPlaces Number of decimal places (default: 2)
   * @returns Formatted percentage string
   */
  static formatDecimalAsPercentage(decimal: number, decimalPlaces: number = 2): string {
    if (decimal === null || decimal === undefined || isNaN(decimal)) {
      return '0.00%';
    }

    return this.formatPercentage(decimal * 100, decimalPlaces);
  }

  /**
   * Get color class based on percentage value
   * @param percentage The percentage value
   * @returns CSS class name for styling
   */
  static getPercentageColorClass(percentage: number): string {
    if (percentage > 0) return 'text-green-500';
    if (percentage < 0) return 'text-red-500';
    return 'text-gray-500';
  }

  /**
   * Get severity level based on percentage value (for PrimeNG components)
   * @param percentage The percentage value
   * @returns Severity level
   */
  static getPercentageSeverity(percentage: number): 'success' | 'danger' | 'info' {
    if (percentage > 0) return 'success';
    if (percentage < 0) return 'danger';
    return 'info';
  }

  /**
   * Parse a formatted percentage string back to number
   * @param value The formatted percentage string
   * @returns Parsed percentage value
   */
  static parsePercentage(value: string): number {
    if (!value) return 0;
    
    // Remove percentage symbol and parse
    const cleanedValue = value.replace('%', '').replace(',', '.');
    return parseFloat(cleanedValue) || 0;
  }
}