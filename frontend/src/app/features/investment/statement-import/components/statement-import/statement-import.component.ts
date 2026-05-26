import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, style, transition, animate } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

import { StatementProvider, PROVIDER_INFO } from '../../models/provider.enum';
import { ImportFormat, ImportFormatInfo, IMPORT_FORMAT_INFO } from '../../models/import-format.enum';
import { ParsedTransaction, ImportRequest, ImportResult, ImportStatus, TransactionImportResult } from '../../models/parsed-transaction.model';
import { StatementImportService } from '../../services/statement-import.service';
import { PortfolioService } from '../../../../../core/services/portfolio.service';
import { Portfolio } from '../../../../../core/models/portfolio.model';
import { TransactionPreviewComponent } from '../transaction-preview/transaction-preview.component';

/**
 * Wizard for importing transactions into a portfolio.
 *
 * The wizard runs through these steps; the Format step is auto-skipped
 * for providers that only support one upload format (e.g. PDF-only):
 *
 *   1. Provider     — pick a bank/broker
 *   2. Format       — pick PDF (AI-parsed) or CSV (deterministic)
 *   3. Portfolio    — pick the target portfolio
 *   4. Upload       — choose the file
 *   5. Processing   — backend parses the file
 *   6. Preview      — review extracted transactions before commit
 *   7. Results      — per-transaction outcome (only shown on partial success)
 */
