import type { ParsedInvoice } from '../model/types'

const TOKEN_MAP: Record<string, keyof ParsedInvoice> = {
  date: 'date',
  invoiceNumber: 'invoiceNumber',
  lastName: 'lastName',
  firstName: 'firstName',
  amount: 'amount',
}

/**
 * Replaces {token} placeholders in a template string with values from a ParsedInvoice.
 * Missing (null) fields are replaced with empty string. Unknown tokens are left as-is.
 */
export function interpolateTemplate(template: string, invoice: ParsedInvoice): string {
  return template.replace(/\{(\w+)\}/g, (_match, token: string) => {
    if (token in TOKEN_MAP) {
      const field = TOKEN_MAP[token]
      const value = invoice[field]
      if (value === null || value === undefined) return ''
      return String(value)
    }
    return _match
  })
}
