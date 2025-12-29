export interface Portfolio {
  id: number;
  uuid: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

// Enhanced portfolio with statistics
export interface PortfolioWithStatistics extends Portfolio {
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  activePositionsCount: number;
  closedPositionsCount: number;
  totalPositionsCount: number;
  distinctStocksCount: number;
}

// Portfolio statistics interface
export interface PortfolioStatistics {
  id: number;
  uuid: string;
  name: string;
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  activePositionsCount: number;
  closedPositionsCount: number;
  totalPositionsCount: number;
  distinctStocksCount: number;
  oldestPositionDate?: string;
  newestPositionDate?: string;
}

// Portfolio summary for dashboard
export interface PortfolioSummary {
  totalPortfolios: number;
  totalActivePositions: number;
  totalClosedPositions: number;
  totalDistinctStocks: number;
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name: string;
  description?: string;
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