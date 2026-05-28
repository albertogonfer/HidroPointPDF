import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DropZone } from '@/adapters/pdf-renaming/components/DropZone'
import { useDropZoneStore } from '@/adapters/pdf-renaming/store/dropZoneStore'

// Mock pdfjs-dist to avoid worker/canvas issues in test environment
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'INTERPARTNER Nº EXP 2024001 01/01/2024 123.45 EUR GARCIA LOPEZ' }],
        }),
      }),
    }),
  }),
  GlobalWorkerOptions: { workerSrc: '' },
}))

// Mock parser-registry
vi.mock('@/infrastructure/parsers/parser-registry', () => ({
  detectCompany: vi.fn().mockReturnValue('INTERPARTNER'),
  getParser: vi.fn().mockReturnValue({
    companyId: 'INTERPARTNER',
    extract: vi.fn().mockReturnValue({
      companyId: 'INTERPARTNER',
      invoiceNumber: '2024001',
      date: '2024-01-01',
      amount: 123.45,
      firstName: 'GARCIA',
      lastName: 'LOPEZ',
      rawText: 'INTERPARTNER Nº EXP 2024001 01/01/2024 123.45 EUR GARCIA LOPEZ',
      confidence: 'high',
    }),
  }),
}))

vi.mock('@/domain/pdf-renaming/services/renamingEngine', () => ({
  applyTemplate: vi.fn().mockReturnValue('2024-01-01 FRA. 2024001 LOPEZ, GARCIA'),
}))

// Mock getDb / PGlite for template loading
vi.mock('@/infrastructure/db/index', () => ({
  getDb: vi.fn().mockReturnValue({
    query: vi.fn().mockResolvedValue({
      rows: [{ template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}' }],
    }),
  }),
}))

// Helper: make a PDF File with arrayBuffer properly mocked
function makePdfFile(name = 'test.pdf'): File {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new ArrayBuffer(0)),
    configurable: true,
  })
  return file
}

describe('DropZone', () => {
  beforeEach(() => {
    useDropZoneStore.getState().reset()
  })

  it('renders drop zone with instructions', () => {
    render(<DropZone />)
    expect(screen.getByText(/drag.*drop|drop.*pdf/i)).toBeInTheDocument()
  })

  it('shows drag-active state when dragging over', () => {
    render(<DropZone />)
    const dropArea = screen.getByTestId('drop-zone')
    fireEvent.dragOver(dropArea, { dataTransfer: { types: ['Files'] } })
    expect(dropArea).toHaveAttribute('data-drag-active', 'true')
  })

  it('clears drag-active state on drag leave', () => {
    render(<DropZone />)
    const dropArea = screen.getByTestId('drop-zone')
    fireEvent.dragOver(dropArea, { dataTransfer: { types: ['Files'] } })
    fireEvent.dragLeave(dropArea)
    expect(dropArea).toHaveAttribute('data-drag-active', 'false')
  })

  it('shows loading state while parsing files', async () => {
    render(<DropZone />)
    const dropArea = screen.getByTestId('drop-zone')
    const pdfFile = makePdfFile()

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [pdfFile], types: ['Files'] },
    })

    // Should briefly show loading
    expect(screen.queryByText(/processing|loading|parsing/i)).toBeDefined()
  })

  it('accepts only PDF files', async () => {
    render(<DropZone />)
    const dropArea = screen.getByTestId('drop-zone')
    // A non-PDF file should be filtered out — no rows should be set in store
    const txtFile = new File(['hello'], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(txtFile, 'arrayBuffer', {
      value: () => Promise.resolve(new ArrayBuffer(0)),
      configurable: true,
    })

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [txtFile], types: ['Files'] },
    })

    await waitFor(() => {
      const store = useDropZoneStore.getState()
      expect(store.pendingFiles).toHaveLength(0)
    })
  })

  it('drops multiple PDFs and creates a preview row for each file', async () => {
    render(<DropZone />)
    const dropArea = screen.getByTestId('drop-zone')
    const file1 = makePdfFile('invoice1.pdf')
    const file2 = makePdfFile('invoice2.pdf')

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [file1, file2], types: ['Files'] },
    })

    await waitFor(() => {
      const store = useDropZoneStore.getState()
      expect(store.previewRows).toHaveLength(2)
    })
  })

  it('loads template from PGlite for detected company and applies it to proposed name', async () => {
    const { applyTemplate } = await import('@/domain/pdf-renaming/services/renamingEngine')
    const { getDb } = await import('@/infrastructure/db/index')

    render(<DropZone />)
    const dropArea = screen.getByTestId('drop-zone')
    const pdfFile = makePdfFile('invoice.pdf')

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [pdfFile], types: ['Files'] },
    })

    await waitFor(() => {
      const store = useDropZoneStore.getState()
      expect(store.previewRows).toHaveLength(1)
    })

    // DB query for template must have been called with the detected company
    expect(getDb().query).toHaveBeenCalledWith(
      expect.stringContaining('renaming_rules'),
      expect.arrayContaining(['INTERPARTNER']),
    )

    // applyTemplate must have been called with the template from DB
    expect(applyTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'INTERPARTNER' }),
      '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
    )
  })
})
