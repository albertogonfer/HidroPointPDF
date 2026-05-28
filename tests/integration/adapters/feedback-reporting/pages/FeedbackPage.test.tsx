import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/adapters/feedback-reporting/components/FeedbackForm', () => ({
  FeedbackForm: (props: Record<string, string>) => (
    <div data-testid="feedback-form" data-props={JSON.stringify(props)} />
  ),
}))

import FeedbackPage from '@/adapters/feedback-reporting/pages/FeedbackPage'

function renderPage(queryString: string) {
  return render(
    <MemoryRouter initialEntries={[`/feedback?${queryString}`]}>
      <Routes>
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FeedbackPage', () => {
  it('renders a page heading', () => {
    renderPage('companyId=HIDROPOINT&originalName=f.pdf&proposedName=p.pdf&expectedName=e.pdf')
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('pre-fills FeedbackForm with query params', () => {
    renderPage('companyId=HIDROPOINT&originalName=factura.pdf&proposedName=2024-01.pdf&expectedName=correcto.pdf')
    const form = screen.getByTestId('feedback-form')
    const props = JSON.parse(form.getAttribute('data-props') ?? '{}')
    expect(props.companyId).toBe('HIDROPOINT')
    expect(props.originalName).toBe('factura.pdf')
    expect(props.proposedName).toBe('2024-01.pdf')
    expect(props.expectedName).toBe('correcto.pdf')
  })
})
