import type { CompanyId, InvoiceParser } from '../../domain/pdf-renaming/model/types'
import { interpartnerParser } from './interpartner.parser'
import { santaLuciaParser } from './santa-lucia.parser'
import { irisParser } from './iris.parser'
import { iservisParser } from './iservis.parser'
import { rdsParser } from './rds.parser'
import { axaParser } from './axa.parser'
import { generaliParser } from './generali.parser'

export const parserRegistry: Map<CompanyId, InvoiceParser> = new Map([
  ['INTERPARTNER', interpartnerParser],
  ['SANTA_LUCIA', santaLuciaParser],
  ['IRIS', irisParser],
  ['ISERVIS', iservisParser],
  ['RDS', rdsParser],
  ['AXA', axaParser],
  ['GENERALI', generaliParser],
])

export function getParser(companyId: CompanyId): InvoiceParser | undefined {
  return parserRegistry.get(companyId)
}

/**
 * Heuristic to detect company from raw PDF text.
 * Returns the CompanyId if a known keyword is found, null otherwise.
 */
export function detectCompany(text: string): CompanyId | null {
  const upper = text.toUpperCase()

  if (upper.includes('INTERPARTNER')) return 'INTERPARTNER'
  if (upper.includes('SANTA LUCIA') || upper.includes('SANTA LUCÍA')) return 'SANTA_LUCIA'
  if (upper.includes('IRIS ASSISTANCE') || upper.includes('IRIS GLOBAL') || /\bIRIS\b/.test(upper)) return 'IRIS'
  if (upper.includes('ISERVIS') || upper.includes('ISERVICES')) return 'ISERVIS'
  if (upper.includes('GENERALI')) return 'GENERALI'
  if (upper.includes('AXA')) return 'AXA'
  if (/\bRDS\b/.test(upper)) return 'RDS'

  return null
}
