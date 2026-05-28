import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { createTestI18n } from '../../../helpers/i18nForTests'

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

function renderForm(lng: 'es' | 'en' = 'es') {
  const i18n = createTestI18n(lng)
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <FeedbackForm
          companyId="HIDROPOINT"
          originalName="factura.pdf"
          proposedName="2024-01-01 FRA.pdf"
          expectedName="2024-01-01 FRA. 001 HIDROPOINT.pdf"
        />
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('FeedbackForm i18n', () => {
  beforeEach(() => {
    useFeedbackStore.getState().reset()
    mockSubmitFeedback.mockReset()
    mockSubmitFeedback.mockResolvedValue({ issueUrl: 'https://github.com/org/repo/issues/5', issueNumber: 5 })
  })

  it('renders Spanish description label', () => {
    renderForm('es')
    expect(screen.getByText('Descripción del error')).toBeInTheDocument()
  })

  it('renders English description label', () => {
    renderForm('en')
    expect(screen.getByText('Error description')).toBeInTheDocument()
  })

  it('renders Spanish submit button', () => {
    renderForm('es')
    expect(screen.getByRole('button', { name: /enviar reporte/i })).toBeInTheDocument()
  })

  it('renders English submit button', () => {
    renderForm('en')
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument()
  })

  it('shows translated success banner with Trans link in Spanish', async () => {
    renderForm('es')

    fireEvent.change(screen.getByRole('textbox', { name: /descripción del error/i }), {
      target: { value: 'El nombre está mal' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar reporte/i }))

    await waitFor(() => {
      expect(screen.getByText(/reporte enviado/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /ver issue/i })).toHaveAttribute('href', 'https://github.com/org/repo/issues/5')
    })
  })

  it('shows translated file size error in Spanish', async () => {
    renderForm('es')
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(screen.getByTestId('file-input')).toBeInTheDocument())

    const bigFile = new File([new ArrayBuffer(4 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [bigFile] } })

    await waitFor(() => {
      expect(screen.getByText(/excede.*3 MB/i)).toBeInTheDocument()
    })
  })
})
