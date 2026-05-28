import type { InvoiceParser, ParsedInvoice } from '../../domain/pdf-renaming/model/types'

/**
 * GENERALI parser — STUB.
 * GENERALI invoice format is not yet documented. Returns stub with rawText only.
 * All fields null except rawText. confidence: 'stub'.
 */
export const generaliParser: InvoiceParser = {
  companyId: 'GENERALI',

  extract(pdfText: string): ParsedInvoice {
    return {
      companyId: 'GENERALI',
      invoiceNumber: null,
      date: null,
      amount: null,
      firstName: null,
      lastName: null,
      rawText: pdfText,
      confidence: 'stub',
    }
  },
}
