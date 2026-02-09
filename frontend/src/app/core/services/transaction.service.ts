import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, TransactionCategory, TransactionType, TransactionSummary, PagedResponse } from '../models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly apiUrl = `${environment.apiUrl}/transactions`;
  private http = inject(HttpClient);

  /**
   * Get all transactions for a specific position
   */
  getPositionTransactions(positionId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/position/${positionId}`);
  }

  /**
   * Get transactions for a portfolio with pagination
   * @param portfolioId - The portfolio ID
   * @param page - Page number (0-indexed)
   * @param size - Page size (default 10)
   */
  getPortfolioTransactionsPaged(portfolioId: number, page = 0, size = 10): Observable<PagedResponse<Transaction>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<Transaction>>(`${this.apiUrl}/portfolio/${portfolioId}`, { params });
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all user transactions
   */
  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  /**
   * Get transactions by symbol
   */
  getTransactionsBySymbol(symbol: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/symbol/${symbol}`);
  }

  /**
   * Get transactions by category
   */
  getTransactionsByCategory(category: TransactionCategory): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/category/${category}`);
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: TransactionType): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/type/${type}`);
  }

  /**
   * Get transactions by date range
   */
  getTransactionsByDateRange(startDate: string, endDate: string): Observable<Transaction[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<Transaction[]>(`${this.apiUrl}/date-range`, { params });
  }

  /**
   * Get transaction summary for a date range
   */
  getTransactionSummary(startDate: string, endDate: string): Observable<TransactionSummary> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<TransactionSummary>(`${this.apiUrl}/summary`, { params });
  }

  /**
   * Get distinct symbols for a category
   */
  getUserSymbols(category: TransactionCategory): Observable<string[]> {
    const params = new HttpParams().set('category', category);
    return this.http.get<string[]>(`${this.apiUrl}/symbols`, { params });
  }

  /**
   * Delete transaction by ID
   */
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}