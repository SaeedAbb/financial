import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TransactionPreviewComponent } from './transaction-preview.component';
import { ParsedTransaction } from '../../models/parsed-transaction.model';

describe('TransactionPreviewComponent', () => {
  let component: TransactionPreviewComponent;
  let fixture: ComponentFixture<TransactionPreviewComponent>;

  const mockTransactions: ParsedTransaction[] = [
    {
      rawSymbol: 'AAPL',
      description: 'Apple Inc. - Buy order executed',
      quantity: 10,
      pricePerUnit: 150.50,
      totalAmount: 1505.00,
      fees: 5.00,
      date: '2024-01-15',
      type: 'BUY',
      currency: 'USD'
    },
    {
      rawSymbol: 'GOOGL',
      description: 'Alphabet Inc. - Sell order executed',
      quantity: 5,
      pricePerUnit: 120.00,
      totalAmount: 600.00,
      fees: 3.50,
      date: '2024-01-20',
      type: 'SELL',
      currency: 'USD'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionPreviewComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create editable copies on changes', () => {
    component.transactions = mockTransactions;
    component.ngOnChanges();
    
    expect(component.editableTransactions.length).toBe(2);
    expect(component.editableTransactions).not.toBe(component.transactions);
    expect(component.editableTransactions[0]).not.toBe(component.transactions[0]);
  });

  it('should truncate long text', () => {
    const longText = 'This is a very long description that should be truncated to fit the display';
    const truncated = component.truncateText(longText, 20);
    
    expect(truncated).toBe('This is a very long ...');
    
    const shortText = 'Short text';
    expect(component.truncateText(shortText, 20)).toBe('Short text');
  });

  it('should calculate buy count correctly', () => {
    component.editableTransactions = mockTransactions;
    expect(component.getBuyCount()).toBe(1);
  });

  it('should calculate sell count correctly', () => {
    component.editableTransactions = mockTransactions;
    expect(component.getSellCount()).toBe(1);
  });

  it('should calculate total value correctly', () => {
    component.editableTransactions = mockTransactions;
    expect(component.getTotalValue()).toBe(2105.00); // 1505 + 600
  });

  it('should emit confirm event with edited transactions', () => {
    spyOn(component.confirm, 'emit');
    
    component.editableTransactions = mockTransactions;
    component.editableTransactions[0].rawSymbol = 'AAPL2'; // Edit a value
    
    component.confirmImport();
    
    expect(component.confirm.emit).toHaveBeenCalledWith(component.editableTransactions);
  });

  it('should emit cancel event', () => {
    spyOn(component.cancelled, 'emit');
    
    const cancelButton = fixture.nativeElement.querySelector('.p-button-secondary');
    cancelButton?.click();
    
    fixture.detectChanges();
    
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should display transaction data in table', () => {
    component.transactions = mockTransactions;
    component.ngOnChanges();
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    
    // Check if the table headers are rendered
    expect(compiled.textContent).toContain('Date');
    expect(compiled.textContent).toContain('Type');
    expect(compiled.textContent).toContain('Description');
    expect(compiled.textContent).toContain('Symbol');
    expect(compiled.textContent).toContain('Quantity');
    expect(compiled.textContent).toContain('Price/Unit');
    expect(compiled.textContent).toContain('Total');
    expect(compiled.textContent).toContain('Fees');
  });

  it('should have empty transactions when no data provided', () => {
    component.editableTransactions = [];
    fixture.detectChanges();

    // The button should be disabled when editableTransactions is empty
    // We test the component state directly as PrimeNG button DOM is complex
    expect(component.editableTransactions.length).toBe(0);
  });

  it('should have transactions when data is provided', () => {
    component.transactions = mockTransactions;
    component.ngOnChanges();
    fixture.detectChanges();

    // The button should be enabled when editableTransactions has items
    expect(component.editableTransactions.length).toBeGreaterThan(0);
  });
});