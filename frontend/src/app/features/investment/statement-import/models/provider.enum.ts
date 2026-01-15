export enum StatementProvider {
  TRADE_REPUBLIC = 'TRADE_REPUBLIC',
  DEUTSCHE_BANK = 'DEUTSCHE_BANK',
  ING_DIBA = 'ING_DIBA',
  COMDIRECT = 'COMDIRECT'
}

export interface ProviderInfo {
  id: StatementProvider;
  displayName: string;
  code: string;
  supportedFileTypes: string[];
  icon?: string;
}

export const PROVIDER_INFO: Record<StatementProvider, ProviderInfo> = {
  [StatementProvider.TRADE_REPUBLIC]: {
    id: StatementProvider.TRADE_REPUBLIC,
    displayName: 'Trade Republic',
    code: 'TR',
    supportedFileTypes: ['application/pdf'],
    icon: 'pi pi-chart-line'
  },
  [StatementProvider.DEUTSCHE_BANK]: {
    id: StatementProvider.DEUTSCHE_BANK,
    displayName: 'Deutsche Bank',
    code: 'DB',
    supportedFileTypes: ['application/pdf'],
    icon: 'pi pi-building'
  },
  [StatementProvider.ING_DIBA]: {
    id: StatementProvider.ING_DIBA,
    displayName: 'ING DiBa',
    code: 'ING',
    supportedFileTypes: ['application/pdf'],
    icon: 'pi pi-credit-card'
  },
  [StatementProvider.COMDIRECT]: {
    id: StatementProvider.COMDIRECT,
    displayName: 'Comdirect',
    code: 'CDT',
    supportedFileTypes: ['application/pdf'],
    icon: 'pi pi-wallet'
  }
};