import type { InvoiceParser, ParsedInvoice } from '../../domain/pdf-renaming/model/types'

/**
 * iServis parser.
 */
export const iservisParser: InvoiceParser = {
  companyId: 'ISERVIS',

  extract(pdfText: string): ParsedInvoice {
    const invoiceNumber = extractInvoiceNumber(pdfText)
    const date = extractDate(pdfText)
    const amount = extractAmount(pdfText)
    const { firstName, lastName } = extractName(pdfText)

    return {
      companyId: 'ISERVIS',
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
  const match = text.match(/(?:Nº?\s*(?:FACTURA|SERVICIO|PEDIDO)\.?\s*:?\s*)([\w/-]+)/i)
  if (match) return match[1].trim()
  const altMatch = text.match(/(?:FACTURA|FAC)\s*\.?\s*:?\s*#?\s*([\w/-]+)/i)
  return altMatch ? altMatch[1].trim() : null
}

function extractDate(text: string): string | null {
  const dmyMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/)
  return isoMatch ? isoMatch[1] : null
}

function extractAmount(text: string): number | null {
  const euroMatch = text.match(/(?:TOTAL|IMPORTE)\s*:?\s*(\d{1,3}(?:\.\d{3})*),(\d{2})\s*€/i)
  if (euroMatch) {
    return parseFloat(euroMatch[1].replace(/\./g, '') + '.' + euroMatch[2])
  }
  const genericEuro = text.match(/(\d{1,3}(?:\.\d{3})*),(\d{2})\s*€/)
  if (genericEuro) {
    return parseFloat(genericEuro[1].replace(/\./g, '') + '.' + genericEuro[2])
  }
  return null
}

function extractName(text: string): { firstName: string | null; lastName: string | null } {
  const match = text.match(/(?:CLIENTE|DESTINATARIO|FACTURAR A)\s*:?\s*([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)/i)
  if (match) return { firstName: match[1], lastName: match[2] }
  return { firstName: null, lastName: null }
}
