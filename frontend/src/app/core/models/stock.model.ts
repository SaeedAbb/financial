export interface Stock {
  id: number;
  uuid: string;
  portfolioId: number;
  portfolioName: string;
  symbol: string;
  companyName: string;
  quantity: number;
  availableQuantity: number;
  soldQuantity: number;
  purchasePrice: number;
  purchaseDate: string; // ISO date string (yyyy-MM-dd)
  status: StockStatus;
  salePrice?: number;
  saleDate?: string; // ISO date string (yyyy-MM-dd)
  investmentValue: number;
  currentValue?: number;
  gainLoss: number;
  gainLossPercentage: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface BuyStockRequest {
  portfolioUuid: string;
  symbol: string;
  companyName: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string; // ISO date string (yyyy-MM-dd)
}

export interface SellStockRequest {
  stockUuid: string;
  quantity?: number; // Optional - if not provided, sell all available quantity
  salePrice: number;
  saleDate: string; // ISO date string (yyyy-MM-dd)
}

export interface SellStockGroupRequest {
  symbol: string;
  portfolioUuid: string;
  quantity: number; // Quantity to sell from the group
  salePrice: number;
  saleDate: string; // ISO date string (yyyy-MM-dd)
  sellStrategy?: 'FIFO' | 'LIFO' | 'AVERAGE'; // Default: FIFO
}

export interface StockSummary {
  totalStocks: number;
  totalInvestment: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  distinctSymbols: number;
}

export interface PagedStocks {
  content: Stock[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

export enum StockStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD'
}

export interface StockStatusOption {
  label: string;
  value: StockStatus;
  icon: string;
  severity: 'success' | 'info' | 'warn' | 'danger';
}

export const STOCK_STATUS_OPTIONS: StockStatusOption[] = [
  {
    label: 'Active',
    value: StockStatus.ACTIVE,
    icon: 'pi pi-check-circle',
    severity: 'success'
  },
  {
    label: 'Sold',
    value: StockStatus.SOLD,
    icon: 'pi pi-times-circle',
    severity: 'info'
  }
];

export function getStockStatusLabel(status: StockStatus): string {
  const option = STOCK_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status;
}

export function getStockStatusIcon(status: StockStatus): string {
  const option = STOCK_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.icon || 'pi pi-circle';
}

export function getStockStatusSeverity(status: StockStatus): 'success' | 'info' | 'warn' | 'danger' {
  const option = STOCK_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.severity || 'info';
}

export interface StockGroup {
  symbol: string;
  companyName: string;
  positions: Stock[];
  totalQuantity: number;
  totalAvailableQuantity: number;
  totalSoldQuantity: number;
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  activePositions: Stock[];
  soldPositions: Stock[];
  activePositionsCount: number;
  soldPositionsCount: number;
  earliestPurchaseDate: string; // ISO date string (yyyy-MM-dd)
  latestPurchaseDate: string; // ISO date string (yyyy-MM-dd)
  weightedAveragePurchaseDate: string; // ISO date string (yyyy-MM-dd)
  averagePurchasePrice: number;
  canSell: boolean;
}