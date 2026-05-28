import type { InvoiceParser, ParsedInvoice } from '../../domain/pdf-renaming/model/types'

/**
 * SANTA LUCIA parser.
 * Extracts invoice number, date, amount from SANTA LUCIA S.A. invoices.
 * Expected patterns vary — uses broad heuristics.
 */
export const santaLuciaParser: InvoiceParser = {
  companyId: 'SANTA_LUCIA',

  extract(pdfText: string): ParsedInvoice {
    const invoiceNumber = extractInvoiceNumber(pdfText)
    const date = extractDate(pdfText)
    const amount = extractAmount(pdfText)
    const { firstName, lastName } = extractName(pdfText)

    return {
      companyId: 'SANTA_LUCIA',
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
  const match = text.match(/(?:Nº?\s*(?:FACTURA|RECIBO|POLIZA|PÓLIZA)\.?\s*:?\s*)([\w/-]+)/i)
  if (match) return match[1].trim()
  const simpleMatch = text.match(/(?:FACTURA|RECIBO)\s+N[ºo]?\s*:?\s*([\w/-]+)/i)
  return simpleMatch ? simpleMatch[1].trim() : null
}

function extractDate(text: string): string | null {
  const dmyMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/)
  return isoMatch ? isoMatch[1] : null
}

function extractAmount(text: string): number | null {
  const euroMatch = text.match(/(\d{1,3}(?:\.\d{3})*),(\d{2})\s*€/)
  if (euroMatch) {
    return parseFloat(euroMatch[1].replace(/\./g, '') + '.' + euroMatch[2])
  }
  const dotMatch = text.match(/(\d+\.\d{2})\s*€/)
  return dotMatch ? parseFloat(dotMatch[1]) : null
}

function extractName(text: string): { firstName: string | null; lastName: string | null } {
  const match = text.match(/(?:TOMADOR|ASEGURADO|CLIENTE)\s*:?\s*([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)/i)
  if (match) return { firstName: match[1], lastName: match[2] }
  return { firstName: null, lastName: null }
}
