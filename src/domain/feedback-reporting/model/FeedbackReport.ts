/** Full feedback report as stored in the local DB */
export type FeedbackReport = {
  companyId: string
  originalName: string
  proposedName: string
  expectedName: string
  description: string
  hadAttachment: boolean
  githubIssueUrl: string
  githubIssueNumber: number
  createdAt: Date
}

/**
 * Input coming from the form — what the user fills in.
 * Does NOT include fields produced by the infrastructure layer.
 */
export type FeedbackInput = Omit<
  FeedbackReport,
  'hadAttachment' | 'githubIssueUrl' | 'githubIssueNumber' | 'createdAt'
> & {
  file?: File
}

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB

/**
 * Validates a FeedbackInput and returns a list of field names that have errors.
 * Returns an empty array when the input is valid.
 */
export function validateFeedbackInput(input: FeedbackInput): string[] {
  const errors: string[] = []

  if (!input.companyId?.trim()) errors.push('companyId')
  if (!input.originalName?.trim()) errors.push('originalName')
  if (!input.expectedName?.trim()) errors.push('expectedName')
  if (!input.description?.trim()) errors.push('description')

  if (input.file && input.file.size > MAX_FILE_SIZE) {
    errors.push('file')
  }

  return errors
}
