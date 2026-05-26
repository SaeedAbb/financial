/**
 * Supported file formats for statement / transaction-export import.
 *
 * - PDF: parsed by the backend AI service (Gemini). Slow-ish, costs API
 *   credits, works for any provider that supplies a PDF statement.
 * - CSV: parsed deterministically by the backend. Fast and free, but only
 *   available for providers that publish a structured transaction export
 *   (currently Trade Republic).
 */
export enum ImportFormat {
  PDF = 'PDF',
  CSV = 'CSV'
}

export interface ImportFormatInfo {
  id: ImportFormat;
  displayName: string;
  description: string;
  icon: string;
  fileExtension: string;
  acceptedMimeTypes: string;
}

export const IMPORT_FORMAT_INFO: Record<ImportFormat, ImportFormatInfo> = {
  [ImportFormat.PDF]: {
    id: ImportFormat.PDF,
    displayName: 'PDF Statement (AI)',
    description: 'Upload your account statement PDF. Transactions are extracted automatically using AI.',
    icon: 'pi pi-file-pdf',
    fileExtension: '.pdf',
    acceptedMimeTypes: 'application/pdf'
  },
  [ImportFormat.CSV]: {
    id: ImportFormat.CSV,
    displayName: 'CSV Transaction Export',
    description: 'Upload your Trade Republic "Transaktionsexport" CSV. Parsed instantly without AI.',
    icon: 'pi pi-file',
    fileExtension: '.csv',
    acceptedMimeTypes: 'text/csv'
  }
};
