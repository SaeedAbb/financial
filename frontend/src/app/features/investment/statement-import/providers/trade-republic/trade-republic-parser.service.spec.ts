import { TestBed } from '@angular/core/testing';
import { TradeRepublicParserService } from './trade-republic-parser.service';

describe('TradeRepublicParserService', () => {
  let service: TradeRepublicParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradeRepublicParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Real Kontoauszug parsing', () => {
    // This is the EXACT output from your console logs
    const realPdfLines = [
      'TRADE REPUBLIC BANK GMBH   BRUNNENSTRASSE 19-21   10119 BERLIN',
      'HUDA CHIHAB DATUM   01 Nov. 2025 - 30 Nov. 2025',
      'Am Storchennest 8',
      'IBAN   DE32100123450187233301',
      '26847 Detern',
      'BIC   TRBKDEBBXXX',
      'KONTOÜBERSICHT',
      'PRODUKT   ANFANGSSALDO   ZAHLUNGSEINGANG   ZAHLUNGSAUSGANG   ENDSALDO',
      'Cashkonto   9.962,35 €   676,34 €   2.901,75 €   7.736,94 €',
      'UMSATZÜBERSICHT',
      'DATUM   TYP   BESCHREIBUNG   ZAHLUNGSEINGANG ZAHLUNGSAUSGANG   SALDO',
      '01 Nov.',
      'Zinsen   Interest payment   13,40 €   9.975,75 €',
      '2025',
      '03 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,',
      'Handel   101,00 €   9.874,75 €',
      '2025   quantity: 0.180342',
      '03 Nov. Buy trade US91324P1021 UNITEDHEALTH GROUP DL-,01,',
      'Handel   101,02 €   9.773,73 €',
      '2025   quantity: 0.351802',
      '04 Nov.',
      'Handel   Buy trade XF000BTC0017 Bitcoin, quantity: 0.001134   100,91 €   9.672,82 €',
      '2025',
      '04 Nov.',
      'Handel   Buy trade XF000ETH0019 Ethereum, quantity: 0.026519   75,98 €   9.596,84 €',
      '2025',
      '06 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,',
      'Handel   101,00 €   9.495,84 €',
      '2025   quantity: 0.184808',
      '06 Nov.',
      'Ertrag   Cash Dividend for ISIN NL0010273215   1,32 €   9.497,16 €',
      '2025',
      '07 Nov. Sell trade US6837121036 OPENDOOR TECHNOLOGIES INC,',
      'Handel   160,27 €   9.657,43 €',
      '2025   quantity: 42.0',
      '07 Nov. Sell trade US6837121036 OPENDOOR TECHNOLOGIES INC,',
      'Handel   1,35 €   9.658,78 €',
      '2025   quantity: 0.360042',
      '07 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,',
      'Handel   101,00 €   9.557,78 €',
      '2025   quantity: 0.190114',
      '07 Nov.',
      'Handel   Buy trade AU0000185993 IREN LTD., quantity: 1.0   52,55 €   9.505,23 €',
      '2025',
      'Trade Republic Bank GmbH www.traderepublic.com   Sitz der Gesellschaft: Berlin Geschäftsführer',
      'Brunnenstraße 19-21 AG Charlottenburg HRB 244347 B Andreas Torner',
      '10119 Berlin Umsatzsteuer-ID DE307510626 Gernot Mittendorfer',
      'Christian Hecker',
      'Thomas Pischke',
      'Erstellt am 28.12.2025, 11:25:29   Seite 1 von 5'
    ];

    it('should extract transaction lines correctly', () => {
      // Simulate what parse() does
      const transactionLines: string[] = [];
      let inTransactionSection = false;
      let transactionSectionStarted = false;
      
      for (let i = 0; i < realPdfLines.length; i++) {
        const line = realPdfLines[i];
        
        // Start collecting when we find UMSATZÜBERSICHT
        if (line === 'UMSATZÜBERSICHT') {
          console.log('Test: Found UMSATZÜBERSICHT at line', i);
          inTransactionSection = true;
          continue;
        }
        
        // Skip the header line
        if (inTransactionSection && !transactionSectionStarted && 
            line.includes('DATUM') && line.includes('TYP') && line.includes('BESCHREIBUNG')) {
          console.log('Test: Found header, starting transaction section');
          transactionSectionStarted = true;
          continue;
        }
        
        // Stop when we reach the next major section
        if (inTransactionSection && transactionSectionStarted && 
            (line === 'BARMITTELÜBERSICHT' || 
             line === 'TRANSAKTIONSÜBERSICHT' || 
             line.includes('Trade Republic Bank GmbH www.traderepublic.com'))) {
          console.log('Test: End of transaction section at line', i, ':', line);
          break;
        }
        
        // Collect transaction lines
        if (inTransactionSection && transactionSectionStarted) {
          console.log('Test: Adding transaction line:', line);
          transactionLines.push(line);
        }
      }
      
      expect(transactionLines.length).toBeGreaterThan(0);
      expect(transactionLines[0]).toBe('01 Nov.');
      expect(transactionLines[1]).toBe('Zinsen   Interest payment   13,40 €   9.975,75 €');
      expect(transactionLines).toContain('03 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,');
      expect(transactionLines).not.toContain('UMSATZÜBERSICHT');
      expect(transactionLines).not.toContain('Trade Republic Bank GmbH www.traderepublic.com');
    });

    it('should parse interest transaction correctly', () => {
      const lines = [
        '01 Nov.',
        'Zinsen   Interest payment   13,40 €   9.975,75 €',
        '2025'
      ];
      
      const result = (service as any).parseKontoauszugTransaction(lines, 0);
      expect(result).toBeTruthy();
      expect(result.transaction.date).toBe('2025-11-01');
      expect(result.transaction.description).toContain('Interest payment');
      expect(result.transaction.totalAmount).toBe(13.40);
      expect(result.linesConsumed).toBe(3);
    });

    it('should parse META stock buy transaction correctly', () => {
      const lines = [
        '03 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,',
        'Handel   101,00 €   9.874,75 €',
        '2025   quantity: 0.180342'
      ];
      
      const result = (service as any).parseKontoauszugTransaction(lines, 0);
      expect(result).toBeTruthy();
      expect(result.transaction.date).toBe('2025-11-03');
      expect(result.transaction.type).toBe('BUY');
      expect(result.transaction.description).toContain('META PLATF');
      expect(result.transaction.quantity).toBeCloseTo(0.180342);
      expect(result.transaction.totalAmount).toBe(101.00);
      expect(result.linesConsumed).toBe(3);
    });

    it('should parse crypto inline transaction correctly', () => {
      const lines = [
        '04 Nov.',
        'Handel   Buy trade XF000BTC0017 Bitcoin, quantity: 0.001134   100,91 €   9.672,82 €',
        '2025'
      ];
      
      const result = (service as any).parseKontoauszugTransaction(lines, 0);
      expect(result).toBeTruthy();
      expect(result.transaction.date).toBe('2025-11-04');
      expect(result.transaction.type).toBe('BUY');
      expect(result.transaction.description).toBe('Bitcoin');
      expect(result.transaction.quantity).toBeCloseTo(0.001134);
      expect(result.transaction.totalAmount).toBeCloseTo(100.91);
    });

    it('should parse dividend transaction correctly', () => {
      const lines = [
        '06 Nov.',
        'Ertrag   Cash Dividend for ISIN NL0010273215   1,32 €   9.497,16 €',
        '2025'
      ];
      
      const result = (service as any).parseKontoauszugTransaction(lines, 0);
      expect(result).toBeTruthy();
      expect(result.transaction.date).toBe('2025-11-06');
      expect(result.transaction.description).toContain('Cash Dividend');
      expect(result.transaction.totalAmount).toBe(1.32);
    });

    it('should parse sell transaction correctly', () => {
      const lines = [
        '07 Nov. Sell trade US6837121036 OPENDOOR TECHNOLOGIES INC,',
        'Handel   160,27 €   9.657,43 €',
        '2025   quantity: 42.0'
      ];
      
      const result = (service as any).parseKontoauszugTransaction(lines, 0);
      expect(result).toBeTruthy();
      expect(result.transaction.type).toBe('SELL');
      expect(result.transaction.quantity).toBe(42.0);
      expect(result.transaction.totalAmount).toBeCloseTo(160.27);
    });

    it('should parse complete PDF correctly', async () => {
      const mockPdfText = realPdfLines.join('\n');
      const mockFile = new File([mockPdfText], 'kontoauszug.pdf', { type: 'application/pdf' });
      
      // Mock the PDF extraction
      spyOn(service as any, 'extractPdfText').and.returnValue(Promise.resolve(mockPdfText));
      
      const transactions = await service.parse(mockFile);
      
      console.log('Parsed transactions:', transactions);
      
      expect(transactions.length).toBeGreaterThan(0);
      
      // Check we have all transaction types
      const hasInterest = transactions.some(tx => tx.description.includes('Interest'));
      const hasBuy = transactions.some(tx => tx.type === 'BUY');
      const hasSell = transactions.some(tx => tx.type === 'SELL');
      const hasDividend = transactions.some(tx => tx.description.includes('Dividend'));
      
      expect(hasInterest).toBe(true);
      expect(hasBuy).toBe(true);
      expect(hasSell).toBe(true);
      expect(hasDividend).toBe(true);
    });

    it('should handle multi-page documents correctly', () => {
      // Simulate a multi-page PDF with page breaks
      const multiPageLines = [
        ...realPdfLines.slice(0, 44), // First page content
        'Trade Republic Bank GmbH www.traderepublic.com   Sitz der Gesellschaft: Berlin Geschäftsführer',
        'Brunnenstraße 19-21 AG Charlottenburg HRB 244347 B Andreas Torner',
        '10119 Berlin Umsatzsteuer-ID DE307510626 Gernot Mittendorfer',
        'Christian Hecker',
        'Thomas Pischke',
        'Erstellt am 28.12.2025, 11:25:29   Seite 1 von 5',
        'TRADE REPUBLIC BANK GMBH BRUNNENSTRASSE 19-21 10119 BERLIN',
        'DATUM   TYP   BESCHREIBUNG   ZAHLUNGSEINGANG ZAHLUNGSAUSGANG   SALDO',
        // More transactions on page 2
        '07 Nov.',
        'Handel   Buy trade AU0000185993 IREN LTD., quantity: 0.939864   48,45 €   9.456,78 €',
        '2025',
        '12 Nov. Buy trade NL0009805522 NEBIUS GROUP CL.A DL-,01, quantity:',
        'Handel   10,00 €   9.446,78 €',
        '2025   0.111111',
        // End with final section
        'BARMITTELÜBERSICHT',
        'Zum 30 Nov. 2025'
      ];
      
      const transactionLines: string[] = [];
      let inTransactionSection = false;
      let transactionSectionStarted = false;
      
      // Find UMSATZÜBERSICHT
      let correctUmsatzIndex = -1;
      for (let i = 0; i < multiPageLines.length; i++) {
        if (multiPageLines[i] === 'UMSATZÜBERSICHT') {
          correctUmsatzIndex = i;
          break;
        }
      }
      
      // Extract with page break handling
      for (let i = correctUmsatzIndex; i < multiPageLines.length; i++) {
        const line = multiPageLines[i];
        
        if (i === correctUmsatzIndex) {
          inTransactionSection = true;
          continue;
        }
        
        if (inTransactionSection && line.includes('DATUM') && line.includes('TYP')) {
          transactionSectionStarted = true;
          continue;
        }
        
        if (inTransactionSection && transactionSectionStarted) {
          // Skip page footers/headers
          if (line.includes('Trade Republic Bank GmbH www.traderepublic.com') ||
              line.includes('Brunnenstraße') ||
              line.includes('10119 Berlin') ||
              line.includes('Erstellt am') ||
              line === 'TRADE REPUBLIC BANK GMBH BRUNNENSTRASSE 19-21 10119 BERLIN') {
            continue;
          }
          
          // Stop at next major section
          if (line === 'BARMITTELÜBERSICHT') {
            break;
          }
          
          transactionLines.push(line);
        }
      }
      
      // Should include transactions from both pages
      expect(transactionLines).toContain('01 Nov.');
      expect(transactionLines).toContain('07 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,');
      expect(transactionLines).toContain('12 Nov. Buy trade NL0009805522 NEBIUS GROUP CL.A DL-,01, quantity:');
      
      // Should not include page headers/footers
      expect(transactionLines).not.toContain('Trade Republic Bank GmbH www.traderepublic.com');
      expect(transactionLines).not.toContain('Brunnenstraße');
      expect(transactionLines).not.toContain('Erstellt am 28.12.2025');
    });
    
    it('should handle the problematic extraction issue', () => {
      // This tests the ACTUAL issue - wrong lines being extracted
      const wrongExtractedLines = [
        'PRODUKT   ANFANGSSALDO   ZAHLUNGSEINGANG   ZAHLUNGSAUSGANG   ENDSALDO',
        'Cashkonto   9.962,35 €   676,34 €   2.901,75 €   7.736,94 €',
        'UMSATZÜBERSICHT',
        'DATUM   TYP   BESCHREIBUNG   ZAHLUNGSEINGANG ZAHLUNGSAUSGANG   SALDO',
        '01 Nov.',
        'Nennbetrag also nicht dem für die Zinsrechnung maßgeblichen Kontostand entsprechen muss. Ein Rechnungsabschluss gilt als',
        // ... other footer text
      ];
      
      // None of these lines should parse as valid transactions
      let parsedCount = 0;
      for (let i = 0; i < wrongExtractedLines.length; i++) {
        const result = (service as any).parseKontoauszugTransaction(wrongExtractedLines, i);
        if (result) {
          parsedCount++;
          console.log('Unexpectedly parsed:', wrongExtractedLines[i], 'as', result.transaction);
        }
      }
      
      // Only "01 Nov." might be detected as a date, but it shouldn't parse without proper transaction data
      expect(parsedCount).toBe(0);
    });
  });
});