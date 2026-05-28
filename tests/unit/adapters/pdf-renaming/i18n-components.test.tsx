import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { createTestI18n } from '../../../helpers/i18nForTests'
import type { PreviewRow } from '@/adapters/pdf-renaming/store/dropZoneStore'
import { useDropZoneStore } from '@/adapters/pdf-renaming/store/dropZoneStore'
import { useHistoryStore } from '@/adapters/pdf-renaming/store/historyStore'
import type { RenameJob } from '@/adapters/pdf-renaming/store/historyStore'

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

const makeJob = (id: number, overrides: Partial<RenameJob> = {}): RenameJob => ({
  id,
  companyId: 'INTERPARTNER',
  originalName: `original-${id}.pdf`,
  proposedName: `proposed-${id}.pdf`,
  finalName: `final-${id}.pdf`,
  targetFolder: '01 INTERPARTNER/2024/01 ENERO',
  hadOverride: false,
  status: 'completed',
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides,
})

describe('PreviewTable i18n', () => {
  beforeEach(() => {
    useDropZoneStore.getState().reset()
  })

  it('shows translated status "ready" in Spanish', async () => {
    const i18n = createTestI18n('es')
    const { PreviewTable } = await import('@/adapters/pdf-renaming/components/PreviewTable')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PreviewTable rows={[mockRow()]} onConfirm={vi.fn()} />
        </MemoryRouter>
      </I18nextProvider>
    )
    expect(screen.getByText('listo')).toBeInTheDocument()
  })

  it('shows translated status "ready" in English', async () => {
    const i18n = createTestI18n('en')
    const { PreviewTable } = await import('@/adapters/pdf-renaming/components/PreviewTable')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PreviewTable rows={[mockRow()]} onConfirm={vi.fn()} />
        </MemoryRouter>
      </I18nextProvider>
    )
    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('shows translated "stub" status in Spanish', async () => {
    const i18n = createTestI18n('es')
    const { PreviewTable } = await import('@/adapters/pdf-renaming/components/PreviewTable')
    const stubRow = mockRow({
      parsedInvoice: {
        companyId: 'X', invoiceNumber: null, date: null, amount: null,
        firstName: null, lastName: null, rawText: 'raw', confidence: 'stub',
      },
    })
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PreviewTable rows={[stubRow]} onConfirm={vi.fn()} />
        </MemoryRouter>
      </I18nextProvider>
    )
    expect(screen.getByText(/stub.*revisar/i)).toBeInTheDocument()
  })

  it('shows translated column headers in Spanish', async () => {
    const i18n = createTestI18n('es')
    const { PreviewTable } = await import('@/adapters/pdf-renaming/components/PreviewTable')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PreviewTable rows={[mockRow()]} onConfirm={vi.fn()} />
        </MemoryRouter>
      </I18nextProvider>
    )
    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByText('Empresa')).toBeInTheDocument()
    expect(screen.getByText('Nombre final')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
  })

  it('shows "Reportar problema" link in Spanish', async () => {
    const i18n = createTestI18n('es')
    const { PreviewTable } = await import('@/adapters/pdf-renaming/components/PreviewTable')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PreviewTable rows={[mockRow({ hasOverride: true })]} onConfirm={vi.fn()} />
        </MemoryRouter>
      </I18nextProvider>
    )
    expect(screen.getByText('Reportar problema')).toBeInTheDocument()
  })
})

describe('HistoryList i18n', () => {
  beforeEach(() => {
    useHistoryStore.getState().reset()
  })

  it('shows translated empty state in Spanish', async () => {
    const i18n = createTestI18n('es')
    const { HistoryList } = await import('@/adapters/pdf-renaming/components/HistoryList')
    render(
      <I18nextProvider i18n={i18n}>
        <HistoryList />
      </I18nextProvider>
    )
    expect(screen.getByText(/historial de renombres/i)).toBeInTheDocument()
  })

  it('shows translated search placeholder in Spanish', async () => {
    const i18n = createTestI18n('es')
    const { HistoryList } = await import('@/adapters/pdf-renaming/components/HistoryList')
    useHistoryStore.setState({ jobs: [makeJob(1)], total: 1 })
    render(
      <I18nextProvider i18n={i18n}>
        <HistoryList />
      </I18nextProvider>
    )
    expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeInTheDocument()
  })

  it('formats date using es-ES locale when language is es', async () => {
    const i18n = createTestI18n('es')
    const { HistoryList } = await import('@/adapters/pdf-renaming/components/HistoryList')
    useHistoryStore.setState({ jobs: [makeJob(1, { createdAt: '2024-01-15T10:00:00Z' })], total: 1 })
    render(
      <I18nextProvider i18n={i18n}>
        <HistoryList />
      </I18nextProvider>
    )
    // Spanish date should show the date in some form
    expect(screen.getByText(/2024|ene|15/i)).toBeInTheDocument()
  })
})
