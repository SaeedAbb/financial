/**
 * Style utility functions
 * Provides consistent styling classes and visual indicators
 */

export class StyleUtils {
  /**
   * Get color class based on gain/loss value
   * @param value The gain/loss value
   * @returns CSS class name for text color
   */
  static getGainLossColorClass(value: number): string {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-500';
  }

  /**
   * Get background color class based on gain/loss value
   * @param value The gain/loss value
   * @returns CSS class name for background color
   */
  static getGainLossBgColorClass(value: number): string {
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-gray-50';
  }

  /**
   * Get PrimeNG severity based on performance
   * @param value The performance value
   * @returns PrimeNG severity level
   */
  static getPerformanceSeverity(value: number): 'success' | 'danger' | 'info' {
    if (value > 0) return 'success';
    if (value < 0) return 'danger';
    return 'info';
  }

  /**
   * Get badge class based on performance
   * @param value The performance value
   * @returns CSS classes for badge styling
   */
  static getPerformanceBadgeClass(value: number): string {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded';
    
    if (value > 0) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    if (value < 0) {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
  }

  /**
   * Get icon class based on trend
   * @param value The trend value
   * @returns PrimeNG icon class
   */
  static getTrendIconClass(value: number): string {
    if (value > 0) return 'pi pi-arrow-up text-green-500';
    if (value < 0) return 'pi pi-arrow-down text-red-500';
    return 'pi pi-minus text-gray-500';
  }

  /**
   * Get status color based on status value
   * @param status The status string
   * @returns CSS class for status color
   */
  static getStatusColorClass(status: string): string {
    const statusColors: Record<string, string> = {
      'ACTIVE': 'text-green-600',
      'CLOSED': 'text-gray-600',
      'PENDING': 'text-yellow-600',
      'CANCELLED': 'text-red-600',
      'COMPLETED': 'text-blue-600'
    };

    return statusColors[status] || 'text-gray-600';
  }

  /**
   * Get status badge severity for PrimeNG
   * @param status The status string
   * @returns PrimeNG severity level
   */
  static getStatusSeverity(status: string): 'success' | 'danger' | 'info' | 'warn' {
    const statusSeverity: Record<string, 'success' | 'danger' | 'info' | 'warn'> = {
      'ACTIVE': 'success',
      'CLOSED': 'info',
      'PENDING': 'warn',
      'CANCELLED': 'danger',
      'COMPLETED': 'info'
    };

    return statusSeverity[status] || 'info';
  }

  /**
   * Get skeleton loading classes
   * @param type The type of skeleton ('text', 'button', 'card')
   * @returns CSS classes for skeleton loader
   */
  static getSkeletonClass(type: 'text' | 'button' | 'card' = 'text'): string {
    const baseClass = 'animate-pulse bg-gray-200 rounded';
    
    switch (type) {
      case 'text':
        return `${baseClass} h-4 w-full`;
      case 'button':
        return `${baseClass} h-10 w-24`;
      case 'card':
        return `${baseClass} h-32 w-full`;
      default:
        return baseClass;
    }
  }

  /**
   * Get chart color palette
   * @param index The color index
   * @returns Hex color code
   */
  static getChartColor(index: number): string {
    const colors = [
      '#10B981', // green
      '#EF4444', // red
      '#3B82F6', // blue
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316'  // orange
    ];

    return colors[index % colors.length];
  }
}