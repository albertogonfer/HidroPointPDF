import { getDb } from '../db/index'
import type { CompanyId } from '@/domain/pdf-renaming/model/types.ts'

const MONTH_NAMES: Record<string, string> = {
  '01': 'ENERO',
  '02': 'FEBRERO',
  '03': 'MARZO',
  '04': 'ABRIL',
  '05': 'MAYO',
  '06': 'JUNIO',
  '07': 'JULIO',
  '08': 'AGOSTO',
  '09': 'SEPTIEMBRE',
  '10': 'OCTUBRE',
  '11': 'NOVIEMBRE',
  '12': 'DICIEMBRE',
}

/**
 * Given a companyId and an ISO date string (YYYY-MM-DD or YYYY-MM),
 * returns the relative folder path parts: [prefix + name, year, month + name].
 */
export async function resolveFolder(companyId: CompanyId, date: string): Promise<string[]> {
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid date: date must be a non-empty string.')
  }

  // Accept YYYY-MM-DD or YYYY-MM
  const match = date.match(/^(\d{4})-(\d{2})/)
  if (!match) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM or YYYY-MM-DD.`)
  }

  const year = match[1]
  const month = match[2]
  const monthName = MONTH_NAMES[month]
  if (!monthName) {
    throw new Error(`Invalid date: month "${month}" is out of range.`)
  }

  const db = getDb()
  const result = await db.query<{ folder_prefix: string; name: string }>(
    `SELECT folder_prefix, name FROM companies WHERE id = $1 LIMIT 1`,
    [companyId],
  )

  if (!result.rows.length) {
    throw new Error(`Company not found: "${companyId}" is unknown in the database.`)
  }

  const { folder_prefix, name } = result.rows[0]

  return [`${folder_prefix} ${name}`, year, `${month} ${monthName}`]
}
