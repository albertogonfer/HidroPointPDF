import { describe, it, expect, beforeAll } from 'vitest'
import { initDb, resetDbForTesting } from '@/infrastructure/db/index'
import type { PGlite } from '@electric-sql/pglite'

describe('DB initialization', () => {
  let db: PGlite

  beforeAll(async () => {
    resetDbForTesting()
    db = await initDb()
  })

  it('initializes without errors', () => {
    expect(db).toBeDefined()
  })

  it('seeds all 7 companies', async () => {
    const result = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM companies')
    expect(Number(result.rows[0].count)).toBe(7)
  })

  it('seeds companies with expected IDs', async () => {
    const result = await db.query<{ id: string }>('SELECT id FROM companies ORDER BY id')
    const ids = result.rows.map((r) => r.id)
    expect(ids).toEqual(['AXA', 'GENERALI', 'INTERPARTNER', 'IRIS', 'ISERVIS', 'RDS', 'SANTA_LUCIA'])
  })

  it('seeds at least one renaming_rule per company', async () => {
    const result = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM renaming_rules')
    expect(Number(result.rows[0].count)).toBeGreaterThanOrEqual(7)
  })

  it('creates rename_jobs table (empty initially)', async () => {
    const result = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM rename_jobs')
    expect(Number(result.rows[0].count)).toBe(0)
  })

  it('creates invoice_registrations table (empty initially)', async () => {
    const result = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM invoice_registrations')
    expect(Number(result.rows[0].count)).toBe(0)
  })
})
