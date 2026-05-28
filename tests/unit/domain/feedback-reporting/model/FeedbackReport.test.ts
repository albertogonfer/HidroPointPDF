import { describe, it, expect } from 'vitest'
import { validateFeedbackInput } from '@/domain/feedback-reporting/model/FeedbackReport'
import type { FeedbackInput } from '@/domain/feedback-reporting/model/FeedbackReport'

const validInput: FeedbackInput = {
  companyId: 'AXA',
  originalName: 'original.pdf',
  proposedName: 'proposed.pdf',
  expectedName: 'expected.pdf',
  description: 'The parser got it wrong',
}

describe('validateFeedbackInput', () => {
  it('returns no errors for a valid input without file', () => {
    const errors = validateFeedbackInput(validInput)
    expect(errors).toEqual([])
  })

  it('returns error when description is empty', () => {
    const errors = validateFeedbackInput({ ...validInput, description: '' })
    expect(errors).toContain('description')
  })

  it('returns error when description is whitespace only', () => {
    const errors = validateFeedbackInput({ ...validInput, description: '   ' })
    expect(errors).toContain('description')
  })

  it('returns error when expectedName is empty', () => {
    const errors = validateFeedbackInput({ ...validInput, expectedName: '' })
    expect(errors).toContain('expectedName')
  })

  it('returns error when companyId is empty', () => {
    const errors = validateFeedbackInput({ ...validInput, companyId: '' })
    expect(errors).toContain('companyId')
  })

  it('returns error when originalName is empty', () => {
    const errors = validateFeedbackInput({ ...validInput, originalName: '' })
    expect(errors).toContain('originalName')
  })

  it('returns multiple errors when several required fields are missing', () => {
    const errors = validateFeedbackInput({
      ...validInput,
      description: '',
      expectedName: '',
    })
    expect(errors).toContain('description')
    expect(errors).toContain('expectedName')
    expect(errors).toHaveLength(2)
  })

  it('accepts a file under 3MB', () => {
    const smallFile = new File(['x'.repeat(1024)], 'test.pdf', { type: 'application/pdf' })
    const errors = validateFeedbackInput({ ...validInput, file: smallFile })
    expect(errors).toEqual([])
  })

  it('rejects a file over 3MB', () => {
    // 3MB + 1 byte
    const bigContent = new Uint8Array(3 * 1024 * 1024 + 1)
    const bigFile = new File([bigContent], 'big.pdf', { type: 'application/pdf' })
    const errors = validateFeedbackInput({ ...validInput, file: bigFile })
    expect(errors).toContain('file')
  })
})
