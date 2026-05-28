import type { InvoiceParser, ParsedInvoice } from '@/domain/pdf-renaming/model/types.ts'

/**
 * AXA parser — STUB.
 * AXA invoice format is not yet documented. Returns stub with rawText only.
 * All fields null except rawText. confidence: 'stub'.
 */
export const axaParser: InvoiceParser = {
  companyId: 'AXA',

  extract(pdfText: string): ParsedInvoice {
    return {
      companyId: 'AXA',
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
