import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

function renderTable(rows: PreviewRow[]) {
  return render(
    <MemoryRouter>
      <PreviewTable rows={rows} onConfirm={onConfirm} />
    </MemoryRouter>
  )
}

describe('PreviewTable', () => {
  beforeEach(() => {
    useDropZoneStore.getState().reset()
    onConfirm.mockReset()
  })

  it('shows empty state message when no rows', () => {
    render(
      <MemoryRouter>
        <PreviewTable rows={[]} onConfirm={onConfirm} />
      </MemoryRouter>
    )
    expect(screen.getByText(/no files|drop files|sin archivos/i)).toBeInTheDocument()
  })

  it('renders a row with original and proposed name', () => {
    renderTable([mockRow()])
    expect(screen.getByText('original.pdf')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-01 FRA. 2024001 GARCIA, JOSE')).toBeInTheDocument()
  })

  it('confirm button is not present when no rows (empty state shown)', () => {
    render(
      <MemoryRouter>
        <PreviewTable rows={[]} onConfirm={onConfirm} />
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: /confirm|write|escribir/i })).not.toBeInTheDocument()
  })

  it('confirm button is enabled when rows exist', () => {
    renderTable([mockRow()])
    expect(screen.getByRole('button', { name: /confirm|write|escribir/i })).not.toBeDisabled()
  })

  it('calls onConfirm when confirm button clicked', () => {
    renderTable([mockRow()])
    fireEvent.click(screen.getByRole('button', { name: /confirm|write|escribir/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders an input for overriding the final name', () => {
    renderTable([mockRow()])
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('dispatches store update on override input change', () => {
    const rows = [mockRow()]
    useDropZoneStore.setState({ previewRows: rows })
    renderTable(rows)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'custom-name.pdf' } })
    expect(useDropZoneStore.getState().previewRows[0].finalName).toBe('custom-name.pdf')
    expect(useDropZoneStore.getState().previewRows[0].hasOverride).toBe(true)
  })

  it('shows company name in the row', () => {
    renderTable([mockRow()])
    expect(screen.getByText(/INTERPARTNER/)).toBeInTheDocument()
  })

  it('shows override badge when row has override', () => {
    renderTable([mockRow({ hasOverride: true })])
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
    renderTable([lowConfRow])
    expect(screen.getByText(/manual|review|low|baja/i)).toBeInTheDocument()
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
    renderTable([stubRow])
    expect(screen.getByText(/manual|review|stub.*revisar/i)).toBeInTheDocument()
  })

  it('"Reportar problema" link appears only on override rows', () => {
    const overrideRow = mockRow({ hasOverride: true })
    const normalRow = mockRow({ hasOverride: false })
    renderTable([overrideRow, normalRow])
    const links = screen.getAllByText(/reportar problema/i)
    expect(links).toHaveLength(1)
  })

  it('"Reportar problema" link contains correct query params', () => {
    const row = mockRow({
      hasOverride: true,
      finalName: '2024-01-01 FRA. 2024001 GARCIA, JOSE',
    })
    renderTable([row])
    const link = screen.getByText(/reportar problema/i).closest('a')
    expect(link).not.toBeNull()
    const href = link?.getAttribute('href') ?? ''
    expect(href).toMatch(/companyId=INTERPARTNER/)
    expect(href).toMatch(/originalName=/)
    expect(href).toMatch(/proposedName=/)
    expect(href).toMatch(/expectedName=/)
  })
})
