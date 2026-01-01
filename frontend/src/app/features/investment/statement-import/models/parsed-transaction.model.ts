import { StatementProvider } from './provider.enum';

export interface ParsedTransaction {
  date: string;  // ISO format: YYYY-MM-DD
  type: 'BUY' | 'SELL';
  description: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees: number;
  currency: string;
  rawSymbol?: string;  // Symbol as extracted from PDF
  isin?: string;  // International Securities Identification Number
  providerReference?: string;  // Provider-specific reference
}

export interface ImportRequest {
  provider: StatementProvider;
  portfolioId: number;
  transactions: ParsedTransaction[];
  fileName?: string;
  providerMetadata?: Record<string, unknown>;
}


export interface TransactionImportResult {
  transactionId?: number;
  transactionUuid?: string;
  success: boolean;
  duplicate?: boolean;
  ticker?: string;
  errorMessage?: string;
}

export interface ImportResult {
  batchId: string;
  status: ImportStatus;
  totalTransactions: number;
  successCount: number;
  failureCount: number;
  duplicateCount?: number;
  createdAt: string;
  completedAt?: string;
  results?: TransactionImportResult[];
  errorMessage?: string;
}

export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED'
}

export interface ImportBatch {
  id: number;
  batchId: string;
  userId: string;
  portfolioId: number;
  provider: StatementProvider;
  fileName?: string;
  transactionCount: number;
  successCount: number;
  failureCount: number;
  duplicateCount?: number;
  status: ImportStatus;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}