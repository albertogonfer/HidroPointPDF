import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VercelFunctionFeedbackSubmitter } from '@/infrastructure/feedback/VercelFunctionFeedbackSubmitter'
import type { FeedbackInput } from '@/domain/feedback-reporting/model/FeedbackReport'

const validInput: FeedbackInput = {
  companyId: 'AXA',
  originalName: 'original.pdf',
  proposedName: 'proposed.pdf',
  expectedName: 'expected.pdf',
  description: 'Parser missed the company',
}

const successResponse = {
  issueUrl: 'https://github.com/org/repo/issues/99',
  issueNumber: 99,
}

describe('VercelFunctionFeedbackSubmitter', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('POSTs to /api/feedback and returns issueUrl + issueNumber on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successResponse),
    })

    const submitter = new VercelFunctionFeedbackSubmitter()
    const result = await submitter.submit(validInput)

    expect(result.issueUrl).toBe('https://github.com/org/repo/issues/99')
    expect(result.issueNumber).toBe(99)
  })

  it('calls fetch with POST method and FormData body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successResponse),
    })

    const submitter = new VercelFunctionFeedbackSubmitter()
    await submitter.submit(validInput)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/feedback')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
  })

  it('includes all required fields in the FormData', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successResponse),
    })

    const submitter = new VercelFunctionFeedbackSubmitter()
    await submitter.submit(validInput)

    const formData: FormData = fetchMock.mock.calls[0][1].body
    expect(formData.get('companyId')).toBe('AXA')
    expect(formData.get('originalName')).toBe('original.pdf')
    expect(formData.get('proposedName')).toBe('proposed.pdf')
    expect(formData.get('expectedName')).toBe('expected.pdf')
    expect(formData.get('description')).toBe('Parser missed the company')
  })

  it('appends file to FormData when provided', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(successResponse),
    })

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' })
    const inputWithFile: FeedbackInput = { ...validInput, file }

    const submitter = new VercelFunctionFeedbackSubmitter()
    await submitter.submit(inputWithFile)

    const formData: FormData = fetchMock.mock.calls[0][1].body
    expect(formData.get('file')).toBe(file)
  })

  it('throws when the API returns a non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Internal Server Error' }),
    })

    const submitter = new VercelFunctionFeedbackSubmitter()
    await expect(submitter.submit(validInput)).rejects.toThrow('Internal Server Error')
  })

  it('throws when fetch itself rejects (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('Network failure'))

    const submitter = new VercelFunctionFeedbackSubmitter()
    await expect(submitter.submit(validInput)).rejects.toThrow('Network failure')
  })
})
