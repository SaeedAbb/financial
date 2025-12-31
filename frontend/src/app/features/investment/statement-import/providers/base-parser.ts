import { ParsedTransaction } from '../models/parsed-transaction.model';

export abstract class BaseParser {
  abstract readonly providerName: string;
  
  /**
   * Parse a PDF file and extract transactions
   * @param file The PDF file to parse
   * @returns Promise with parsed transactions
   */
  abstract parse(file: File): Promise<ParsedTransaction[]>;
  
  /**
   * Extract text from PDF file
   * @param file The PDF file
   * @returns Promise with extracted text
   */
  protected async extractPdfText(file: File): Promise<string> {
    // Dynamic import of PDF.js to reduce bundle size
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure PDF.js worker to use local file instead of CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.js/pdf.worker.min.mjs';
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by their y-position to reconstruct lines
      interface TextItem {
        str: string;
        transform: number[];
      }
      
      const items = textContent.items as TextItem[];
      const lineMap = new Map<number, TextItem[]>();
      
      items.forEach((item: TextItem) => {
        const y = Math.round(item.transform[5]); // Round y-position
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y)!.push(item);
      });
      
      // Sort lines by y-position (descending, as PDF coordinates are bottom-up)
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]);
      
      // Reconstruct text preserving line structure
      sortedLines.forEach(([, items]) => {
        const lineText = items
          .sort((a, b) => a.transform[4] - b.transform[4]) // Sort by x-position
          .map(item => item.str)
          .join(' ')
          .trim();
        
        if (lineText) {
          fullText += lineText + '\n';
        }
      });
    }
    
    return fullText;
  }
  
  /**
   * Validate parsed transactions
   * @param transactions Transactions to validate
   * @returns Valid transactions
   */
  protected validateTransactions(transactions: ParsedTransaction[]): ParsedTransaction[] {
    return transactions.filter(t => {
      return t.date && 
             t.type && 
             t.quantity > 0 && 
             t.pricePerUnit > 0 &&
             t.totalAmount > 0;
    });
  }
  
  /**
   * Parse date in various formats to ISO format
   * @param dateString Date string to parse
   * @param format Expected format (e.g., 'DD.MM.YYYY')
   * @returns ISO date string (YYYY-MM-DD)
   */
  protected parseDate(dateString: string, format = 'DD.MM.YYYY'): string {
    // Simple parser for common German date format
    if (format === 'DD.MM.YYYY') {
      const parts = dateString.split('.');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Fallback: try to parse with Date constructor
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    throw new Error(`Unable to parse date: ${dateString}`);
  }
  
  /**
   * Parse decimal number with German/European format
   * @param numberString Number string (e.g., "1.234,56")
   * @returns Parsed number
   */
  protected parseDecimalNumber(numberString: string): number {
    if (!numberString) return 0;
    
    // Remove all spaces
    let cleaned = numberString.trim().replace(/\s/g, '');
    
    // Handle German format (1.234,56) -> convert to US format (1234.56)
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    
    // Remove currency symbols
    cleaned = cleaned.replace(/[€$£¥]/g, '').trim();
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  /**
   * Extract sections from PDF text
   * @param text Full PDF text
   * @returns Sections of the PDF
   */
  protected extractSections(_text: string): Record<string, string> { // eslint-disable-line @typescript-eslint/no-unused-vars
    // To be implemented by specific parsers
    return {};
  }
}