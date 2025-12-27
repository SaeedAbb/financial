import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { Portfolio, CreatePortfolioRequest } from '../../../../core/models/portfolio.model';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { MessageService } from 'primeng/api';

/**
 * Portfolio form mode - create or edit
 */
export type PortfolioFormMode = 'create' | 'edit';

/**
 * Portfolio form state
 */
export interface PortfolioFormState {
  mode: PortfolioFormMode;
  portfolio: Portfolio | null;
  submitting: boolean;
  visible: boolean;
}

/**
 * Service for managing portfolio creation/editing form
 */
@Injectable()
export class PortfolioFormService {
  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);
  private messageService = inject(MessageService);
  
  // Form state
  private formState: PortfolioFormState = {
    mode: 'create',
    portfolio: null,
    submitting: false,
    visible: false
  };
  
  // Form state subjects
  private formStateSubject$ = new Subject<PortfolioFormState>();
  readonly formState$ = this.formStateSubject$.asObservable();
  
  // Form group
  readonly form: FormGroup = this.createForm();
  
  /**
   * Create the portfolio form
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^(?!\s*$).+/) // No empty strings
      ]],
      description: ['', [
        Validators.maxLength(1000)
      ]]
    });
  }
  
  /**
   * Show the form dialog for creating a new portfolio
   */
  showCreateDialog(): void {
    this.formState = {
      mode: 'create',
      portfolio: null,
      submitting: false,
      visible: true
    };
    
    this.form.reset({
      name: '',
      description: ''
    });
    
    this.emitFormState();
  }
  
  /**
   * Show the form dialog for editing an existing portfolio
   */
  showEditDialog(portfolio: Portfolio): void {
    this.formState = {
      mode: 'edit',
      portfolio: portfolio,
      submitting: false,
      visible: true
    };
    
    this.form.patchValue({
      name: portfolio.name,
      description: portfolio.description || ''
    });
    
    this.emitFormState();
  }
  
  /**
   * Hide the form dialog
   */
  hideDialog(): void {
    this.formState.visible = false;
    this.form.reset();
    this.emitFormState();
  }
  
  /**
   * Submit the form
   */
  submit(): Observable<Portfolio> {
    if (!this.form.valid) {
      this.markFormGroupTouched(this.form);
      throw new Error('Form is invalid');
    }
    
    this.formState.submitting = true;
    this.emitFormState();
    
    const formValue = this.form.value;
    const request: CreatePortfolioRequest = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined
    };
    
    const operation = this.formState.mode === 'edit' && this.formState.portfolio
      ? this.portfolioService.updatePortfolio(this.formState.portfolio.uuid, request)
      : this.portfolioService.createPortfolio(request);
    
    return operation.pipe(
      tap({
        next: () => {
          const action = this.formState.mode === 'edit' ? 'updated' : 'created';
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Portfolio ${action} successfully`
          });
          this.hideDialog();
        },
        error: (error) => {
          const action = this.formState.mode === 'edit' ? 'update' : 'create';
          console.error(`Error ${action} portfolio:`, error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || `Failed to ${action} portfolio. Please try again.`
          });
        }
      }),
      finalize(() => {
        this.formState.submitting = false;
        this.emitFormState();
      })
    );
  }
  
  /**
   * Get current form state
   */
  get currentState(): PortfolioFormState {
    return { ...this.formState };
  }
  
  /**
   * Get form title based on mode
   */
  get formTitle(): string {
    return this.formState.mode === 'edit' ? 'Edit Portfolio' : 'Create Portfolio';
  }
  
  /**
   * Get submit button label based on mode
   */
  get submitLabel(): string {
    return this.formState.mode === 'edit' ? 'Update' : 'Create';
  }
  
  /**
   * Check if form is in edit mode
   */
  get isEditMode(): boolean {
    return this.formState.mode === 'edit';
  }
  
  /**
   * Check if form is visible
   */
  get isVisible(): boolean {
    return this.formState.visible;
  }
  
  /**
   * Check if form is submitting
   */
  get isSubmitting(): boolean {
    return this.formState.submitting;
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
   * Emit current form state
   */
  private emitFormState(): void {
    this.formStateSubject$.next({ ...this.formState });
  }
  
  /**
   * Get form control by name for template access
   */
  getControl(name: string) {
    return this.form.get(name);
  }
  
  /**
   * Check if a form control has an error
   */
  hasError(controlName: string, errorName?: string): boolean {
    const control = this.getControl(controlName);
    if (!control) return false;
    
    if (errorName) {
      return control.hasError(errorName) && (control.dirty || control.touched);
    }
    
    return control.invalid && (control.dirty || control.touched);
  }
  
  /**
   * Get error message for a form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.getControl(controlName);
    if (!control || !control.errors) return '';
    
    if (control.hasError('required')) {
      return `${this.getFieldLabel(controlName)} is required`;
    }
    
    if (control.hasError('maxlength')) {
      const error = control.getError('maxlength');
      return `${this.getFieldLabel(controlName)} must not exceed ${error.requiredLength} characters`;
    }
    
    if (control.hasError('pattern')) {
      return `${this.getFieldLabel(controlName)} contains invalid characters`;
    }
    
    return 'Invalid field';
  }
  
  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Portfolio name',
      'description': 'Description'
    };
    
    return labels[fieldName] || fieldName;
  }
}