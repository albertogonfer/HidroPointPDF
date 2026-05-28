import { getDb } from '@/infrastructure/db/index'
import type { IFeedbackRepository } from '@/domain/feedback-reporting/ports/IFeedbackRepository'
import type { FeedbackReport } from '@/domain/feedback-reporting/model/FeedbackReport'

export class PGliteFeedbackRepository implements IFeedbackRepository {
  async save(report: FeedbackReport): Promise<void> {
    const db = getDb()
    await db.query(
      `INSERT INTO feedback_reports (
        company_id,
        original_name,
        proposed_name,
        expected_name,
        description,
        had_attachment,
        github_issue_url,
        github_issue_number,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        report.companyId,
        report.originalName,
        report.proposedName,
        report.expectedName,
        report.description,
        report.hadAttachment,
        report.githubIssueUrl,
        report.githubIssueNumber,
        report.createdAt.toISOString(),
      ]
    )
  }
}
