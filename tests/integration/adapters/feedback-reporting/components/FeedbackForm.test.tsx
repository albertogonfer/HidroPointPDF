import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock the use-case and its dependencies before importing the component
vi.mock('@/infrastructure/feedback/VercelFunctionFeedbackSubmitter', () => ({
  VercelFunctionFeedbackSubmitter: vi.fn().mockImplementation(() => ({
    submit: vi.fn().mockResolvedValue({ issueUrl: 'https://github.com/org/repo/issues/1', issueNumber: 1 }),
  })),
}))

vi.mock('@/infrastructure/db/PGliteFeedbackRepository', () => ({
  PGliteFeedbackRepository: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@/application/feedback-reporting/use-cases/submitFeedback', () => ({
  submitFeedback: vi.fn(),
}))

import { FeedbackForm } from '@/adapters/feedback-reporting/components/FeedbackForm'
import { useFeedbackStore } from '@/adapters/feedback-reporting/store/feedbackStore'
import { submitFeedback } from '@/application/feedback-reporting/use-cases/submitFeedback'

const mockSubmitFeedback = vi.mocked(submitFeedback)

interface FeedbackFormProps {
  companyId: string
  originalName: string
  proposedName: string
  expectedName: string
}

function renderForm(props: Partial<FeedbackFormProps> = {}) {
  const defaultProps: FeedbackFormProps = {
    companyId: 'HIDROPOINT',
    originalName: 'factura.pdf',
    proposedName: '2024-01-01 FRA.pdf',
    expectedName: '2024-01-01 FRA. 001 HIDROPOINT.pdf',
    ...props,
  }
  return render(
    <MemoryRouter>
      <FeedbackForm {...defaultProps} />
    </MemoryRouter>
  )
}

describe('FeedbackForm', () => {
  beforeEach(() => {
    useFeedbackStore.getState().reset()
    mockSubmitFeedback.mockReset()
    mockSubmitFeedback.mockResolvedValue({ issueUrl: 'https://github.com/org/repo/issues/1', issueNumber: 1 })
  })

  it('renders description textarea', () => {
    renderForm()
    expect(screen.getByRole('textbox', { name: /descripción|description/i })).toBeInTheDocument()
  })

  it('renders expectedName input pre-filled from props', () => {
    renderForm({ expectedName: 'nombre-correcto.pdf' })
    expect(screen.getByDisplayValue('nombre-correcto.pdf')).toBeInTheDocument()
  })

  it('does not show file input when consent checkbox is unchecked', () => {
    renderForm()
    expect(screen.queryByTestId('file-input')).not.toBeInTheDocument()
  })

  it('shows file input after checking consent checkbox', async () => {
    renderForm()
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
    })
  })

  it('shows inline error when file exceeds 3MB', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(screen.getByTestId('file-input')).toBeInTheDocument())

    // Create a file > 3MB
    const bigFile = new File([new ArrayBuffer(4 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [bigFile] } })

    await waitFor(() => {
      expect(screen.getByText(/excede|demasiado grande/i)).toBeInTheDocument()
    })
  })

  it('submit button is disabled while submitting', async () => {
    // Set store to submitting state
    useFeedbackStore.getState().setSubmitting()
    renderForm()
    const submitBtn = screen.getByRole('button', { name: /enviar|submit|enviando/i })
    expect(submitBtn).toBeDisabled()
  })

  it('shows success banner with issue link after successful submission', async () => {
    mockSubmitFeedback.mockResolvedValue({ issueUrl: 'https://github.com/org/repo/issues/5', issueNumber: 5 })
    renderForm()

    fireEvent.change(screen.getByRole('textbox', { name: /descripción|description/i }), {
      target: { value: 'El nombre está mal' },
    })

    fireEvent.click(screen.getByRole('button', { name: /enviar reporte|submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/reporte enviado/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /ver issue/i })).toHaveAttribute('href', 'https://github.com/org/repo/issues/5')
    })
  })

  it('shows error banner with Spanish message on failure', async () => {
    mockSubmitFeedback.mockRejectedValue(new Error('Network error'))
    renderForm()

    fireEvent.change(screen.getByRole('textbox', { name: /descripción|description/i }), {
      target: { value: 'El nombre está mal' },
    })

    fireEvent.click(screen.getByRole('button', { name: /enviar reporte|submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
