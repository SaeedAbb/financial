import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { 
  PortfolioPosition, 
  BuyPositionRequest, 
  SellPositionRequest 
} from '../../../../core/models/portfolio-position.model';
import { StockMaster } from '../../../../core/models/stock-master.model';
import { PortfolioPositionService } from '../../../../core/services/portfolio-position.service';
import { MessageService } from 'primeng/api';
import { DateFormatter } from '../../../../shared/utils';
import { FormValidators } from '../../../../shared/utils/form.validators';

/**
 * Position form mode - buy or sell
 */
export type PositionFormMode = 'buy' | 'sell';

/**
 * Position form state
 */
export interface PositionFormState {
  mode: PositionFormMode;
  position: PortfolioPosition | null;
  submitting: boolean;
  visible: boolean;
}

/**
 * Service for managing position buy/sell forms
 */
@Injectable()
export class PositionFormService {
  private fb = inject(FormBuilder);
  private positionService = inject(PortfolioPositionService);
  private messageService = inject(MessageService);
  
  // Form state
  private buyFormState: PositionFormState = {
    mode: 'buy',
    position: null,
    submitting: false,
    visible: false
  };
  
  private sellFormState: PositionFormState = {
    mode: 'sell',
    position: null,
    submitting: false,
    visible: false
  };
  
  // Form state subjects
  private buyFormStateSubject$ = new Subject<PositionFormState>();
  private sellFormStateSubject$ = new Subject<PositionFormState>();
  
  readonly buyFormState$ = this.buyFormStateSubject$.asObservable();
  readonly sellFormState$ = this.sellFormStateSubject$.asObservable();
  
  // Stock search state
  private selectedStock: StockMaster | null = null;
  
  // Form groups
  readonly buyForm: FormGroup = this.createBuyForm();
  readonly sellForm: FormGroup = this.createSellForm();
  
  // Today's date for date picker max validation
  readonly today = new Date();
  
