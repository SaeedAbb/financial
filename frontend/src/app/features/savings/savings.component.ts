import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { 
  Saving, 
  CreateSavingRequest, 
  SavingType, 
  SAVING_TYPE_OPTIONS, 
  getSavingTypeIcon, 
  getSavingTypeLabel,
  SavingsSummary
} from '../../core/models/saving.model';
import { SavingService } from '../../core/services/saving.service';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './savings.component.html',
  styleUrls: ['./savings.component.scss']
})
export class SavingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private savingService = inject(SavingService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  title = 'Savings Management';
  
  // Component state
  savings: Saving[] = [];
  summary: SavingsSummary = {
    totalAmount: 0,
    totalCount: 0,
    cashAmount: 0,
    goldAmount: 0,
    otherAmount: 0
  };
  
  loading = true;
  saving = false;
  
  // Dialog states
  displayDialog = false;
  isEditMode = false;
  currentSaving?: Saving;
  
  // Form
  savingForm!: FormGroup;
  
  // Dropdown options
  savingTypeOptions = SAVING_TYPE_OPTIONS;
  maxDate = new Date(); // Today's date
  
  // Table columns
  cols = [
    { field: 'savingDate', header: 'Date' },
    { field: 'amount', header: 'Amount' },
    { field: 'savingType', header: 'Type' },
    { field: 'comments', header: 'Comments' },
    { field: 'actions', header: 'Actions' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    
    // Subscribe to savings updates
    this.savingService.savingsUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.savingForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01), Validators.max(999999999)]],
      savingType: [null, Validators.required],
      savingDate: [new Date(), Validators.required],
      comments: ['', [Validators.maxLength(1000)]]
    });
  }

  private loadData(): void {
    this.loading = true;
    
    // Load savings and summary concurrently
    this.savingService.getAllSavings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savings) => {
          this.savings = savings;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading savings:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load savings data'
          });
          this.loading = false;
        }
      });

    this.savingService.getSavingsSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: (error) => {
          console.error('Error loading summary:', error);
        }
      });
  }

  showAddDialog(): void {
    this.isEditMode = false;
    this.currentSaving = undefined;
    this.savingForm.reset({
      amount: null,
      savingType: null,
      savingDate: new Date(),
      comments: ''
    });
    this.displayDialog = true;
  }

  showEditDialog(saving: Saving): void {
    this.isEditMode = true;
    this.currentSaving = saving;
    this.savingForm.patchValue({
      amount: saving.amount,
      savingType: saving.savingType,
      savingDate: new Date(saving.savingDate),
      comments: saving.comments || ''
    });
    this.displayDialog = true;
  }

  saveSaving(): void {
    if (this.savingForm.valid) {
      this.saving = true;
      const formValue = this.savingForm.value;
      
      // Format date to ISO string (yyyy-MM-dd)
      const savingData: CreateSavingRequest = {
        amount: formValue.amount,
        savingType: formValue.savingType,
        savingDate: this.formatDateForApi(formValue.savingDate),
        comments: formValue.comments?.trim() || undefined
      };

      const operation = this.isEditMode && this.currentSaving
        ? this.savingService.updateSaving(this.currentSaving.uuid, savingData)
        : this.savingService.createSaving(savingData);

      operation.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Saving ${this.isEditMode ? 'updated' : 'created'} successfully`
          });
          this.displayDialog = false;
          this.saving = false;
        },
        error: (error) => {
          console.error('Error saving:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to ${this.isEditMode ? 'update' : 'create'} saving`
          });
          this.saving = false;
        }
      });
    }
  }

  confirmDelete(saving: Saving): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this saving of ${this.formatCurrency(saving.amount)}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteSaving(saving);
      }
    });
  }

  private deleteSaving(saving: Saving): void {
    this.savingService.deleteSaving(saving.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Saving deleted successfully'
          });
        },
        error: (error) => {
          console.error('Error deleting saving:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete saving'
          });
        }
      });
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return this.savingService.formatAmount(amount);
  }

  formatDate(dateString: string): string {
    return this.savingService.formatDate(dateString);
  }

  getSavingTypeIcon(type: SavingType): string {
    return getSavingTypeIcon(type);
  }

  getSavingTypeLabel(type: SavingType): string {
    return getSavingTypeLabel(type);
  }

  getSeverityForType(type: SavingType): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    switch (type) {
      case SavingType.CASH:
        return 'success';
      case SavingType.GOLD:
        return 'warn';
      case SavingType.OTHER:
        return 'info';
      default:
        return 'info';
    }
  }

  private formatDateForApi(date: Date): string {
    // Use local date parts to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // yyyy-MM-dd format
  }

  onDialogHide(): void {
    this.displayDialog = false;
    this.savingForm.reset();
  }
}