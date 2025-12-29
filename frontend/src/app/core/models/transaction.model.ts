export interface Transaction {
  id: number;
  uuid: string;
  userId: string;
  transactionCategory: TransactionCategory;
  transactionType: TransactionType;
  referenceId: number;
  referenceType: string;
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees: number;
  netAmount: number;
  transactionDate: string;
  notes?: string;
  createdAt: string;
}

export enum TransactionCategory {
  STOCK = 'STOCK',
  CRYPTO = 'CRYPTO',
  FOREX = 'FOREX',
  COMMODITY = 'COMMODITY',
  BOND = 'BOND',
  ETF = 'ETF',
  MUTUAL_FUND = 'MUTUAL_FUND',
  OPTION = 'OPTION'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
  FEE = 'FEE',
  SPLIT = 'SPLIT',
  MERGER = 'MERGER',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  INTEREST = 'INTEREST',
  TAX = 'TAX'
}

export interface TransactionSummary {
  totalBuyAmount: number;
  totalSellAmount: number;
  totalFees: number;
  totalDividends: number;
  netPosition: number;
  transactionCount: number;
}