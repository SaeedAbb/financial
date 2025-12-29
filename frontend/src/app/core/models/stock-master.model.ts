export interface StockMaster {
  id: number;
  symbol: string;
  companyName: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  marketCapCategory?: MarketCapCategory;
  isin?: string;
  stockType?: string;
  currentPrice?: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface CreateStockMasterRequest {
  symbol: string;
  companyName: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  marketCapCategory?: MarketCapCategory;
  isin?: string;
  stockType?: string;
}

export interface PagedStockMasters {
  content: StockMaster[];
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

export enum MarketCapCategory {
  LARGE_CAP = 'LARGE_CAP',
  MID_CAP = 'MID_CAP',
  SMALL_CAP = 'SMALL_CAP',
  MICRO_CAP = 'MICRO_CAP'
}

export interface MarketCapCategoryOption {
  label: string;
  value: MarketCapCategory;
  description: string;
}

export const MARKET_CAP_CATEGORY_OPTIONS: MarketCapCategoryOption[] = [
  {
    label: 'Large Cap',
    value: MarketCapCategory.LARGE_CAP,
    description: 'Market cap > $10B'
  },
  {
    label: 'Mid Cap',
    value: MarketCapCategory.MID_CAP,
    description: 'Market cap $2B - $10B'
  },
  {
    label: 'Small Cap',
    value: MarketCapCategory.SMALL_CAP,
    description: 'Market cap $300M - $2B'
  },
  {
    label: 'Micro Cap',
    value: MarketCapCategory.MICRO_CAP,
    description: 'Market cap < $300M'
  }
];

export function getMarketCapCategoryLabel(category: MarketCapCategory): string {
  const option = MARKET_CAP_CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option?.label || category;
}

export function getMarketCapCategoryDescription(category: MarketCapCategory): string {
  const option = MARKET_CAP_CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option?.description || '';
}