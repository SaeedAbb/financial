import { PositionStatus } from './portfolio-position.model';

/**
 * Stock group model representing aggregated positions for the same stock symbol
 */
export interface StockGroup {
  symbol: string;
  companyName: string;
  currentPrice: number;
  totalQuantity: number;
  activeQuantity: number;
  soldQuantity: number;
  weightedAveragePrice: number;
  totalCost: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  firstPurchaseDate: string; // ISO datetime string
  lastPurchaseDate: string; // ISO datetime string
  positions: StockGroupPosition[];
  positionCount: number;
}

/**
 * Individual position within a stock group
 */
export interface StockGroupPosition {
  id: number;
  uuid: string;
  quantity: number;
  purchasePrice: number;
  totalCost: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  status: PositionStatus;
  purchaseDate: string; // ISO datetime string
  lastUpdated: string; // ISO datetime string
}

/**
 * Stock group display options for UI
 */
export interface StockGroupDisplayOption {
  label: string;
  value: string;
  icon: string;
}

/**
 * Stock group sort options
 */
export const STOCK_GROUP_SORT_OPTIONS: StockGroupDisplayOption[] = [
  { label: 'Symbol A-Z', value: 'symbol', icon: 'pi pi-sort-alpha-down' },
  { label: 'Company Name', value: 'company', icon: 'pi pi-building' },
  { label: 'Gain/Loss', value: 'gainloss', icon: 'pi pi-chart-line' },
  { label: 'Percentage', value: 'percentage', icon: 'pi pi-percentage' },
  { label: 'Value', value: 'value', icon: 'pi pi-dollar' },
  { label: 'Quantity', value: 'quantity', icon: 'pi pi-hashtag' },
  { label: 'Purchase Date', value: 'date', icon: 'pi pi-calendar' }
];

/**
 * Stock group filter options
 */
export const STOCK_GROUP_FILTER_OPTIONS: StockGroupDisplayOption[] = [
  { label: 'All Stocks', value: 'all', icon: 'pi pi-list' },
  { label: 'Gainers Only', value: 'gainers', icon: 'pi pi-arrow-up' },
  { label: 'Losers Only', value: 'losers', icon: 'pi pi-arrow-down' },
  { label: 'Active Only', value: 'active', icon: 'pi pi-check-circle' },
  { label: 'Recent Purchases', value: 'recent', icon: 'pi pi-clock' }
];

/**
 * Selling strategy options for FIFO/LIFO
 */
export enum SellStrategy {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  SPECIFIC = 'SPECIFIC'
}

export interface SellStrategyOption {
  label: string;
  value: SellStrategy;
  description: string;
  icon: string;
}

export const SELL_STRATEGY_OPTIONS: SellStrategyOption[] = [
  {
    label: 'FIFO (First In, First Out)',
    value: SellStrategy.FIFO,
    description: 'Sell oldest positions first',
    icon: 'pi pi-sort-numeric-down'
  },
  {
    label: 'LIFO (Last In, First Out)',
    value: SellStrategy.LIFO,
    description: 'Sell newest positions first',
    icon: 'pi pi-sort-numeric-up'
  },
  {
    label: 'Specific Positions',
    value: SellStrategy.SPECIFIC,
    description: 'Choose specific positions to sell',
    icon: 'pi pi-check-square'
  }
];

/**
 * Sell group request interface
 */
export interface SellGroupRequest {
  symbol: string;
  quantity: number;
  pricePerShare: number;
  transactionDate: string; // ISO date string
  strategy: SellStrategy;
  specificPositionIds?: number[]; // Used when strategy is SPECIFIC
}

/**
 * Utility functions for stock groups
 */
export class StockGroupUtils {
  
  static isGainer(stockGroup: StockGroup): boolean {
    return stockGroup.totalGainLoss > 0;
  }
  
  static isLoser(stockGroup: StockGroup): boolean {
    return stockGroup.totalGainLoss < 0;
  }
  
  static isBreakeven(stockGroup: StockGroup): boolean {
    return Math.abs(stockGroup.totalGainLoss) < 0.01; // Within 1 cent
  }
  
  static hasActivePositions(stockGroup: StockGroup): boolean {
    return stockGroup.activeQuantity > 0;
  }
  
  static hasSoldPositions(stockGroup: StockGroup): boolean {
    return stockGroup.soldQuantity > 0;
  }
  
  static getGainLossClass(gainLoss: number): string {
    if (gainLoss > 0) return 'text-green-600';
    if (gainLoss < 0) return 'text-red-600';
    return 'text-gray-600';
  }
  
  static getPerformanceIcon(gainLoss: number): string {
    if (gainLoss > 0) return 'pi pi-arrow-up';
    if (gainLoss < 0) return 'pi pi-arrow-down';
    return 'pi pi-minus';
  }
  
  static getPerformanceSeverity(gainLoss: number): 'success' | 'danger' | 'info' {
    if (gainLoss > 0) return 'success';
    if (gainLoss < 0) return 'danger';
    return 'info';
  }
  
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  static formatPercentage(percentage: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(percentage / 100);
  }
  
  static formatQuantity(quantity: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(quantity);
  }
  
  static sortGroups(groups: StockGroup[], sortBy: string, ascending = true): StockGroup[] {
    const sorted = [...groups].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;
      
      switch (sortBy) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'company':
          aValue = a.companyName;
          bValue = b.companyName;
          break;
        case 'gainloss':
          aValue = a.totalGainLoss;
          bValue = b.totalGainLoss;
          break;
        case 'percentage':
          aValue = a.gainLossPercentage;
          bValue = b.gainLossPercentage;
          break;
        case 'value':
          aValue = a.totalCurrentValue;
          bValue = b.totalCurrentValue;
          break;
        case 'quantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'date':
          aValue = new Date(a.lastPurchaseDate);
          bValue = new Date(b.lastPurchaseDate);
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }
      
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }
  
  static filterGroups(groups: StockGroup[], filterBy: string, searchTerm?: string): StockGroup[] {
    let filtered = [...groups];
    
    // Apply search term filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(group => 
        group.symbol.toLowerCase().includes(term) ||
        group.companyName.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    switch (filterBy) {
      case 'gainers':
        filtered = filtered.filter(group => StockGroupUtils.isGainer(group));
        break;
      case 'losers':
        filtered = filtered.filter(group => StockGroupUtils.isLoser(group));
        break;
      case 'active':
        filtered = filtered.filter(group => StockGroupUtils.hasActivePositions(group));
        break;
      case 'recent': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(group => 
          new Date(group.lastPurchaseDate) >= thirtyDaysAgo
        );
        break;
      }
      case 'all':
      default:
        // No additional filtering
        break;
    }
    
    return filtered;
  }
}