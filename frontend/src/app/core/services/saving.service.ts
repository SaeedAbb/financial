import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { 
  Saving, 
  CreateSavingRequest, 
  UpdateSavingRequest, 
  SavingsSummary, 
  PagedSavings 
} from '../models/saving.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SavingService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/savings`;
  
  // Subject to track when savings data changes (for refreshing lists)
  private savingsUpdated$ = new BehaviorSubject<void>(undefined);
  public savingsUpdated = this.savingsUpdated$.asObservable();

  /**
   * Create a new saving
   */
  createSaving(savingData: CreateSavingRequest): Observable<Saving> {
    return this.http.post<Saving>(this.apiUrl, savingData).pipe(
      tap(() => this.notifySavingsUpdated())
    );
  }

  /**
   * Get paginated savings for the current user
   */
  getSavings(page = 0, size = 10, sortBy = 'savingDate', sortDir = 'desc'): Observable<PagedSavings> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedSavings>(this.apiUrl, { params });
  }

  /**
   * Get all savings for the current user (no pagination)
   */
  getAllSavings(): Observable<Saving[]> {
    return this.http.get<Saving[]>(`${this.apiUrl}/all`);
  }

  /**
   * Get a specific saving by UUID
   */
  getSavingByUuid(uuid: string): Observable<Saving> {
    return this.http.get<Saving>(`${this.apiUrl}/${uuid}`);
  }

  /**
   * Update an existing saving
   */
  updateSaving(uuid: string, savingData: UpdateSavingRequest): Observable<Saving> {
    return this.http.put<Saving>(`${this.apiUrl}/${uuid}`, savingData).pipe(
      tap(() => this.notifySavingsUpdated())
    );
  }

  /**
   * Delete a saving
   */
  deleteSaving(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uuid}`).pipe(
      tap(() => this.notifySavingsUpdated())
    );
  }

  /**
   * Get savings summary (totals by type, count, etc.)
   */
  getSavingsSummary(): Observable<SavingsSummary> {
    return this.http.get<SavingsSummary>(`${this.apiUrl}/summary`);
  }

  /**
   * Refresh savings data (triggers update notification)
   */
  refreshSavings(): void {
    this.notifySavingsUpdated();
  }

  /**
   * Notify components that savings data has been updated
   */
  private notifySavingsUpdated(): void {
    this.savingsUpdated$.next();
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format datetime for display
   */
  formatDateTime(dateTimeString: string): string {
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Validate saving amount
   */
  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 999999999999.99;
  }

  /**
   * Validate saving date (not in future)
   */
  validateDate(dateString: string): boolean {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return inputDate <= today;
  }
}