import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StatementImportComponent } from './statement-import.component';
import { StatementImportService } from '../../services/statement-import.service';
import { PortfolioService } from '../../../../../core/services/portfolio.service';
import { StatementProvider } from '../../models/provider.enum';
import { ImportFormat } from '../../models/import-format.enum';
import { ImportResult, ImportStatus, ParsedTransaction, ParseStatementResponse } from '../../models/parsed-transaction.model';
import { Portfolio } from '../../../../../core/models/portfolio.model';

describe('StatementImportComponent', () => {
  let component: StatementImportComponent;
  let fixture: ComponentFixture<StatementImportComponent>;
  let mockImportService: jasmine.SpyObj<StatementImportService>;
  let mockPortfolioService: jasmine.SpyObj<PortfolioService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const sampleTransaction: ParsedTransaction = {
    rawSymbol: 'TEST',
    description: 'Test',
    quantity: 1,
    pricePerUnit: 100,
    totalAmount: 100,
    fees: 0,
    date: '2024-01-01',
    type: 'BUY',
    currency: 'EUR'
  };

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj('StatementImportService', ['importTransactions', 'parsePdf', 'parseCsv']);
    mockPortfolioService = jasmine.createSpyObj('PortfolioService', ['getAllPortfolios']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockPortfolioService.getAllPortfolios.and.returnValue(of([
      { id: 1, uuid: 'uuid-1', userId: 'user-1', name: 'Test Portfolio 1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, uuid: 'uuid-2', userId: 'user-1', name: 'Test Portfolio 2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ] as Portfolio[]));

    await TestBed.configureTestingModule({
      imports: [StatementImportComponent, NoopAnimationsModule],
      providers: [
        { provide: StatementImportService, useValue: mockImportService },
        { provide: PortfolioService, useValue: mockPortfolioService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatementImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load portfolios on init', () => {
    expect(mockPortfolioService.getAllPortfolios).toHaveBeenCalled();
    expect(component.portfolios.length).toBe(2);
  });

  it('should handle portfolio loading error', () => {
    mockPortfolioService.getAllPortfolios.and.returnValue(throwError(() => new Error('Failed to load')));

    component.loadPortfolios();

    expect(component.errorMessage).toContain('Failed to load portfolios');
  });

  it('should reset file selection when provider changes', () => {
    component.selectedFile = new File([''], 'test.pdf');
    component.parsedTransactions = [sampleTransaction];

    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.onProviderChange();

    expect(component.selectedFile).toBeUndefined();
    expect(component.parsedTransactions.length).toBe(0);
  });

  it('should pre-select format when provider supports only one', () => {
    component.selectedProvider = StatementProvider.DEUTSCHE_BANK;
    component.onProviderChange();

    expect(component.selectedFormat).toBe(ImportFormat.PDF);
  });

  it('should clear format when provider supports multiple', () => {
    component.selectedFormat = ImportFormat.PDF;
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.onProviderChange();

    expect(component.selectedFormat).toBeUndefined();
  });

  it('should handle file selection', () => {
    const file = new File([''], 'test.pdf');
    const event = { files: [file] };

    component.onFileSelect(event);

    expect(component.selectedFile).toBe(file);
  });

  it('should determine if can proceed to next step', () => {
    expect(component.canProceedToNextStep()).toBe(false);

    component.currentStep = component.STEP_PROVIDER;
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    expect(component.canProceedToNextStep()).toBe(true);

    component.currentStep = component.STEP_FORMAT;
    expect(component.canProceedToNextStep()).toBe(false);
    component.selectedFormat = ImportFormat.CSV;
    expect(component.canProceedToNextStep()).toBe(true);

    component.currentStep = component.STEP_PORTFOLIO;
    component.selectedPortfolioUuid = undefined;
    expect(component.canProceedToNextStep()).toBe(false);
    component.selectedPortfolioUuid = 'uuid-1';
    expect(component.canProceedToNextStep()).toBe(true);

    component.currentStep = component.STEP_UPLOAD;
    component.selectedFile = undefined;
    expect(component.canProceedToNextStep()).toBe(false);
    component.selectedFile = new File([''], 'test.csv');
    expect(component.canProceedToNextStep()).toBe(true);
  });

  it('should auto-skip format step for PDF-only providers when going forward', () => {
    component.selectedProvider = StatementProvider.DEUTSCHE_BANK;
    component.onProviderChange();
    component.currentStep = component.STEP_PROVIDER;

    component.nextStep();

    expect(component.currentStep).toBe(component.STEP_PORTFOLIO);
  });

  it('should show format step for providers that support multiple formats', () => {
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.onProviderChange();
    component.currentStep = component.STEP_PROVIDER;

    component.nextStep();

    expect(component.currentStep).toBe(component.STEP_FORMAT);
  });

  it('should auto-skip format step backwards for PDF-only providers', () => {
    component.selectedProvider = StatementProvider.DEUTSCHE_BANK;
    component.onProviderChange();
    component.currentStep = component.STEP_PORTFOLIO;

    component.previousStep();

    expect(component.currentStep).toBe(component.STEP_PROVIDER);
  });

  it('should not navigate below the first step', () => {
    component.currentStep = component.STEP_PROVIDER;
    component.previousStep();
    expect(component.currentStep).toBe(component.STEP_PROVIDER);
  });

  it('should call parsePdf when format is PDF', () => {
    const mockResponse: ParseStatementResponse = {
      success: true,
      transactions: [sampleTransaction],
      provider: StatementProvider.TRADE_REPUBLIC
    };
    mockImportService.parsePdf.and.returnValue(of(mockResponse));

    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedFormat = ImportFormat.PDF;
    component.currentStep = component.STEP_UPLOAD;

    component.processFile();

    expect(mockImportService.parsePdf).toHaveBeenCalledWith(component.selectedFile, StatementProvider.TRADE_REPUBLIC);
    expect(mockImportService.parseCsv).not.toHaveBeenCalled();
    expect(component.currentStep).toBe(component.STEP_PREVIEW);
  });

  it('should call parseCsv when format is CSV', () => {
    const mockResponse: ParseStatementResponse = {
      success: true,
      transactions: [sampleTransaction],
      provider: StatementProvider.TRADE_REPUBLIC
    };
    mockImportService.parseCsv.and.returnValue(of(mockResponse));

    component.selectedFile = new File([''], 'transactions.csv');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedFormat = ImportFormat.CSV;
    component.currentStep = component.STEP_UPLOAD;

    component.processFile();

    expect(mockImportService.parseCsv).toHaveBeenCalledWith(component.selectedFile, StatementProvider.TRADE_REPUBLIC);
    expect(mockImportService.parsePdf).not.toHaveBeenCalled();
    expect(component.currentStep).toBe(component.STEP_PREVIEW);
  });

  it('should handle file processing error', () => {
    mockImportService.parsePdf.and.returnValue(throwError(() => ({ error: { message: 'Parse error' } })));

    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedFormat = ImportFormat.PDF;
    component.currentStep = component.STEP_UPLOAD;

    component.processFile();

    expect(component.currentStep).toBe(component.STEP_UPLOAD);
    expect(component.errorMessage).toContain('Failed to parse file: Parse error');
  });

  it('should handle empty transactions', () => {
    const mockResponse: ParseStatementResponse = {
      success: true,
      transactions: [],
      provider: StatementProvider.TRADE_REPUBLIC
    };
    mockImportService.parsePdf.and.returnValue(of(mockResponse));

    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedFormat = ImportFormat.PDF;
    component.currentStep = component.STEP_UPLOAD;

    component.processFile();

    expect(component.currentStep).toBe(component.STEP_UPLOAD);
    expect(component.errorMessage).toContain('No transactions found');
  });

  it('should handle backend parsing failure response', () => {
    const mockResponse: ParseStatementResponse = {
      success: false,
      message: 'Could not parse PDF'
    };
    mockImportService.parsePdf.and.returnValue(of(mockResponse));

    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedFormat = ImportFormat.PDF;
    component.currentStep = component.STEP_UPLOAD;

    component.processFile();

    expect(component.currentStep).toBe(component.STEP_UPLOAD);
    expect(component.errorMessage).toContain('Could not parse PDF');
  });

  it('should handle successful import', () => {
    const result: ImportResult = {
      batchId: 'batch-123',
      status: ImportStatus.COMPLETED,
      successCount: 10,
      failureCount: 0,
      totalTransactions: 10,
      createdAt: new Date().toISOString()
    };
    mockImportService.importTransactions.and.returnValue(of(result));

    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedPortfolioUuid = 'uuid-1';
    component.parsedTransactions = [sampleTransaction];
    component.selectedFile = new File([''], 'test.pdf');

    component.confirmImport();

    expect(mockImportService.importTransactions).toHaveBeenCalled();
  });

  it('should handle partially successful import', () => {
    const result: ImportResult = {
      batchId: 'batch-123',
      status: ImportStatus.PARTIALLY_COMPLETED,
      successCount: 8,
      failureCount: 2,
      totalTransactions: 10,
      createdAt: new Date().toISOString()
    };

    component.handleImportResult(result);

    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toContain('Imported 8 of 10 transactions');
    expect(component.currentStep).toBe(component.STEP_RESULTS);
  });

  it('should handle failed import', () => {
    const result: ImportResult = {
      batchId: 'batch-123',
      status: ImportStatus.FAILED,
      successCount: 0,
      failureCount: 10,
      totalTransactions: 10,
      createdAt: new Date().toISOString(),
      errorMessage: 'Import failed'
    };

    component.handleImportResult(result);

    expect(component.errorMessage).toContain('Import failed: Import failed');
    expect(component.currentStep).toBe(component.STEP_PREVIEW);
  });

  it('should cancel import', () => {
    component.parsedTransactions = [sampleTransaction];
    component.currentStep = component.STEP_PREVIEW;

    component.cancelImport();

    expect(component.parsedTransactions.length).toBe(0);
    expect(component.currentStep).toBe(component.STEP_UPLOAD);
  });

  it('should get provider instructions', () => {
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    expect(component.getProviderInstructions()).toContain('PDF');
    expect(component.getProviderInstructions()).toContain('CSV');

    component.selectedProvider = 'OTHER' as StatementProvider;
    expect(component.getProviderInstructions()).toContain('Please upload your account statement PDF');
  });

  it('should reset all state on resetImport', () => {
    component.currentStep = component.STEP_RESULTS;
    component.selectedFormat = ImportFormat.CSV;
    component.selectedFile = new File([''], 'test.csv');
    component.parsedTransactions = [sampleTransaction];
    component.errorMessage = 'oops';

    component.resetImport();

    expect(component.currentStep).toBe(component.STEP_PROVIDER);
    expect(component.selectedFormat).toBeUndefined();
    expect(component.selectedFile).toBeUndefined();
    expect(component.parsedTransactions.length).toBe(0);
    expect(component.errorMessage).toBe('');
  });

  it('should expose the right accepted file extension per format', () => {
    component.selectedFormat = ImportFormat.CSV;
    expect(component.acceptedFileExtension()).toBe('.csv');

    component.selectedFormat = ImportFormat.PDF;
    expect(component.acceptedFileExtension()).toBe('.pdf');
  });
});
