import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IntakePage from '@/adapters/pdf-renaming/pages/IntakePage'
import * as fsaaWriter from '@/infrastructure/fs/fsaaWriter'

// Mock all external dependencies
vi.mock('@/adapters/pdf-renaming/components/BrowserWarning', () => ({
  BrowserWarning: () => null,
}))

vi.mock('@/adapters/pdf-renaming/components/DropZone', () => ({
  DropZone: () => <div data-testid="drop-zone">DropZone</div>,
}))

vi.mock('@/adapters/pdf-renaming/components/PreviewTable', () => ({
  PreviewTable: ({ onConfirm }: { onConfirm: () => void }) => (
    <button onClick={onConfirm}>Confirm & write files</button>
  ),
}))

vi.mock('@/infrastructure/fs/fsaaWriter', () => ({
  FsaaError: class FsaaError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'FsaaError'
    }
  },
  requestRoot: vi.fn().mockResolvedValue({ name: 'root' }),
  writeFile: vi.fn().mockResolvedValue(undefined),
  resolveSubfolder: vi.fn().mockResolvedValue({ name: 'subfolder' }),
}))

vi.mock('@/infrastructure/fs/folderResolver', () => ({
  resolveFolder: vi.fn().mockResolvedValue(['01 INTERPARTNER', '2024', '01 ENERO']),
}))

// Use a stable query spy accessible via module after mock
const dbQuerySpy = vi.fn().mockResolvedValue({ rows: [] })

vi.mock('@/infrastructure/db/index', () => ({
  getDb: () => ({ query: dbQuerySpy }),
}))

vi.mock('@/adapters/pdf-renaming/store/sessionStore', () => ({
  useSessionStore: vi.fn().mockReturnValue({
    fsaaSupported: true,
    checkFsaaSupport: vi.fn(),
    rootFolderHandle: null,
    setRootFolderHandle: vi.fn(),
  }),
}))

vi.mock('@/adapters/pdf-renaming/store/dropZoneStore', () => {
  const mockFile = new File(['%PDF'], 'original.pdf', { type: 'application/pdf' })
  Object.defineProperty(mockFile, 'arrayBuffer', {
    value: () => Promise.resolve(new ArrayBuffer(4)),
    configurable: true,
  })

  return {
    useDropZoneStore: vi.fn().mockReturnValue({
      previewRows: [
        {
          file: mockFile,
          parsedInvoice: {
            companyId: 'INTERPARTNER',
            invoiceNumber: '2024001',
            date: '2024-01-01',
            amount: 123.45,
            firstName: 'JOSE',
            lastName: 'GARCIA',
            rawText: 'raw',
            confidence: 'high',
          },
          proposedName: '2024-01-01 FRA. 2024001 GARCIA, JOSE',
          finalName: '2024-01-01 FRA. 2024001 GARCIA, JOSE',
          hasOverride: false,
        },
      ],
      setConfirming: vi.fn(),
      reset: vi.fn(),
    }),
  }
})

describe('IntakePage — confirm → write → audit log', () => {
  beforeEach(() => {
    dbQuerySpy.mockClear()
    vi.mocked(fsaaWriter.requestRoot).mockResolvedValue({ name: 'root' } as any)
  })

  it('inserts audit record into rename_jobs after confirming', async () => {
    render(<IntakePage />)
    const confirmButton = screen.getByRole('button', { name: /confirm|write/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(dbQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rename_jobs'),
        expect.arrayContaining(['INTERPARTNER', 'original.pdf']),
      )
    })
  })

  it('includes had_override flag in the audit record', async () => {
    render(<IntakePage />)
    const confirmButton = screen.getByRole('button', { name: /confirm|write/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      const call = dbQuerySpy.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO rename_jobs'),
      )
      expect(call).toBeDefined()
      expect(call![1]).toContain(false)
    })
  })

  it('displays FsaaError message in the UI when permission is denied', async () => {
    vi.mocked(fsaaWriter.requestRoot).mockRejectedValueOnce(
      new fsaaWriter.FsaaError('Permission denied: the browser blocked access to the file system.'),
    )

    render(<IntakePage />)
    const confirmButton = screen.getByRole('button', { name: /confirm|write/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/permission denied/i)
    })
  })
})
