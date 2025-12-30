import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

import { StatementProvider, PROVIDER_INFO } from '../../models/provider.enum';
import { ParsedTransaction, ImportRequest, ImportResult, ImportStatus } from '../../models/parsed-transaction.model';
import { ParserFactoryService } from '../../services/parser-factory.service';
import { StatementImportService } from '../../services/statement-import.service';
import { PortfolioService } from '../../../../../core/services/portfolio.service';
import { Portfolio } from '../../../../../core/models/portfolio.model';
import { TransactionPreviewComponent } from '../transaction-preview/transaction-preview.component';

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
  styleUrls: ['./statement-import.component.scss']
})
export class StatementImportComponent implements OnInit {
  private readonly parserFactory = inject(ParserFactoryService);
  private readonly importService = inject(StatementImportService);
  private readonly portfolioService = inject(PortfolioService);
  private readonly router = inject(Router);

  currentStep = 1;
  selectedProvider?: StatementProvider;
  selectedPortfolioId?: number;
  selectedFile?: File;
  parsedTransactions: ParsedTransaction[] = [];
  portfolios: Portfolio[] = [];
  errorMessage = '';
  successMessage = '';
  processingMessage = 'Extracting transactions from PDF...';
  
  readonly providers = Object.values(PROVIDER_INFO).filter(p => 
    this.parserFactory.isProviderSupported(p.id)
  );

  ngOnInit(): void {
    this.loadPortfolios();
  }

  loadPortfolios(): void {
    this.portfolioService.getAllPortfolios().subscribe({
      next: (portfolios) => {
        this.portfolios = portfolios;
      },
      error: (error) => {
        this.showError('Failed to load portfolios');
        console.error('Error loading portfolios:', error);
      }
    });
  }

  onProviderChange(): void {
    // Reset file selection when provider changes
    this.selectedFile = undefined;
    this.parsedTransactions = [];
  }

  onFileSelect(event: { files: File[] }): void {
    const files = event.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.selectedProvider;
      case 2:
        return !!this.selectedPortfolioId;
      case 3:
        return !!this.selectedFile;
      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.currentStep === 3 && this.selectedFile) {
      this.processFile();
    } else {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async processFile(): Promise<void> {
    if (!this.selectedFile || !this.selectedProvider) return;

    this.currentStep = 4;
    this.processingMessage = 'Extracting transactions from PDF...';

    try {
      const parser = this.parserFactory.getParser(this.selectedProvider);
      this.parsedTransactions = await parser.parse(this.selectedFile);
      
      if (this.parsedTransactions.length === 0) {
        this.showError('No transactions found in the PDF');
        this.currentStep = 3;
      } else {
        this.showSuccess(`Found ${this.parsedTransactions.length} transactions`);
        this.currentStep = 5;
      }
    } catch (error) {
      this.showError('Failed to process PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
      this.currentStep = 3;
    }
  }

  confirmImport(): void {
    if (!this.selectedProvider || !this.selectedPortfolioId || this.parsedTransactions.length === 0) {
      return;
    }

    this.currentStep = 4;
    this.processingMessage = 'Importing transactions to your portfolio...';

    const importRequest: ImportRequest = {
      provider: this.selectedProvider,
      portfolioId: this.selectedPortfolioId,
      transactions: this.parsedTransactions,
      fileName: this.selectedFile?.name
    };

    this.importService.importTransactions(importRequest).subscribe({
      next: (result) => {
        this.handleImportResult(result);
      },
      error: (error) => {
        this.showError('Import failed: ' + (error.error?.message || 'Unknown error'));
        this.currentStep = 5;
      }
    });
  }

  handleImportResult(result: ImportResult): void {
    if (result.status === ImportStatus.COMPLETED) {
      this.showSuccess(`Successfully imported ${result.successCount} transactions`);
      setTimeout(() => {
        this.router.navigate(['/investment/portfolio', this.selectedPortfolioId]);
      }, 2000);
    } else if (result.status === ImportStatus.PARTIALLY_COMPLETED) {
      this.showWarning(`Imported ${result.successCount} of ${result.totalTransactions} transactions`);
      setTimeout(() => {
        this.router.navigate(['/investment/portfolio', this.selectedPortfolioId]);
      }, 3000);
    } else {
      this.showError(`Import failed: ${result.errorMessage}`);
      this.currentStep = 5;
    }
  }

  cancelImport(): void {
    this.parsedTransactions = [];
    this.currentStep = 3;
  }

  getProviderInstructions(): string {
    switch (this.selectedProvider) {
      case StatementProvider.TRADE_REPUBLIC:
        return 'Please upload your Trade Republic account statement PDF (Kontoauszug/Abrechnung)';
      default:
        return 'Please upload your account statement PDF';
    }
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  private showWarning(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }
}