import type { FeedbackInput } from '../model/FeedbackReport'

export interface IFeedbackSubmitter {
  submit(input: FeedbackInput): Promise<{ issueUrl: string; issueNumber: number }>
}
