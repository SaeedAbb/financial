import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StatementImportComponent } from './statement-import.component';
import { ParserFactoryService } from '../../services/parser-factory.service';
import { StatementImportService } from '../../services/statement-import.service';
import { PortfolioService } from '../../../../../core/services/portfolio.service';
import { StatementProvider } from '../../models/provider.enum';
import { ImportResult, ImportStatus, ParsedTransaction } from '../../models/parsed-transaction.model';
import { Portfolio } from '../../../../../core/models/portfolio.model';

describe('StatementImportComponent', () => {
  let component: StatementImportComponent;
  let fixture: ComponentFixture<StatementImportComponent>;
  let mockParserFactory: jasmine.SpyObj<ParserFactoryService>;
  let mockImportService: jasmine.SpyObj<StatementImportService>;
  let mockPortfolioService: jasmine.SpyObj<PortfolioService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockParserFactory = jasmine.createSpyObj('ParserFactoryService', ['isProviderSupported', 'getParser']);
    mockImportService = jasmine.createSpyObj('StatementImportService', ['importTransactions']);
    mockPortfolioService = jasmine.createSpyObj('PortfolioService', ['getAllPortfolios']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Default mock implementations
    mockParserFactory.isProviderSupported.and.returnValue(true);
    mockPortfolioService.getAllPortfolios.and.returnValue(of([
      { id: 1, uuid: 'uuid-1', userId: 'user-1', name: 'Test Portfolio 1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, uuid: 'uuid-2', userId: 'user-1', name: 'Test Portfolio 2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ] as Portfolio[]));

    await TestBed.configureTestingModule({
      imports: [StatementImportComponent, NoopAnimationsModule],
      providers: [
        { provide: ParserFactoryService, useValue: mockParserFactory },
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
    spyOn(console, 'error');
    
    component.loadPortfolios();
    
    expect(component.errorMessage).toContain('Failed to load portfolios');
    expect(console.error).toHaveBeenCalled();
  });

  it('should reset file selection when provider changes', () => {
    component.selectedFile = new File([''], 'test.pdf');
    component.parsedTransactions = [{ rawSymbol: 'TEST', description: 'Test', quantity: 1, pricePerUnit: 100, totalAmount: 100, fees: 0, date: '2024-01-01', type: 'BUY' as const, currency: 'EUR' }] as ParsedTransaction[];
    
    component.onProviderChange();
    
    expect(component.selectedFile).toBeUndefined();
    expect(component.parsedTransactions.length).toBe(0);
  });

  it('should handle file selection', () => {
    const file = new File([''], 'test.pdf');
    const event = { files: [file] };
    
    component.onFileSelect(event);
    
    expect(component.selectedFile).toBe(file);
  });

  it('should determine if can proceed to next step', () => {
    expect(component.canProceedToNextStep()).toBe(false);
    
    component.currentStep = 1;
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    expect(component.canProceedToNextStep()).toBe(true);
    
    component.currentStep = 2;
    expect(component.canProceedToNextStep()).toBe(false);
    component.selectedPortfolioId = 1;
    expect(component.canProceedToNextStep()).toBe(true);
    
    component.currentStep = 3;
    expect(component.canProceedToNextStep()).toBe(false);
    component.selectedFile = new File([''], 'test.pdf');
    expect(component.canProceedToNextStep()).toBe(true);
  });

  it('should navigate between steps', () => {
    component.currentStep = 2;
    component.previousStep();
    expect(component.currentStep).toBe(1);
    
    component.previousStep();
    expect(component.currentStep).toBe(1); // Should not go below 1
  });

  it('should process file and show preview on success', async () => {
    const mockParser = jasmine.createSpyObj('Parser', ['parse']);
    const mockTransactions = [{ rawSymbol: 'AAPL', description: 'Apple Inc.', quantity: 10, pricePerUnit: 150, totalAmount: 1500, fees: 5, date: '2024-01-01', type: 'BUY', currency: 'USD' }];
    
    mockParser.parse.and.returnValue(Promise.resolve(mockTransactions));
    mockParserFactory.getParser.and.returnValue(mockParser);
    
    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.currentStep = 3;
    
    await component.processFile();
    
    expect(component.currentStep).toBe(5);
    expect(component.parsedTransactions).toEqual(mockTransactions);
    expect(component.successMessage).toContain('Found 1 transactions');
  });

  it('should handle file processing error', async () => {
    const mockParser = jasmine.createSpyObj('Parser', ['parse']);
    mockParser.parse.and.returnValue(Promise.reject(new Error('Parse error')));
    mockParserFactory.getParser.and.returnValue(mockParser);
    
    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.currentStep = 3;
    
    await component.processFile();
    
    expect(component.currentStep).toBe(3);
    expect(component.errorMessage).toContain('Failed to process PDF: Parse error');
  });

  it('should handle empty transactions', async () => {
    const mockParser = jasmine.createSpyObj('Parser', ['parse']);
    mockParser.parse.and.returnValue(Promise.resolve([]));
    mockParserFactory.getParser.and.returnValue(mockParser);
    
    component.selectedFile = new File([''], 'test.pdf');
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.currentStep = 3;
    
    await component.processFile();
    
    expect(component.currentStep).toBe(3);
    expect(component.errorMessage).toContain('No transactions found in the PDF');
  });

  it('should handle successful import', () => {
    const result: ImportResult = {
      status: ImportStatus.COMPLETED,
      successCount: 10,
      totalTransactions: 10
    };
    
    mockImportService.importTransactions.and.returnValue(of(result));
    
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    component.selectedPortfolioId = 1;
    component.parsedTransactions = [{ rawSymbol: 'TEST', description: 'Test', quantity: 1, pricePerUnit: 100, totalAmount: 100, fees: 0, date: '2024-01-01', type: 'BUY' as const, currency: 'EUR' }] as ParsedTransaction[];
    component.selectedFile = new File([''], 'test.pdf');
    
    component.confirmImport();
    
    expect(mockImportService.importTransactions).toHaveBeenCalled();
  });

  it('should handle partially successful import', (done) => {
    const result: ImportResult = {
      status: ImportStatus.PARTIALLY_COMPLETED,
      successCount: 8,
      totalTransactions: 10
    };
    
    component.handleImportResult(result);
    
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toContain('Imported 8 of 10 transactions');
    
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/investment/portfolio', component.selectedPortfolioId]);
      done();
    }, 3100);
  });

  it('should handle failed import', () => {
    const result: ImportResult = {
      status: ImportStatus.FAILED,
      errorMessage: 'Import failed'
    };
    
    component.handleImportResult(result);
    
    expect(component.errorMessage).toContain('Import failed: Import failed');
    expect(component.currentStep).toBe(5);
  });

  it('should cancel import', () => {
    component.parsedTransactions = [{ rawSymbol: 'TEST', description: 'Test', quantity: 1, pricePerUnit: 100, totalAmount: 100, fees: 0, date: '2024-01-01', type: 'BUY' as const, currency: 'EUR' }] as ParsedTransaction[];
    component.currentStep = 5;
    
    component.cancelImport();
    
    expect(component.parsedTransactions.length).toBe(0);
    expect(component.currentStep).toBe(3);
  });

  it('should get provider instructions', () => {
    component.selectedProvider = StatementProvider.TRADE_REPUBLIC;
    expect(component.getProviderInstructions()).toContain('Trade Republic account statement PDF');
    
    component.selectedProvider = 'OTHER' as StatementProvider;
    expect(component.getProviderInstructions()).toContain('Please upload your account statement PDF');
  });
});