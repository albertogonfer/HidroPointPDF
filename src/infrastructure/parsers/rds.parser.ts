import type { InvoiceParser, ParsedInvoice } from '../../domain/pdf-renaming/model/types'

/**
 * RDS parser.
 */
export const rdsParser: InvoiceParser = {
  companyId: 'RDS',

  extract(pdfText: string): ParsedInvoice {
    const invoiceNumber = extractInvoiceNumber(pdfText)
    const date = extractDate(pdfText)
    const amount = extractAmount(pdfText)
    const { firstName, lastName } = extractName(pdfText)

    return {
      companyId: 'RDS',
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
  const match = text.match(/(?:Nº?\s*(?:FACTURA|REFERENCIA|REF)\.?\s*:?\s*)([\w/-]+)/i)
  if (match) return match[1].trim()
  const altMatch = text.match(/(?:REF\.?\s*:?\s*)([\w/-]+)/i)
  return altMatch ? altMatch[1].trim() : null
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
  const match = text.match(/(?:CLIENTE|ASEGURADO)\s*:?\s*([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)/i)
  if (match) return { firstName: match[1], lastName: match[2] }
  return { firstName: null, lastName: null }
}
