import { describe, it, expect, beforeEach } from 'vitest'
import { initDb, resetDbForTesting } from '@/infrastructure/db/index'
import { PGliteFeedbackRepository } from '@/infrastructure/db/PGliteFeedbackRepository'
import type { FeedbackReport } from '@/domain/feedback-reporting/model/FeedbackReport'

const makeReport = (overrides: Partial<FeedbackReport> = {}): FeedbackReport => ({
  companyId: 'HIDROPOINT',
  originalName: 'factura.pdf',
  proposedName: '2024-01-01 FRA. 001.pdf',
  expectedName: '2024-01-01 FRA. 001 HIDROPOINT.pdf',
  description: 'El nombre propuesto está incompleto.',
  hadAttachment: false,
  githubIssueUrl: 'https://github.com/org/repo/issues/42',
  githubIssueNumber: 42,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

describe('PGliteFeedbackRepository', () => {
  beforeEach(async () => {
    resetDbForTesting()
    await initDb()
  })

  it('saves a feedback report without throwing', async () => {
    const repo = new PGliteFeedbackRepository()
    const report = makeReport()
    await expect(repo.save(report)).resolves.toBeUndefined()
  })

  it('saves and retrieves the record from feedback_reports table', async () => {
    const repo = new PGliteFeedbackRepository()
    const report = makeReport()
    await repo.save(report)

    const { getDb } = await import('@/infrastructure/db/index')
    const db = getDb()
    const result = await db.query<{ company_id: string; description: string; github_issue_number: number }>(
      'SELECT company_id, description, github_issue_number FROM feedback_reports WHERE company_id = $1',
      ['HIDROPOINT']
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].company_id).toBe('HIDROPOINT')
    expect(result.rows[0].description).toBe('El nombre propuesto está incompleto.')
    expect(result.rows[0].github_issue_number).toBe(42)
  })

  it('saves had_attachment flag correctly', async () => {
    const repo = new PGliteFeedbackRepository()
    await repo.save(makeReport({ hadAttachment: true }))

    const { getDb } = await import('@/infrastructure/db/index')
    const db = getDb()
    const result = await db.query<{ had_attachment: boolean }>(
      'SELECT had_attachment FROM feedback_reports WHERE company_id = $1',
      ['HIDROPOINT']
    )
    expect(result.rows[0].had_attachment).toBe(true)
  })
})
