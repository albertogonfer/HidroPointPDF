import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitFeedback } from '@/application/feedback-reporting/use-cases/submitFeedback'
import type { IFeedbackSubmitter } from '@/domain/feedback-reporting/ports/IFeedbackSubmitter'
import type { IFeedbackRepository } from '@/domain/feedback-reporting/ports/IFeedbackRepository'
import type { FeedbackInput } from '@/domain/feedback-reporting/model/FeedbackReport'

const validInput: FeedbackInput = {
  companyId: 'AXA',
  originalName: 'original.pdf',
  proposedName: 'proposed.pdf',
  expectedName: 'expected.pdf',
  description: 'The parser was wrong',
}

const makeSubmitter = (
  result: { issueUrl: string; issueNumber: number } = { issueUrl: 'https://github.com/org/repo/issues/42', issueNumber: 42 }
): IFeedbackSubmitter => ({
  submit: vi.fn().mockResolvedValue(result),
})

const makeRepository = (): IFeedbackRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
})

describe('submitFeedback use case', () => {
  let submitter: IFeedbackSubmitter
  let repository: IFeedbackRepository

  beforeEach(() => {
    submitter = makeSubmitter()
    repository = makeRepository()
  })

  it('returns issue URL and number on happy path', async () => {
    const result = await submitFeedback(validInput, submitter, repository)

    expect(result.issueUrl).toBe('https://github.com/org/repo/issues/42')
    expect(result.issueNumber).toBe(42)
  })

  it('calls submitter with the input', async () => {
    await submitFeedback(validInput, submitter, repository)

    expect(submitter.submit).toHaveBeenCalledWith(validInput)
    expect(submitter.submit).toHaveBeenCalledTimes(1)
  })

  it('calls repository.save with the full report after successful submit', async () => {
    await submitFeedback(validInput, submitter, repository)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedReport = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(savedReport.companyId).toBe('AXA')
    expect(savedReport.githubIssueUrl).toBe('https://github.com/org/repo/issues/42')
    expect(savedReport.githubIssueNumber).toBe(42)
    expect(savedReport.hadAttachment).toBe(false)
  })

  it('marks hadAttachment true when a file is provided', async () => {
    const inputWithFile: FeedbackInput = {
      ...validInput,
      file: new File(['x'], 'test.pdf'),
    }
    await submitFeedback(inputWithFile, submitter, repository)

    const savedReport = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(savedReport.hadAttachment).toBe(true)
  })

  it('throws a validation error when required fields are missing', async () => {
    const badInput: FeedbackInput = { ...validInput, description: '' }

    await expect(submitFeedback(badInput, submitter, repository)).rejects.toThrow('validation')
    expect(submitter.submit).not.toHaveBeenCalled()
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('re-throws submitter error and does NOT call repository', async () => {
    const failingSubmitter: IFeedbackSubmitter = {
      submit: vi.fn().mockRejectedValue(new Error('GitHub API down')),
    }

    await expect(submitFeedback(validInput, failingSubmitter, repository)).rejects.toThrow('GitHub API down')
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('re-throws repository error after submitter succeeds', async () => {
    const failingRepo: IFeedbackRepository = {
      save: vi.fn().mockRejectedValue(new Error('DB write failed')),
    }

    await expect(submitFeedback(validInput, submitter, failingRepo)).rejects.toThrow('DB write failed')
  })
})
