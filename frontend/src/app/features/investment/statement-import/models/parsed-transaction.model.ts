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
  providerReference?: string;  // Provider-specific reference
}

export interface ImportRequest {
  provider: StatementProvider;
  portfolioId: number;
  transactions: ParsedTransaction[];
  fileName?: string;
  providerMetadata?: Record<string, unknown>;
}

export interface EnhancedTransaction extends ParsedTransaction {
  ticker?: string;  // LLM-enhanced ticker symbol
  confidence?: number;  // LLM confidence score (0-1)
  originalDescription?: string;
}

export interface TransactionImportResult {
  transactionId?: number;
  transactionUuid?: string;
  success: boolean;
  ticker?: string;
  errorMessage?: string;
}

export interface ImportResult {
  batchId: string;
  status: ImportStatus;
  totalTransactions: number;
  successCount: number;
  failureCount: number;
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
  status: ImportStatus;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}