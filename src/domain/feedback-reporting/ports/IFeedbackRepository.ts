import type { FeedbackReport } from '../model/FeedbackReport'

export interface IFeedbackRepository {
  save(report: FeedbackReport): Promise<void>
}
