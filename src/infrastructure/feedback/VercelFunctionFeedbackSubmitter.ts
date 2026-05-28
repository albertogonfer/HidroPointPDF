import type { IFeedbackSubmitter } from '@/domain/feedback-reporting/ports/IFeedbackSubmitter'
import type { FeedbackInput } from '@/domain/feedback-reporting/model/FeedbackReport'

export class VercelFunctionFeedbackSubmitter implements IFeedbackSubmitter {
  async submit(input: FeedbackInput): Promise<{ issueUrl: string; issueNumber: number }> {
    const formData = new FormData()
    formData.append('companyId', input.companyId)
    formData.append('originalName', input.originalName)
    formData.append('proposedName', input.proposedName)
    formData.append('expectedName', input.expectedName)
    formData.append('description', input.description)

    if (input.file) {
      formData.append('file', input.file)
    }

    const response = await fetch('/api/feedback', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error ?? 'Feedback submission failed')
    }

    return {
      issueUrl: data.issueUrl,
      issueNumber: data.issueNumber,
    }
  }
}
