import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreviewTable } from '@/adapters/pdf-renaming/components/PreviewTable'
import { useDropZoneStore } from '@/adapters/pdf-renaming/store/dropZoneStore'
import type { PreviewRow } from '@/adapters/pdf-renaming/store/dropZoneStore'

const mockRow = (overrides: Partial<PreviewRow> = {}): PreviewRow => ({
  file: new File(['%PDF'], 'original.pdf', { type: 'application/pdf' }),
  parsedInvoice: {
    companyId: 'INTERPARTNER',
    invoiceNumber: '2024001',
    date: '2024-01-01',
    amount: 100,
    firstName: 'JOSE',
    lastName: 'GARCIA',
    rawText: 'raw',
    confidence: 'high',
  },
  proposedName: '2024-01-01 FRA. 2024001 GARCIA, JOSE',
  finalName: '2024-01-01 FRA. 2024001 GARCIA, JOSE',
  hasOverride: false,
  ...overrides,
})

const onConfirm = vi.fn()

describe('PreviewTable', () => {
  beforeEach(() => {
    useDropZoneStore.getState().reset()
    onConfirm.mockReset()
  })

  it('shows empty state message when no rows', () => {
    render(<PreviewTable rows={[]} onConfirm={onConfirm} />)
    expect(screen.getByText(/no files|drop files/i)).toBeInTheDocument()
  })

  it('renders a row with original and proposed name', () => {
    const rows = [mockRow()]
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    expect(screen.getByText('original.pdf')).toBeInTheDocument()
    // Final name is in the override input
    expect(screen.getByDisplayValue('2024-01-01 FRA. 2024001 GARCIA, JOSE')).toBeInTheDocument()
  })

  it('confirm button is not present when no rows (empty state shown)', () => {
    render(<PreviewTable rows={[]} onConfirm={onConfirm} />)
    expect(screen.queryByRole('button', { name: /confirm|write/i })).not.toBeInTheDocument()
  })

  it('confirm button is enabled when rows exist', () => {
    const rows = [mockRow()]
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    expect(screen.getByRole('button', { name: /confirm|write/i })).not.toBeDisabled()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const rows = [mockRow()]
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: /confirm|write/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders an input for overriding the final name', () => {
    const rows = [mockRow()]
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('dispatches store update on override input change', () => {
    const rows = [mockRow()]
    useDropZoneStore.setState({ previewRows: rows })
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'custom-name.pdf' } })
    expect(useDropZoneStore.getState().previewRows[0].finalName).toBe('custom-name.pdf')
    expect(useDropZoneStore.getState().previewRows[0].hasOverride).toBe(true)
  })

  it('shows company name in the row', () => {
    const rows = [mockRow()]
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    expect(screen.getByText(/INTERPARTNER/)).toBeInTheDocument()
  })

  it('shows override badge when row has override', () => {
    const rows = [mockRow({ hasOverride: true })]
    render(<PreviewTable rows={rows} onConfirm={onConfirm} />)
    expect(screen.getByText(/override/i)).toBeInTheDocument()
  })

  it('flags row for manual override when confidence is low', () => {
    const lowConfRow = mockRow({
      parsedInvoice: {
        companyId: 'INTERPARTNER',
        invoiceNumber: null,
        date: null,
        amount: null,
        firstName: null,
        lastName: null,
        rawText: 'raw',
        confidence: 'low',
      },
      proposedName: 'original.pdf',
      finalName: 'original.pdf',
    })
    render(<PreviewTable rows={[lowConfRow]} onConfirm={onConfirm} />)
    // The row should show a visual indicator that manual review/override is needed
    expect(screen.getByText(/manual|review|low/i)).toBeInTheDocument()
  })

  it('flags stub row with visual indicator', () => {
    const stubRow = mockRow({
      parsedInvoice: {
        companyId: 'INTERPARTNER',
        invoiceNumber: null,
        date: null,
        amount: null,
        firstName: null,
        lastName: null,
        rawText: 'raw',
        confidence: 'stub',
      },
      proposedName: 'original.pdf',
      finalName: 'original.pdf',
    })
    render(<PreviewTable rows={[stubRow]} onConfirm={onConfirm} />)
    expect(screen.getByText(/manual|review|stub/i)).toBeInTheDocument()
  })
})
