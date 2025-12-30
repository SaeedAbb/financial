import { Injectable } from '@angular/core';
import { BaseParser } from '../base-parser';
import { ParsedTransaction } from '../../models/parsed-transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TradeRepublicParserService extends BaseParser {
  readonly providerName = 'Trade Republic';
  
  async parse(file: File): Promise<ParsedTransaction[]> {
    try {
      const text = await this.extractPdfText(file);
      
      // Extract transaction lines directly from the entire text
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const transactionLines: string[] = [];
      
      let inTransactionSection = false;
      let transactionSectionStarted = false;
      
      // Debug: Find all section headers and check for multiple occurrences
      const sectionOccurrences: Record<string, number[]> = {};
      lines.forEach((line, idx) => {
        if (line.includes('UMSATZÜBERSICHT') || 
            line.includes('BARMITTELÜBERSICHT') || 
            line.includes('TRANSAKTIONSÜBERSICHT') ||
            line.includes('KONTOÜBERSICHT')) {
          const key = line.trim();
          if (!sectionOccurrences[key]) {
            sectionOccurrences[key] = [];
          }
          sectionOccurrences[key].push(idx);
        }
      });
      
      console.log('Section occurrences:', sectionOccurrences);
      
      // Check for suspicious patterns near UMSATZÜBERSICHT
      Object.entries(sectionOccurrences).forEach(([section, indices]) => {
        if (section.includes('UMSATZÜBERSICHT')) {
          indices.forEach(idx => {
            console.log(`\nAround UMSATZÜBERSICHT at line ${idx}:`);
            for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 5); i++) {
              console.log(`  Line ${i}: "${lines[i]}"`);
            }
          });
        }
      });
      
      // Find the correct UMSATZÜBERSICHT section
      // It should be preceded by KONTOÜBERSICHT section and followed by transaction header
      let correctUmsatzIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === 'UMSATZÜBERSICHT') {
          // Check if this is the right one by looking for transaction header nearby
          let foundHeader = false;
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].includes('DATUM') && lines[j].includes('TYP') && lines[j].includes('BESCHREIBUNG')) {
              foundHeader = true;
              break;
            }
          }
          
          if (foundHeader) {
            correctUmsatzIndex = i;
            console.log('Found correct UMSATZÜBERSICHT at line', i);
            break;
          }
        }
      }
      
      if (correctUmsatzIndex === -1) {
        console.error('Could not find valid UMSATZÜBERSICHT section');
        return [];
      }
      
      // Now extract transactions starting from the correct section
      let pageBreakCount = 0;
      
      for (let i = correctUmsatzIndex; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip UMSATZÜBERSICHT itself
        if (i === correctUmsatzIndex) {
          inTransactionSection = true;
          continue;
        }
        
        // Skip the header line (can appear multiple times in multi-page docs)
        if (inTransactionSection && line.includes('DATUM') && line.includes('TYP') && line.includes('BESCHREIBUNG')) {
          if (!transactionSectionStarted) {
            console.log('Found header line at', i, ':', line);
            transactionSectionStarted = true;
          } else {
            console.log('Found repeated header (new page) at', i);
          }
          continue;
        }
        
        // Handle page breaks - don't stop, just skip the footer/header lines
        if (inTransactionSection && transactionSectionStarted) {
          // Check for page footer
          if (line.includes('Trade Republic Bank GmbH www.traderepublic.com') ||
              line.includes('Brunnenstraße') ||
              line.includes('10119 Berlin') ||
              line.includes('AG Charlottenburg') ||
              line.includes('Umsatzsteuer-ID') ||
              line.includes('Geschäftsführer') ||
              line.includes('Erstellt am') ||
              line.includes('Seite') ||
              line.includes('Andreas Torner') ||
              line.includes('Gernot Mittendorfer') ||
              line.includes('Christian Hecker') ||
              line.includes('Thomas Pischke') ||
              line.includes('Sitz der Gesellschaft')) {
            if (transactionLines.length < 50 && !line.includes('Seite')) {
              console.log(`Skipping footer line at ${i}: "${line.substring(0, 50)}..."`);
            }
            pageBreakCount++;
            continue;
          }
          
          // Check for page header repetition
          if (line === 'TRADE REPUBLIC BANK GMBH BRUNNENSTRASSE 19-21 10119 BERLIN' ||
              line.includes('TRADE REPUBLIC BANK GMBH   BRUNNENSTRASSE')) {
            console.log('Skipping page header at', i);
            continue;
          }
          
          // Stop only when we reach a different major section
          if (line === 'BARMITTELÜBERSICHT' || 
              line === 'TRANSAKTIONSÜBERSICHT' || 
              line === 'HINWEISE ZUM KONTOAUSZUG') {
            console.log('End of transaction section at line', i, ':', line);
            break;
          }
        }
        
        // Collect transaction lines
        if (inTransactionSection && transactionSectionStarted) {
          // Skip empty lines and page numbers
          if (line.trim() === '' || /^Seite \d+ von \d+$/.test(line)) {
            continue;
          }
          
          // Debug first few and every 20th line
          if (transactionLines.length < 5 || transactionLines.length % 20 === 0) {
            console.log(`Adding line ${i} (tx #${transactionLines.length}): "${line.substring(0, 60)}..."`);
          }
          transactionLines.push(line);
        }
      }
      
      console.log('Extracted', transactionLines.length, 'transaction lines');
      console.log('Detected', pageBreakCount, 'page breaks');
      console.log('First 5 transaction lines:', transactionLines.slice(0, 5));
      if (transactionLines.length > 50) {
        console.log('Last 5 transaction lines:', transactionLines.slice(-5));
      }
      
      // Parse the transactions
      const transactions = this.parseKontoauszugFormat(transactionLines);
      
      console.log('Successfully parsed', transactions.length, 'transactions');
      
      return transactions;
    } catch (error) {
      console.error('Error parsing Trade Republic PDF:', error);
      throw new Error(`Failed to parse Trade Republic statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // No longer used - extraction is done directly in parse()
  private extractTradeRepublicSections(text: string): Record<string, string[]> {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const sections: Record<string, string[]> = {
      transactions: []
    };
    
    let inTransactionSection = false;
    let foundFirstTransaction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect UMSATZÜBERSICHT section (where transactions are)
      if (line.includes('UMSATZÜBERSICHT')) {
        console.log('Found UMSATZÜBERSICHT section at line', i);
        inTransactionSection = true;
        foundFirstTransaction = false;
        continue;
      }
      
      // Detect other sections to stop collecting
      if (inTransactionSection && (
          line.includes('BARMITTELÜBERSICHT') || 
          line.includes('TRANSAKTIONSÜBERSICHT') || 
          line.includes('HINWEISE ZUM KONTOAUSZUG') ||
          (line.includes('Trade Republic Bank GmbH') && foundFirstTransaction))) {
        console.log('Found section end at line', i, ':', line.substring(0, 50));
        inTransactionSection = false;
        break; // Stop processing once we leave the transaction section
      }
      
      // Collect lines from active sections
      if (inTransactionSection) {
        // Skip header line
        if (line.includes('DATUM') && line.includes('TYP') && line.includes('BESCHREIBUNG')) {
          console.log('Skipping header line:', line);
          continue;
        }
        
        // Check if this looks like a transaction date
        if (/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?/i.test(line)) {
          foundFirstTransaction = true;
          console.log('Found first transaction date:', line);
        }
        
        console.log('Adding transaction line:', line.substring(0, 80));
        sections['transactions'].push(line);
      }
    }
    
    console.log('Extracted', sections['transactions'].length, 'transaction lines');
    return sections;
  }
  
  // No longer used - parseKontoauszugFormat is called directly
  private parseTransactions(sections: Record<string, string[]>): ParsedTransaction[] {
    const transactionLines = sections['transactions'] || [];
    
    console.log(`Parsing ${transactionLines.length} transaction lines`);
    
    // For Trade Republic Kontoauszug, use the new parser
    const parsedTransactions = this.parseKontoauszugFormat(transactionLines);
    console.log(`Kontoauszug format found ${parsedTransactions.length} transactions`);
    
    const validated = this.validateTransactions(parsedTransactions);
    console.log(`Validated ${validated.length} transactions out of ${parsedTransactions.length}`);
    return validated;
  }
  
  private parseMultiLineFormat(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const transaction = this.parseTransactionBlock(lines, i);
      if (transaction) {
        transactions.push(transaction);
        i += 4; // Multi-line format uses 4 lines
      } else {
        i++;
      }
    }
    
    return transactions;
  }
  
  private parseSingleLineFormat(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    
    for (const line of lines) {
      const transaction = this.parseSingleLineTransaction(line);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }
  
  private parseCompactFormat(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    let i = 0;
    
    while (i < lines.length) {
      // Trade Republic format from Kontoauszug:
      // Line 1: "03 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,"
      // Line 2: "Handel   101,00 €   9.874,75 €"
      // Line 3: "2025   quantity: 0.180342"
      
      if (this.isTradeRepublicTransactionStart(lines[i])) {
        const transaction = this.parseTradeRepublicTransaction(lines, i);
        if (transaction) {
          transactions.push(transaction);
          // Skip the lines we've processed
          i += this.getTransactionLineCount(lines, i);
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return transactions;
  }
  
  private isTradeRepublicTransactionStart(line: string): boolean {
    // Check if line starts with date and contains Buy/Sell trade
    // Also check for the inline format (crypto)
    return /^\d{2}\s+\w+\./.test(line) && 
           (/\b(Buy|Sell)\s+trade\b/i.test(line) || 
            /Handel\s+(Buy|Sell)\s+trade/i.test(line));
  }
  
  private getTransactionLineCount(lines: string[], startIndex: number): number {
    const line1 = lines[startIndex];
    
    // Check if this is an inline crypto format (all on one line)
    if (line1.includes('Handel') && line1.includes('quantity:')) {
      // Next line is just the year
      return startIndex + 1 < lines.length && /^\d{4}/.test(lines[startIndex + 1]) ? 2 : 1;
    }
    
    // Standard format
    let count = 1;
    
    // Next line should have "Handel" and amounts
    if (startIndex + 1 < lines.length && lines[startIndex + 1].includes('Handel')) {
      count++;
      
      // Next line might have year and quantity
      if (startIndex + 2 < lines.length) {
        const nextLine = lines[startIndex + 2];
        // Check if it's a year line with quantity
        if (/^\d{4}/.test(nextLine)) {
          count++;
        }
      }
    }
    
    return count;
  }
  
  private parseTradeRepublicTransaction(lines: string[], startIndex: number): ParsedTransaction | null {
    try {
      const line1 = lines[startIndex];
      
      // Check if this is an inline crypto format
      if (line1.includes('Handel') && line1.includes('quantity:')) {
        return this.parseInlineCryptoFormat(line1);
      }
      
      const line2 = startIndex + 1 < lines.length ? lines[startIndex + 1] : '';
      const line3 = startIndex + 2 < lines.length ? lines[startIndex + 2] : '';
      
      console.log(`Parsing TR transaction at ${startIndex}:`, { line1, line2, line3 });
      
      // Parse date from line 1: "03 Nov."
      const dateMatch = line1.match(/^(\d{2})\s+(\w+)\./);
      if (!dateMatch) return null;
      
      // We need the year - it might be on line 3 
      let year = 2025; // Default to 2025 based on the document
      const yearMatch = line3.match(/^(\d{4})/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }
      
      // Convert month name to number
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = dateMatch[2].toLowerCase().substring(0, 3);
      const month = monthNames.indexOf(monthStr) + 1;
      if (month === 0) return null;
      
      const date = `${year}-${month.toString().padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
      
      // Parse type from line 1
      const typeMatch = line1.match(/\b(Buy|Sell)\s+trade\b/i);
      if (!typeMatch) return null;
      const type = typeMatch[1].toLowerCase() === 'buy' ? 'BUY' : 'SELL';
      
      // Parse ISIN and stock name from line 1
      const isinMatch = line1.match(/([A-Z]{2}[A-Z0-9]{9}\d+)/);
      const isin = isinMatch ? isinMatch[1] : '';
      
      // Extract stock name (everything after ISIN)
      let description = '';
      if (isin) {
        const afterIsin = line1.split(isin)[1];
        description = afterIsin.trim().replace(/,$/, '');
      } else {
        // No ISIN, take everything after "trade"
        description = line1.split(/trade\s+/i)[1]?.trim() || 'Unknown Stock';
      }
      
      // Parse amount from line 2: "Handel   101,00 €   9.874,75 €"
      let totalAmount = 0;
      if (line2.includes('Handel')) {
        const amountMatch = line2.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*€/);
        if (amountMatch) {
          totalAmount = this.parseDecimalNumber(amountMatch[1]);
        }
      }
      
      // Parse quantity from line 3: "quantity: 0.180342"
      let quantity = 0;
      const quantityMatch = line3.match(/quantity:\s*(\d+(?:[.,]\d+)?)/i);
      if (quantityMatch) {
        quantity = this.parseDecimalNumber(quantityMatch[1]);
      } else {
        // Sometimes quantity might be on line 2 or use a default
        quantity = 1;
      }
      
      // Calculate price per unit
      const pricePerUnit = quantity > 0 ? totalAmount / quantity : totalAmount;
      
      return {
        date,
        type: type as 'BUY' | 'SELL',
        description,
        quantity,
        pricePerUnit,
        totalAmount,
        fees: 1.00,
        currency: 'EUR',
        rawSymbol: description.split(' ')[0],
        providerReference: isin
      };
    } catch (error) {
      console.error('Error parsing Trade Republic transaction:', error);
      return null;
    }
  }
  
  private parseTransactionBlock(lines: string[], startIndex: number): ParsedTransaction | null {
    if (startIndex + 3 >= lines.length) return null;
    
    try {
      // Trade Republic format:
      // Line 1: Date and Type (e.g., "15.01.2024 Kauf")
      // Line 2: Company name and ISIN
      // Line 3: Quantity and price (e.g., "10 Stk. zu 150,50 €")
      // Line 4: Total amount (e.g., "1.505,00 €")
      
      const line1 = lines[startIndex];
      const line2 = lines[startIndex + 1];
      const line3 = lines[startIndex + 2];
      const line4 = lines[startIndex + 3];
      
      // Parse date and type from line 1
      const dateMatch = line1.match(/(\d{2}\.\d{2}\.\d{4})/);
      const typeMatch = line1.match(/(Kauf|Verkauf)/i);
      
      if (!dateMatch || !typeMatch) return null;
      
      const date = this.parseDate(dateMatch[1]);
      const type = typeMatch[1].toLowerCase() === 'kauf' ? 'BUY' : 'SELL';
      
      // Parse company name and ISIN from line 2
      const description = line2.trim();
      const isinMatch = line2.match(/[A-Z]{2}[A-Z0-9]{9}\d/);
      const isin = isinMatch ? isinMatch[0] : undefined;
      
      // Parse quantity and price from line 3
      const quantityMatch = line3.match(/(\d+(?:[.,]\d+)?)\s*Stk/i);
      const priceMatch = line3.match(/zu\s*(\d+(?:[.,]\d+)?)\s*€/i);
      
      if (!quantityMatch || !priceMatch) return null;
      
      const quantity = this.parseDecimalNumber(quantityMatch[1]);
      const pricePerUnit = this.parseDecimalNumber(priceMatch[1]);
      
      // Parse total amount from line 4
      const totalMatch = line4.match(/(\d+(?:\.\d{3})*(?:,\d+)?)\s*€/);
      if (!totalMatch) return null;
      
      const totalAmount = this.parseDecimalNumber(totalMatch[1]);
      
      // Calculate fees (Trade Republic typically has 1€ fee per transaction)
      const fees = 1.00;
      
      return {
        date,
        type: type as 'BUY' | 'SELL',
        description,
        quantity,
        pricePerUnit,
        totalAmount,
        fees,
        currency: 'EUR',
        rawSymbol: description.split(' ')[0], // First word is often the company name
        providerReference: isin
      };
    } catch (error) {
      console.error('Error parsing transaction block:', error);
      return null;
    }
  }
  
  private parseSingleLineTransaction(line: string): ParsedTransaction | null {
    try {
      // Format: "01.12.2024 Buy Apple Inc. 10 Stk. 150,50 € 1.505,00 €"
      // Or: "01.12.2024 Kauf Apple Inc. ISIN: US0378331005 10 150,50 1.505,00"
      
      const dateMatch = line.match(/^(\d{2}\.\d{2}\.\d{4})/);
      if (!dateMatch) return null;
      
      const date = this.parseDate(dateMatch[1]);
      
      // Look for transaction type
      const typeMatch = line.match(/\b(Buy|Sell|Kauf|Verkauf)\b/i);
      const type = typeMatch ? 
        (typeMatch[1].toLowerCase() === 'buy' || typeMatch[1].toLowerCase() === 'kauf' ? 'BUY' : 'SELL') : 
        'BUY';
      
      // Extract numbers (quantity, price, total)
      const numbers = line.match(/(\d+(?:[.,]\d+)?)/g);
      if (!numbers || numbers.length < 3) return null;
      
      // Usually: [date parts..., quantity, price, total]
      // Find the numeric values after the date
      const relevantNumbers = numbers.slice(3); // Skip date parts
      
      if (relevantNumbers.length >= 3) {
        const quantity = this.parseDecimalNumber(relevantNumbers[0]);
        const pricePerUnit = this.parseDecimalNumber(relevantNumbers[1]);
        const totalAmount = this.parseDecimalNumber(relevantNumbers[2]);
        
        // Extract description (between date/type and numbers)
        const descMatch = line.match(/(?:Buy|Sell|Kauf|Verkauf)\s+(.+?)(?:\s+\d+(?:[.,]\d+)?)/i);
        const description = descMatch ? descMatch[1].trim() : 'Unknown Stock';
        
        return {
          date,
          type: type as 'BUY' | 'SELL',
          description,
          quantity,
          pricePerUnit,
          totalAmount,
          fees: 1.00,
          currency: 'EUR',
          rawSymbol: description.split(' ')[0]
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing single line transaction:', error);
      return null;
    }
  }
  
  private parseGenericTransactions(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const processedIndices = new Set<number>();
    
    // Look for any line that contains a date and monetary values
    for (let i = 0; i < lines.length; i++) {
      if (processedIndices.has(i)) continue;
      
      const line = lines[i];
      const dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);
      
      if (dateMatch) {
        // Found a line with a date, check if it's a transaction
        const transaction = this.parseGenericTransactionLine(lines, i, processedIndices);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
    
    return transactions;
  }
  
  private parseGenericTransactionLine(lines: string[], startIndex: number, processedIndices: Set<number>): ParsedTransaction | null {
    try {
      const currentLine = lines[startIndex];
      const nextLine = startIndex + 1 < lines.length ? lines[startIndex + 1] : '';
      
      console.log(`Parsing generic transaction starting at line ${startIndex}: ${currentLine}`);
      if (nextLine) console.log(`Next line: ${nextLine}`);
      
      // Extract date
      const dateMatch = currentLine.match(/(\d{2}\.\d{2}\.\d{4})/);
      if (!dateMatch) return null;
      
      const date = this.parseDate(dateMatch[1]);
      processedIndices.add(startIndex);
      
      // Look for stock names and transaction indicators
      let description = '';
      let type: 'BUY' | 'SELL' = 'BUY';
      
      // Common stock name patterns
      const stockPatterns = [
        /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\s+(?:AG|SE|Inc\.|Corporation|Corp\.|Ltd\.?|PLC|SA|NV)\b/,
        /\b([A-Z]{2,})\b/, // Ticker symbols
        /ISIN:\s*([A-Z]{2}[A-Z0-9]{9}\d)/ // ISIN
      ];
      
      for (const pattern of stockPatterns) {
        const match = currentLine.match(pattern) || nextLine.match(pattern);
        if (match) {
          description = match[1] || match[0];
          break;
        }
      }
      
      // If no stock name found, use generic description
      if (!description) {
        description = currentLine.replace(dateMatch[0], '').trim();
        if (description.length > 50) {
          description = description.substring(0, 50) + '...';
        }
      }
      
      // Look for sell indicators
      const sellIndicators = /\b(sell|verkauf|sold|verkauft)\b/i;
      
      if (sellIndicators.test(currentLine) || sellIndicators.test(nextLine)) {
        type = 'SELL';
      }
      
      // Extract numeric values (looking for patterns like: quantity, price, total)
      const allNumbers: number[] = [];
      
      // Extract from current line
      const currentNumbers: string[] = [];
      const currentMatches = currentLine.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?)\s*(?:€|EUR)?/g) || [];
      currentNumbers.push(...currentMatches);
      
      // Extract from next line if it doesn't have a date
      if (nextLine && !nextLine.match(/\d{2}\.\d{2}\.\d{4}/)) {
        const nextNumbers = nextLine.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?)\s*(?:€|EUR)?/g) || [];
        currentNumbers.push(...nextNumbers);
        if (nextNumbers.length > 0) {
          processedIndices.add(startIndex + 1);
        }
      }
      
      // Parse all numbers
      currentNumbers.forEach(numStr => {
        const cleaned = numStr.replace(/[€EUR\s]/g, '').trim();
        const num = this.parseDecimalNumber(cleaned);
        if (num > 0 && !dateMatch[0].includes(cleaned)) { // Exclude date numbers
          allNumbers.push(num);
        }
      });
      
      console.log(`Found numbers: ${allNumbers}`);
      
      // Try to identify quantity, price, and total
      if (allNumbers.length >= 2) {
        let quantity = 0;
        let pricePerUnit = 0;
        let totalAmount = 0;
        
        if (allNumbers.length === 2) {
          // Assume first is quantity, second is total
          quantity = allNumbers[0];
          totalAmount = allNumbers[1];
          pricePerUnit = totalAmount / quantity;
        } else if (allNumbers.length >= 3) {
          // Look for the pattern: small number (quantity), medium number (price), large number (total)
          const sorted = [...allNumbers].sort((a, b) => a - b);
          
          // The smallest is likely quantity
          quantity = sorted[0];
          
          // The largest is likely total
          totalAmount = sorted[sorted.length - 1];
          
          // Price should be in between
          for (const num of allNumbers) {
            if (num !== quantity && num !== totalAmount) {
              pricePerUnit = num;
              break;
            }
          }
          
          // Validate the relationship
          if (Math.abs(quantity * pricePerUnit - totalAmount) > 1) {
            // Try different combinations
            for (let i = 0; i < allNumbers.length - 1; i++) {
              for (let j = i + 1; j < allNumbers.length; j++) {
                const testQ = allNumbers[i];
                const testP = allNumbers[j];
                const testTotal = testQ * testP;
                
                // Check if this combination matches any total in our numbers
                for (const total of allNumbers) {
                  if (Math.abs(testTotal - total) < 1) {
                    quantity = testQ;
                    pricePerUnit = testP;
                    totalAmount = total;
                    break;
                  }
                }
              }
            }
          }
        }
        
        if (quantity > 0 && totalAmount > 0) {
          return {
            date,
            type,
            description: description || 'Unknown Stock',
            quantity,
            pricePerUnit: pricePerUnit || (totalAmount / quantity),
            totalAmount,
            fees: 1.00,
            currency: 'EUR',
            rawSymbol: description.split(' ')[0]
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in generic transaction parser:', error);
      return null;
    }
  }
  
  private parseKontoauszugFormat(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    let i = 0;
    
    console.log('parseKontoauszugFormat: Processing', lines.length, 'lines');
    
    while (i < lines.length) {
      console.log(`Trying to parse line ${i}: ${lines[i]?.substring(0, 50)}`);
      const result = this.parseKontoauszugTransaction(lines, i);
      if (result) {
        console.log('Successfully parsed transaction:', result.transaction.description);
        transactions.push(result.transaction);
        i = result.linesConsumed;
      } else {
        i++;
      }
    }
    
    console.log('parseKontoauszugFormat: Found', transactions.length, 'transactions');
    return transactions;
  }
  
  private parseKontoauszugTransaction(lines: string[], startIndex: number): { transaction: ParsedTransaction; linesConsumed: number } | null {
    const line = lines[startIndex];
    
    // Check if this line starts with a date pattern (DD Mon.)
    const dateMatch = line.match(/^(\d{1,2})\s+(\w+)\.?/);
    if (!dateMatch) return null;
    
    // Check next line to determine transaction type
    const nextLineIndex = startIndex + 1;
    let transactionLine = line;
    
    // If the date is on its own line, the transaction details are on the next line
    if (nextLineIndex < lines.length && !line.includes('trade') && !line.includes('Zinsen') && !line.includes('Ertrag') && !line.includes('Überweisung')) {
      transactionLine = lines[nextLineIndex];
    }
    
    // Determine the type of transaction and parse accordingly
    if (transactionLine.includes('Zinsen') || transactionLine.includes('Ertrag') || transactionLine.includes('Überweisung')) {
      // Non-trading transactions (interest, dividends, transfers)
      return this.parseNonTradingTransaction(lines, startIndex);
    } else if (line.includes('trade') || transactionLine.includes('trade')) {
      // Trading transactions (buy/sell)
      return this.parseTradingTransaction(lines, startIndex);
    }
    
    return null;
  }
  
  private parseNonTradingTransaction(lines: string[], startIndex: number): { transaction: ParsedTransaction; linesConsumed: number } | null {
    try {
      let currentIndex = startIndex;
      const firstLine = lines[currentIndex];
      
      // Parse date from first part
      const dateMatch = firstLine.match(/^(\d{1,2})\s+(\w+)\.?/);;
      if (!dateMatch) return null;
      
      let description = '';
      let amount = 0;
      const type: 'BUY' | 'SELL' = 'BUY';
      
      // Check if this is a complete line or split
      const amountMatch = firstLine.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*€/);
      
      if (amountMatch) {
        // Complete line format: "01 Nov. Zinsen Interest payment 13,40 € 9.975,75 €"
        const parts = firstLine.split(/\s{2,}/);
        if (parts.length >= 3) {
          const typePart = parts[1] || '';
          description = parts.length > 2 ? parts.slice(1, -2).join(' ') : typePart;
          amount = this.parseDecimalNumber(amountMatch[1]);
        }
        currentIndex++;
      } else {
        // Multi-line format
        currentIndex++;
        if (currentIndex < lines.length) {
          const secondLine = lines[currentIndex];
          // Parse type and description
          const typeMatchLine = secondLine.match(/^(\w+)\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*€/);
          if (typeMatchLine) {
            description = `${typeMatchLine[1]} ${typeMatchLine[2]}`;
            amount = this.parseDecimalNumber(typeMatchLine[3]);
            currentIndex++;
          }
        }
      }
      
      // Skip year line if present
      if (currentIndex < lines.length && /^\d{4}$/.test(lines[currentIndex])) {
        currentIndex++;
      }
      
      // Get year (default to 2025 based on statement)
      const year = 2025;
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = dateMatch[2].toLowerCase().substring(0, 3);
      const month = monthNames.indexOf(monthStr) + 1;
      
      if (month === 0 || amount === 0) return null;
      
      const date = `${year}-${month.toString().padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
      
      // For non-trading transactions, create a simple transaction record
      const transaction: ParsedTransaction = {
        date,
        type,
        description: description || 'Bank Transaction',
        quantity: 1,
        pricePerUnit: amount,
        totalAmount: amount,
        fees: 0,
        currency: 'EUR',
        rawSymbol: 'CASH'
      };
      
      return { transaction, linesConsumed: currentIndex };
    } catch (error) {
      console.error('Error parsing non-trading transaction:', error);
      return null;
    }
  }
  
  private parseTradingTransaction(lines: string[], startIndex: number): { transaction: ParsedTransaction; linesConsumed: number } | null {
    try {
      const firstLine = lines[startIndex];
      let currentIndex = startIndex;
      
      // Check if the transaction details are on the next line (date on separate line)
      const nextLine = currentIndex + 1 < lines.length ? lines[currentIndex + 1] : '';
      
      // Check if it's inline format (crypto) - could be on first or second line
      if ((firstLine.includes('Handel') && firstLine.includes('quantity:')) ||
          (nextLine.includes('Handel') && nextLine.includes('quantity:'))) {
        // Inline crypto format
        const cryptoLine = firstLine.includes('quantity:') ? firstLine : nextLine;
        const transaction = this.parseInlineCryptoFormat(cryptoLine);
        if (transaction) {
          currentIndex = firstLine.includes('quantity:') ? startIndex + 1 : startIndex + 2;
          // Skip year line if present
          if (currentIndex < lines.length && /^\d{4}$/.test(lines[currentIndex])) {
            currentIndex++;
          }
          return { transaction, linesConsumed: currentIndex - startIndex };
        }
      }
      
      // Standard multi-line format
      // Line 1: "03 Nov. Buy trade US30303M1027 META PLATF. A DL-,000006,"
      // Line 2: "Handel   101,00 €   9.874,75 €"
      // Line 3: "2025   quantity: 0.180342"
      
      // Parse date
      const dateMatch = firstLine.match(/^(\d{1,2})\s+(\w+)\.?/);;
      if (!dateMatch) return null;
      
      // Parse type
      const typeMatch = firstLine.match(/\b(Buy|Sell)\s+trade\b/i);
      if (!typeMatch) return null;
      const type = typeMatch[1].toLowerCase() === 'buy' ? 'BUY' : 'SELL';
      
      // Parse ISIN and description
      const isinMatch = firstLine.match(/([A-Z]{2}[A-Z0-9]{9}\d+)/);
      const isin = isinMatch ? isinMatch[1] : '';
      
      // Extract description after ISIN
      let description = '';
      if (isin) {
        const afterIsin = firstLine.substring(firstLine.indexOf(isin) + isin.length).trim();
        description = afterIsin.replace(/,$/, '').trim();
      } else {
        // For crypto or other assets without ISIN
        const afterTrade = firstLine.substring(firstLine.indexOf('trade') + 5).trim();
        description = afterTrade.replace(/,$/, '').trim();
      }
      
      currentIndex++;
      
      // Parse amounts from second line
      let totalAmount = 0;
      if (currentIndex < lines.length) {
        const secondLine = lines[currentIndex];
        if (secondLine.includes('Handel')) {
          const amountMatch = secondLine.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*€/);
          if (amountMatch) {
            totalAmount = this.parseDecimalNumber(amountMatch[1]);
          }
          currentIndex++;
        }
      }
      
      // Parse year and quantity from third line
      let quantity = 1;
      let year = 2025;
      if (currentIndex < lines.length) {
        const thirdLine = lines[currentIndex];
        const yearMatch = thirdLine.match(/^(\d{4})/);
        if (yearMatch) {
          year = parseInt(yearMatch[1]);
          const quantityMatch = thirdLine.match(/quantity:\s*([\d.,]+)/);
          if (quantityMatch) {
            quantity = this.parseDecimalNumber(quantityMatch[1]);
          }
          currentIndex++;
        }
      }
      
      // Build date
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = dateMatch[2].toLowerCase().substring(0, 3);
      const month = monthNames.indexOf(monthStr) + 1;
      
      if (month === 0) return null;
      
      const date = `${year}-${month.toString().padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
      
      const pricePerUnit = quantity > 0 ? totalAmount / quantity : totalAmount;
      
      const transaction: ParsedTransaction = {
        date,
        type: type as 'BUY' | 'SELL',
        description: description || 'Unknown Asset',
        quantity,
        pricePerUnit,
        totalAmount,
        fees: 1.00, // Trade Republic standard fee
        currency: 'EUR',
        rawSymbol: description.split(' ')[0] || 'UNKNOWN',
        providerReference: isin || undefined
      };
      
      return { transaction, linesConsumed: currentIndex };
    } catch (error) {
      console.error('Error parsing trading transaction:', error);
      return null;
    }
  }
  
  private parseInlineCryptoFormat(line: string): ParsedTransaction | null {
    try {
      // Format: "04 Nov. Handel Buy trade XF000BTC0017 Bitcoin, quantity: 0.001134 100,91 € 9.672,82 €"
      
      // Parse date
      const dateMatch = line.match(/^(\d{1,2})\s+(\w+)\.?/);;
      if (!dateMatch) return null;
      
      // Parse type
      const typeMatchInline = line.match(/\b(Buy|Sell)\s+trade\b/i);
      const type = typeMatchInline && typeMatchInline[1].toLowerCase() === 'sell' ? 'SELL' : 'BUY';
      
      // Parse crypto identifier and name
      const cryptoMatch = line.match(/trade\s+([A-Z0-9]+)\s+([A-Za-z]+),\s*quantity:/);
      const isin = cryptoMatch ? cryptoMatch[1] : '';
      const description = cryptoMatch ? cryptoMatch[2] : 'Unknown Crypto';
      
      // Parse quantity
      const quantityMatch = line.match(/quantity:\s*([\d.,]+)/);
      const quantity = quantityMatch ? this.parseDecimalNumber(quantityMatch[1]) : 0;
      
      // Parse amounts - looking for euro amounts
      const amounts = line.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*€/g) || [];
      let totalAmount = 0;
      
      if (amounts.length >= 1 && amounts[0]) {
        // First amount is the transaction amount
        totalAmount = this.parseDecimalNumber(amounts[0].replace('€', '').trim());
      }
      
      // Default year to 2025 for this statement
      const year = 2025;
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = dateMatch[2].toLowerCase().substring(0, 3);
      const month = monthNames.indexOf(monthStr) + 1;
      
      if (month === 0) return null;
      
      const date = `${year}-${month.toString().padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
      const pricePerUnit = quantity > 0 ? totalAmount / quantity : totalAmount;
      
      return {
        date,
        type: type as 'BUY' | 'SELL',
        description,
        quantity,
        pricePerUnit,
        totalAmount,
        fees: 1.00,
        currency: 'EUR',
        rawSymbol: description,
        providerReference: isin
      };
    } catch (error) {
      console.error('Error parsing inline crypto format:', error);
      return null;
    }
  }
}