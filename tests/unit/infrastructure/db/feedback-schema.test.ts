import { describe, it, expect, beforeAll } from 'vitest'
import { initDb, resetDbForTesting } from '@/infrastructure/db/index'
import type { PGlite } from '@electric-sql/pglite'

describe('DB feedback_reports table', () => {
  let db: PGlite

  beforeAll(async () => {
    resetDbForTesting()
    db = await initDb()
  })

  it('creates feedback_reports table (empty initially)', async () => {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM feedback_reports'
    )
    expect(Number(result.rows[0].count)).toBe(0)
  })

  it('accepts a row with all required fields', async () => {
    await db.query(
      `INSERT INTO feedback_reports
        (company_id, original_name, proposed_name, expected_name, description, had_attachment, github_issue_url, github_issue_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['AXA', 'orig.pdf', 'prop.pdf', 'expected.pdf', 'test desc', false, 'https://github.com/issues/1', 1]
    )
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM feedback_reports'
    )
    expect(Number(result.rows[0].count)).toBe(1)
  })

  it('stores had_attachment and github_issue_number correctly', async () => {
    const result = await db.query<{
      had_attachment: boolean
      github_issue_number: number
    }>('SELECT had_attachment, github_issue_number FROM feedback_reports LIMIT 1')
    expect(result.rows[0].had_attachment).toBe(false)
    expect(result.rows[0].github_issue_number).toBe(1)
  })
})
