import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ImportRequest, ImportResult, ImportBatch, ParsedTransaction, ParsePdfResponse } from '../models/parsed-transaction.model';
import { StatementProvider } from '../models/provider.enum';

@Injectable({
  providedIn: 'root'
})
export class StatementImportService {
  private readonly apiUrl = `${environment.apiUrl}/statement-import`;
  private readonly http = inject(HttpClient);
  
  /**
   * Import parsed transactions to the backend
   * @param importRequest The import request containing transactions
   * @returns Observable with import result
   */
  importTransactions(importRequest: ImportRequest): Observable<ImportResult> {
    return this.http.post<ImportResult>(
      `${this.apiUrl}/portfolio/${importRequest.portfolioId}/import`,
      importRequest
    );
  }
  
  /**
   * Get import history for the current user
   * @returns Observable with list of import batches
   */
  getImportHistory(): Observable<ImportBatch[]> {
    return this.http.get<ImportBatch[]>(`${this.apiUrl}/history`);
  }
  
  /**
   * Get import history for a specific portfolio
   * @param portfolioId The portfolio ID
   * @returns Observable with list of import batches
   */
  getPortfolioImportHistory(portfolioId: number): Observable<ImportBatch[]> {
    return this.http.get<ImportBatch[]>(`${this.apiUrl}/portfolio/${portfolioId}/history`);
  }
  
  /**
   * Get import batch details
   * @param batchId The batch ID
   * @returns Observable with import batch details
   */
  getImportBatchDetails(batchId: string): Observable<ImportBatch> {
    return this.http.get<ImportBatch>(`${this.apiUrl}/batch/${batchId}`);
  }
  
  /**
   * Get import statistics for a provider
   * @param provider The provider
   * @returns Observable with import statistics
   */
  getProviderStatistics(provider: StatementProvider): Observable<{
    totalImports: number;
    totalTransactions: number;
    successRate: number;
    lastImportDate?: string;
  }> {
    return this.http.get<{
      totalImports: number;
      totalTransactions: number;
      successRate: number;
      lastImportDate?: string;
    }>(`${this.apiUrl}/statistics/${provider}`);
  }
  
  /**
   * Parse PDF file using backend AI service (Gemini)
   * @param file The PDF file
   * @param provider The statement provider
   * @returns Observable with parse response containing transactions
   */
  parsePdf(file: File, provider: StatementProvider): Observable<ParsePdfResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);
    
    return this.http.post<ParsePdfResponse>(
      `${this.apiUrl}/parse-pdf`,
      formData
    );
  }
}