@Component({
  selector: 'app-statement-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    FileUploadModule,
    ProgressSpinnerModule,
    MessageModule,
    TransactionPreviewComponent
  ],
  templateUrl: './statement-import.component.html',
  styleUrls: ['./statement-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.6s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('tableRowAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class StatementImportComponent implements OnInit {
  private readonly importService = inject(StatementImportService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly REDIRECT_DELAY_MS = 3000;
  private readonly SUCCESS_MESSAGE_DURATION_MS = 5000;

  // Named step constants — keep templates and TS in sync.
  readonly STEP_PROVIDER = 1;
  readonly STEP_FORMAT = 2;
  readonly STEP_PORTFOLIO = 3;
  readonly STEP_UPLOAD = 4;
  readonly STEP_PROCESSING = 5;
  readonly STEP_PREVIEW = 6;
  readonly STEP_RESULTS = 7;

  // Expose enums to the template.
  readonly ImportFormat = ImportFormat;

  currentStep: number = this.STEP_PROVIDER;
  selectedProvider?: StatementProvider;
  selectedFormat?: ImportFormat;
  selectedPortfolioUuid?: string;
  selectedFile?: File;
  parsedTransactions: ParsedTransaction[] = [];
  portfolios: Portfolio[] = [];
  errorMessage = '';
  successMessage = '';
  processingMessage = 'Extracting transactions from PDF...';
  importResult?: ImportResult;
  resultFilter: 'all' | 'success' | 'duplicate' | 'error' = 'all';

  readonly providers = Object.values(PROVIDER_INFO);

  ngOnInit(): void {
    this.loadPortfolios();
  }

  loadPortfolios(): void {
    this.portfolioService.getAllPortfolios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (portfolios) => {
          this.portfolios = portfolios;
          this.cdr.markForCheck();
        },
        error: () => {
          this.showError('Failed to load portfolios');
          this.cdr.markForCheck();
        }
      });
  }

  /** Formats this provider can be imported with — drives the format picker. */
  availableFormats(): ImportFormatInfo[] {
    if (!this.selectedProvider) {
      return [];
    }
    return PROVIDER_INFO[this.selectedProvider].supportedFormats
      .map((f) => IMPORT_FORMAT_INFO[f]);
  }

  selectedFormatInfo(): ImportFormatInfo | undefined {
    return this.selectedFormat ? IMPORT_FORMAT_INFO[this.selectedFormat] : undefined;
  }

  acceptedFileExtension(): string {
    return this.selectedFormatInfo()?.fileExtension ?? '.pdf';
  }

  onProviderChange(): void {
    // Reset downstream state and pre-select the format if there's only one.
    this.selectedFile = undefined;
    this.parsedTransactions = [];
    const formats = this.availableFormats();
    this.selectedFormat = formats.length === 1 ? formats[0].id : undefined;
  }

  selectFormat(format: ImportFormat): void {
    this.selectedFormat = format;
    // Switching format invalidates any previously chosen file.
    this.selectedFile = undefined;
  }

  onFileSelect(event: { files: File[] }): void {
    const files = event.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case this.STEP_PROVIDER:
        return !!this.selectedProvider;
      case this.STEP_FORMAT:
        return !!this.selectedFormat;
      case this.STEP_PORTFOLIO:
        return !!this.selectedPortfolioUuid;
      case this.STEP_UPLOAD:
        return !!this.selectedFile;
      default:
        return false;
    }
  }

  /** Whether the format step should be displayed in the indicator. */
  showFormatStep(): boolean {
    return this.availableFormats().length > 1;
  }

  nextStep(): void {
    if (this.currentStep === this.STEP_UPLOAD && this.selectedFile) {
      this.processFile();
      return;
    }
    // Auto-skip the Format step for providers that support only one format.
    if (this.currentStep === this.STEP_PROVIDER && !this.showFormatStep()) {
      this.currentStep = this.STEP_PORTFOLIO;
      return;
    }
    this.currentStep++;
  }

  previousStep(): void {
    if (this.currentStep <= this.STEP_PROVIDER) {
      return;
    }
    // Symmetric auto-skip when navigating backwards past the hidden Format step.
    if (this.currentStep === this.STEP_PORTFOLIO && !this.showFormatStep()) {
      this.currentStep = this.STEP_PROVIDER;
      return;
    }
    this.currentStep--;
  }

  processFile(): void {
    if (!this.selectedFile || !this.selectedProvider || !this.selectedFormat) {
      return;
    }

    this.currentStep = this.STEP_PROCESSING;
    this.processingMessage = this.selectedFormat === ImportFormat.CSV
      ? 'Parsing CSV transactions...'
      : 'Extracting transactions from PDF using AI...';

    const parse$ = this.selectedFormat === ImportFormat.CSV
      ? this.importService.parseCsv(this.selectedFile, this.selectedProvider)
      : this.importService.parsePdf(this.selectedFile, this.selectedProvider);

    parse$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.transactions) {
            this.parsedTransactions = response.transactions;

            if (this.parsedTransactions.length === 0) {
              this.showError('No transactions found in the file');
              this.currentStep = this.STEP_UPLOAD;
            } else {
              this.showSuccess(`Found ${this.parsedTransactions.length} transactions`);
              this.currentStep = this.STEP_PREVIEW;
            }
          } else {
            const errorMsg = response.message || 'Failed to parse file';
            this.showError(errorMsg);
            this.currentStep = this.STEP_UPLOAD;
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.showError('Failed to parse file: ' + (error.error?.message || 'Unknown error'));
          this.currentStep = this.STEP_UPLOAD;
          this.cdr.markForCheck();
        }
      });
  }

  confirmImport(): void {
    if (!this.selectedProvider || !this.selectedPortfolioUuid || this.parsedTransactions.length === 0) {
      return;
    }

    this.currentStep = this.STEP_PROCESSING;
    this.processingMessage = 'Importing transactions to your portfolio...';

    const importRequest: ImportRequest = {
      provider: this.selectedProvider,
      portfolioId: this.selectedPortfolioUuid,
      transactions: this.parsedTransactions,
      fileName: this.selectedFile?.name
    };

    this.importService.importTransactions(importRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.handleImportResult(result);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.showError('Import failed: ' + (error.error?.message || 'Unknown error'));
          this.currentStep = this.STEP_PREVIEW;
          this.cdr.markForCheck();
        }
      });
  }

  handleImportResult(result: ImportResult): void {
    this.importResult = result;
    const duplicateCount = result.duplicateCount || 0;

    if (result.status === ImportStatus.COMPLETED) {
      let message = `Successfully imported ${result.successCount} transactions`;
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} duplicates skipped)`;
      }
      this.showSuccess(message);
      setTimeout(() => {
        this.router.navigate(['/investment/portfolios', this.selectedPortfolioUuid]);
      }, this.REDIRECT_DELAY_MS);
    } else if (result.status === ImportStatus.PARTIALLY_COMPLETED) {
      let message = `Imported ${result.successCount} of ${result.totalTransactions} transactions`;
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} duplicates skipped)`;
      }
      if (result.failureCount > 0) {
        message += `, ${result.failureCount} failed`;
      }
      this.showError(message);
      this.currentStep = this.STEP_RESULTS;
    } else {
      this.showError(`Import failed: ${result.errorMessage}`);
      this.currentStep = this.STEP_PREVIEW;
    }
  }

  cancelImport(): void {
    this.parsedTransactions = [];
    this.currentStep = this.STEP_UPLOAD;
  }

  getProviderInstructions(): string {
    if (this.selectedProvider === StatementProvider.TRADE_REPUBLIC) {
      return 'Trade Republic supports both PDF statements (AI-parsed) and CSV transaction exports (parsed instantly).';
    }
    return 'Please upload your account statement PDF';
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', this.SUCCESS_MESSAGE_DURATION_MS);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  navigateToPortfolio(): void {
    this.router.navigate(['/investment/portfolios', this.selectedPortfolioUuid]);
  }

  resetImport(): void {
    this.currentStep = this.STEP_PROVIDER;
    this.importResult = undefined;
    this.resultFilter = 'all';
    this.selectedFile = undefined;
    this.selectedFormat = undefined;
    this.parsedTransactions = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

  getFilteredResults(): TransactionImportResult[] {
    if (!this.importResult?.results) return [];

    switch (this.resultFilter) {
      case 'success':
        return this.importResult.results.filter(r => r.success && !r.duplicate);
      case 'duplicate':
        return this.importResult.results.filter(r => r.duplicate);
      case 'error':
        return this.importResult.results.filter(r => !r.success && !r.duplicate);
      default:
        return this.importResult.results;
    }
  }

  getFilteredResultsCount(type: 'success' | 'duplicate' | 'error'): number {
    if (!this.importResult?.results) return 0;

    switch (type) {
      case 'success':
        return this.importResult.results.filter(r => r.success && !r.duplicate).length;
      case 'duplicate':
        return this.importResult.results.filter(r => r.duplicate).length;
      case 'error':
        return this.importResult.results.filter(r => !r.success && !r.duplicate).length;
      default:
        return 0;
    }
  }
}
