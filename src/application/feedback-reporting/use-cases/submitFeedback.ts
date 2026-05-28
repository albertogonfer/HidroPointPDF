import { validateFeedbackInput } from '@/domain/feedback-reporting/model/FeedbackReport'
import type { FeedbackInput, FeedbackReport } from '@/domain/feedback-reporting/model/FeedbackReport'
import type { IFeedbackSubmitter } from '@/domain/feedback-reporting/ports/IFeedbackSubmitter'
import type { IFeedbackRepository } from '@/domain/feedback-reporting/ports/IFeedbackRepository'

export async function submitFeedback(
  input: FeedbackInput,
  submitter: IFeedbackSubmitter,
  repository: IFeedbackRepository
): Promise<{ issueUrl: string; issueNumber: number }> {
  const errors = validateFeedbackInput(input)
  if (errors.length > 0) {
    throw new Error(`validation: required fields missing — ${errors.join(', ')}`)
  }

  const { issueUrl, issueNumber } = await submitter.submit(input)

  const report: FeedbackReport = {
    companyId: input.companyId,
    originalName: input.originalName,
    proposedName: input.proposedName,
    expectedName: input.expectedName,
    description: input.description,
    hadAttachment: !!input.file,
    githubIssueUrl: issueUrl,
    githubIssueNumber: issueNumber,
    createdAt: new Date(),
  }

  await repository.save(report)

  return { issueUrl, issueNumber }
}
