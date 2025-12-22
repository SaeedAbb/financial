import { StockMaster } from './stock-master.model';

export interface PortfolioPosition {
  id: number;
  uuid: string;
  portfolioId: number;
  stock: StockMaster;
  quantity: number;
  averageCostBasis: number;
  totalCost: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
  firstPurchaseDate: string; // ISO date string (yyyy-MM-dd)
  lastTransactionDate: string; // ISO date string (yyyy-MM-dd)
  status: PositionStatus;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface BuyPositionRequest {
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  transactionDate: string; // ISO date string (yyyy-MM-dd)
  companyName?: string; // Optional - used if stock doesn't exist in master
}

export interface SellPositionRequest {
  quantity: number;
  pricePerShare: number;
  transactionDate: string; // ISO date string (yyyy-MM-dd)
}

export interface PagedPositions {
  content: PortfolioPosition[];
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

export enum PositionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED'
}

export interface PositionStatusOption {
  label: string;
  value: PositionStatus;
  icon: string;
  severity: 'success' | 'info' | 'warn' | 'danger';
}

export const POSITION_STATUS_OPTIONS: PositionStatusOption[] = [
  {
    label: 'Active',
    value: PositionStatus.ACTIVE,
    icon: 'pi pi-check-circle',
    severity: 'success'
  },
  {
    label: 'Closed',
    value: PositionStatus.CLOSED,
    icon: 'pi pi-times-circle',
    severity: 'info'
  }
];

export function getPositionStatusLabel(status: PositionStatus): string {
  const option = POSITION_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status;
}

export function getPositionStatusIcon(status: PositionStatus): string {
  const option = POSITION_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.icon || 'pi pi-circle';
}

export function getPositionStatusSeverity(status: PositionStatus): 'success' | 'info' | 'warn' | 'danger' {
  const option = POSITION_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.severity || 'info';
}