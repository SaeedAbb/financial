/**
 * Date formatting utility functions
 * Provides consistent date formatting and manipulation across the application
 */

export class DateFormatter {
  private static readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Format a date string to a localized date format
   * @param dateString The ISO date string
   * @param format The date format ('short', 'medium', 'long', 'full')
   * @returns Formatted date string
   */
  static formatDate(dateString: string | Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    if (!dateString) return '';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      if (isNaN(date.getTime())) {
        return '';
      }

      const options: Intl.DateTimeFormatOptions = {
        short: { year: '2-digit' as const, month: 'numeric' as const, day: 'numeric' as const },
        medium: { year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const },
        long: { year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const },
        full: { weekday: 'long' as const, year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const }
      }[format];

      return new Intl.DateTimeFormat(this.DEFAULT_LOCALE, options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Format a date for API submission (YYYY-MM-DD)
   * @param date The date to format
   * @returns ISO date string (YYYY-MM-DD)
   */
  static formatDateForAPI(date: Date): string {
    if (!date) return '';
    
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for API:', error);
      return '';
    }
  }

  /**
   * Get relative date string (e.g., "2 days ago", "in 3 hours")
   * @param dateString The ISO date string
   * @returns Relative date string
   */
  static getRelativeDateString(dateString: string | Date): string {
    if (!dateString) return '';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      if (isNaN(date.getTime())) {
        return '';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
      }
      
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error getting relative date:', error);
      return '';
    }
  }

  /**
   * Check if a date is today
   * @param dateString The ISO date string
   * @returns True if the date is today
   */
  static isToday(dateString: string | Date): boolean {
    if (!dateString) return false;

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const today = new Date();
      
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the number of days between two dates
   * @param startDate The start date
   * @param endDate The end date
   * @returns Number of days between dates
   */
  static getDaysBetween(startDate: string | Date, endDate: string | Date): number {
    try {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      
      const diffMs = Math.abs(end.getTime() - start.getTime());
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days between:', error);
      return 0;
    }
  }

  /**
   * Format date range string
   * @param startDate The start date
   * @param endDate The end date
   * @returns Formatted date range string
   */
  static formatDateRange(startDate: string | Date, endDate: string | Date): string {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    
    if (!start || !end) return '';
    
    return `${start} - ${end}`;
  }
}