  /**
   * Create the buy position form
   */
  private createBuyForm(): FormGroup {
    return this.fb.group({
      stock: [null, [Validators.required]],
      quantity: [null, [
        Validators.required, 
        FormValidators.minValue(0.000001, 'Quantity must be greater than 0')
      ]],
      pricePerShare: [null, [
        Validators.required, 
        FormValidators.minValue(0.01, 'Price must be at least 0.01')
      ]],
      transactionDate: [new Date(), [
        Validators.required,
        FormValidators.noFutureDate('Transaction date cannot be in the future')
      ]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }
  
  /**
   * Create the sell position form
   */
  private createSellForm(): FormGroup {
    return this.fb.group({
      quantity: [null, [
        Validators.required, 
        FormValidators.minValue(0.000001, 'Quantity must be greater than 0')
      ]],
      pricePerShare: [null, [
        Validators.required, 
        FormValidators.minValue(0.01, 'Price must be at least 0.01')
      ]],
      transactionDate: [new Date(), [
        Validators.required,
        FormValidators.noFutureDate('Transaction date cannot be in the future')
      ]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }
  
  /**
   * Show the buy position dialog
   */
  showBuyDialog(): void {
    this.buyFormState = {
      mode: 'buy',
      position: null,
      submitting: false,
      visible: true
    };
    
    this.buyForm.reset({
      stock: null,
      quantity: null,
      pricePerShare: null,
      transactionDate: new Date(),
      notes: ''
    });
    
    this.selectedStock = null;
    this.emitBuyFormState();
  }
  
  /**
   * Show the sell position dialog
   */
  showSellDialog(position: PortfolioPosition): void {
    this.sellFormState = {
      mode: 'sell',
      position: position,
      submitting: false,
      visible: true
    };
    
    // Set quantity validator max value based on position quantity
    const quantityControl = this.sellForm.get('quantity');
    if (quantityControl) {
      quantityControl.setValidators([
        Validators.required,
        FormValidators.minValue(0.000001, 'Quantity must be greater than 0'),
        FormValidators.maxValue(position.quantity, `Cannot sell more than ${position.quantity} shares`)
      ]);
      quantityControl.updateValueAndValidity();
    }
    
    // Reset form with proper date initialization
    const today = new Date();
    this.sellForm.reset({
      quantity: position.quantity,
      pricePerShare: null,
      transactionDate: today,
      notes: ''
    });
    
    // Ensure date control is properly updated
    const dateControl = this.sellForm.get('transactionDate');
    if (dateControl) {
      dateControl.setValue(today);
      dateControl.updateValueAndValidity();
    }
    
    this.emitSellFormState();
  }
  
  /**
   * Hide the buy dialog
   */
  hideBuyDialog(): void {
    this.buyFormState.visible = false;
    this.buyForm.reset();
    this.selectedStock = null;
    this.emitBuyFormState();
  }
  
  /**
   * Hide the sell dialog
   */
  hideSellDialog(): void {
    this.sellFormState.visible = false;
    this.sellForm.reset();
    this.emitSellFormState();
  }
  
  /**
   * Submit buy form
   */
  submitBuy(portfolioUuid: string): Observable<PortfolioPosition> {
    if (!this.buyForm.valid) {
      this.markFormGroupTouched(this.buyForm);
      throw new Error('Buy form is invalid');
    }
    
    const formValue = this.buyForm.value;
    const stock: StockMaster = formValue.stock;
    
    if (!stock) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a stock'
      });
      throw new Error('Stock not selected');
    }
    
    this.buyFormState.submitting = true;
    this.emitBuyFormState();
    
    const request: BuyPositionRequest = {
      stockSymbol: stock.symbol,
      quantity: formValue.quantity,
      pricePerShare: formValue.pricePerShare,
      transactionDate: DateFormatter.formatDateForAPI(formValue.transactionDate),
      companyName: stock.companyName,
      notes: formValue.notes?.trim() || undefined
    };
    
    return this.positionService.buyPosition(portfolioUuid, request).pipe(
      tap({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Position created successfully'
          });
          this.hideBuyDialog();
        },
        error: (error) => {
          console.error('Error buying position:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create position. Please try again.'
          });
        }
      }),
      finalize(() => {
        this.buyFormState.submitting = false;
        this.emitBuyFormState();
      })
    );
  }
  
  /**
   * Submit sell form
   */
  submitSell(portfolioUuid: string): Observable<PortfolioPosition> {
    if (!this.sellForm.valid || !this.sellFormState.position) {
      this.markFormGroupTouched(this.sellForm);
      throw new Error('Sell form is invalid');
    }
    
    this.sellFormState.submitting = true;
    this.emitSellFormState();
    
    const formValue = this.sellForm.value;
    const request: SellPositionRequest = {
      quantity: formValue.quantity,
      pricePerShare: formValue.pricePerShare,
      transactionDate: DateFormatter.formatDateForAPI(formValue.transactionDate),
      notes: formValue.notes?.trim() || undefined
    };
    
    return this.positionService.sellPosition(
      portfolioUuid, 
      this.sellFormState.position.uuid, 
      request
    ).pipe(
      tap({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Position sold successfully'
          });
          this.hideSellDialog();
        },
        error: (error) => {
          console.error('Error selling position:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to sell position. Please try again.'
          });
        }
      }),
      finalize(() => {
        this.sellFormState.submitting = false;
        this.emitSellFormState();
      })
    );
  }
  
  /**
   * Set selected stock for buy form
   */
  setSelectedStock(stock: StockMaster | null): void {
    this.selectedStock = stock;
    this.buyForm.patchValue({ stock });
  }
  
  /**
   * Get selected stock
   */
  getSelectedStock(): StockMaster | null {
    return this.selectedStock;
  }
  
  /**
   * Get current buy form state
   */
  get currentBuyState(): PositionFormState {
    return { ...this.buyFormState };
  }
  
  /**
   * Get current sell form state
   */
  get currentSellState(): PositionFormState {
    return { ...this.sellFormState };
  }
  
  /**
   * Check if buy form is submitting
   */
  get isBuySubmitting(): boolean {
    return this.buyFormState.submitting;
  }
  
  /**
   * Check if sell form is submitting
   */
  get isSellSubmitting(): boolean {
    return this.sellFormState.submitting;
  }
  
  /**
   * Mark all fields in a form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /**
   * Emit buy form state
   */
  private emitBuyFormState(): void {
    this.buyFormStateSubject$.next({ ...this.buyFormState });
  }
  
  /**
   * Emit sell form state
   */
  private emitSellFormState(): void {
    this.sellFormStateSubject$.next({ ...this.sellFormState });
  }
  
  /**
   * Get form control by name for template access
   */
  getBuyControl(name: string) {
    return this.buyForm.get(name);
  }
  
  /**
   * Get form control by name for template access
   */
  getSellControl(name: string) {
    return this.sellForm.get(name);
  }
  
  /**
   * Check if a form control has an error
   */
  hasBuyError(controlName: string, errorName?: string): boolean {
    const control = this.getBuyControl(controlName);
    if (!control) return false;
    
    if (errorName) {
      return control.hasError(errorName) && (control.dirty || control.touched);
    }
    
    return control.invalid && (control.dirty || control.touched);
  }
  
  /**
   * Check if a form control has an error
   */
  hasSellError(controlName: string, errorName?: string): boolean {
    const control = this.getSellControl(controlName);
    if (!control) return false;
    
    if (errorName) {
      return control.hasError(errorName) && (control.dirty || control.touched);
    }
    
    return control.invalid && (control.dirty || control.touched);
  }
  
  /**
   * Get error message for a form control
   */
  getBuyErrorMessage(controlName: string): string {
    const control = this.getBuyControl(controlName);
    if (!control || !control.errors) return '';
    
    return this.getErrorMessage(controlName, control.errors);
  }
  
  /**
   * Get error message for a form control
   */
  getSellErrorMessage(controlName: string): string {
    const control = this.getSellControl(controlName);
    if (!control || !control.errors) return '';
    
    return this.getErrorMessage(controlName, control.errors);
  }
  
  /**
   * Get error message based on validation errors
   */
  private getErrorMessage(controlName: string, errors: any): string {
    if (errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }
    
    if (errors['maxlength']) {
      return `${this.getFieldLabel(controlName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    }
    
    if (errors['minValue']) {
      return errors['minValue'].message;
    }
    
    if (errors['maxValue']) {
      return errors['maxValue'].message;
    }
    
    if (errors['futureDate']) {
      return errors['futureDate'].message;
    }
    
    return 'Invalid field';
  }
  
  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'stock': 'Stock',
      'quantity': 'Quantity',
      'pricePerShare': 'Price per share',
      'transactionDate': 'Transaction date',
      'notes': 'Notes'
    };
    
    return labels[fieldName] || fieldName;
  }
}