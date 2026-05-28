import type { InvoiceParser, ParsedInvoice } from '../../domain/pdf-renaming/model/types'

/**
 * INTERPARTNER parser.
 * Extracts invoice number (Nº EXP format), date, and amount from PDF text.
 * Expected patterns:
 *   - Invoice: "Nº EXP: 2024/0123" or "EXP: 2024/0123"
 *   - Date: "15/03/2024" or "2024-03-15"
 *   - Amount: "1.250,50 €" or "1250.50"
 */
export const interpartnerParser: InvoiceParser = {
  companyId: 'INTERPARTNER',

  extract(pdfText: string): ParsedInvoice {
    const invoiceNumber = extractInvoiceNumber(pdfText)
    const date = extractDate(pdfText)
    const amount = extractAmount(pdfText)
    const { firstName, lastName } = extractName(pdfText)

    return {
      companyId: 'INTERPARTNER',
      invoiceNumber,
      date,
      amount,
      firstName,
      lastName,
      rawText: pdfText,
      confidence: invoiceNumber ? 'high' : 'low',
    }
  },
}

function extractInvoiceNumber(text: string): string | null {
  const match = text.match(/N[ºo°]?\s*EXP\.?\s*:?\s*([\w/-]+)/i)
  return match ? match[1].trim() : null
}

function extractDate(text: string): string | null {
  // Try DD/MM/YYYY
  const dmyMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
  }
  // Try ISO format
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]
  return null
}

function extractAmount(text: string): number | null {
  // European format: 1.250,50 or 1250,50
  const euroMatch = text.match(/(\d{1,3}(?:\.\d{3})*),(\d{2})\s*€/)
  if (euroMatch) {
    const cleaned = euroMatch[1].replace(/\./g, '') + '.' + euroMatch[2]
    return parseFloat(cleaned)
  }
  // Decimal dot format
  const dotMatch = text.match(/(\d+\.\d{2})\s*€/)
  if (dotMatch) return parseFloat(dotMatch[1])
  return null
}

function extractName(text: string): { firstName: string | null; lastName: string | null } {
  const match = text.match(/(?:ASEGURADO|CLIENTE|SR\.?|SRA\.?|D\.?|Da\.?)\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)/i)
  if (match) {
    return { firstName: match[1], lastName: match[2] }
  }
  return { firstName: null, lastName: null }
}
