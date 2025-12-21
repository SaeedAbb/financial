import { Stock } from './stock.model';

export interface Portfolio {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  stocks?: Stock[];
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  activeStocksCount: number;
  soldStocksCount: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name: string;
  description?: string;
}

export interface PortfolioSummary {
  totalPortfolios: number;
  totalActiveStocks: number;
  totalSoldStocks: number;
  totalInvestment: number;
  totalGainLoss: number;
}

export interface PagedPortfolios {
  content: Portfolio[];
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