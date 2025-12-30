import { Injectable, inject } from '@angular/core';
import { StatementProvider } from '../models/provider.enum';
import { BaseParser } from '../providers/base-parser';
import { TradeRepublicParserService } from '../providers/trade-republic/trade-republic-parser.service';

@Injectable({
  providedIn: 'root'
})
export class ParserFactoryService {
  
  private readonly tradeRepublicParser = inject(TradeRepublicParserService);
  
  getParser(provider: StatementProvider): BaseParser {
    switch (provider) {
      case StatementProvider.TRADE_REPUBLIC:
        return this.tradeRepublicParser;
      
      case StatementProvider.DEUTSCHE_BANK:
      case StatementProvider.ING_DIBA:
      case StatementProvider.COMDIRECT:
        throw new Error(`Parser for ${provider} is not yet implemented`);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  isProviderSupported(provider: StatementProvider): boolean {
    try {
      this.getParser(provider);
      return true;
    } catch {
      return false;
    }
  }
  
  getSupportedProviders(): StatementProvider[] {
    return [StatementProvider.TRADE_REPUBLIC];
  }
}