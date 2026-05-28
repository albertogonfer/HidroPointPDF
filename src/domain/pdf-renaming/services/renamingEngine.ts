import type { ParsedInvoice } from '../model/types'
import { stripAccents } from './stripAccents'
import { interpolateTemplate } from './templateInterpolator'

/**
 * Applies a naming template to a ParsedInvoice, stripping accents from the final result.
 * Returns a clean filename-safe string (accents removed).
 */
export function applyTemplate(invoice: ParsedInvoice, template: string): string {
  const interpolated = interpolateTemplate(template, invoice)
  return stripAccents(interpolated)
}
