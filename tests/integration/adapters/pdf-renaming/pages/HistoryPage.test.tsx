import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HistoryPage from '@/adapters/pdf-renaming/pages/HistoryPage'

vi.mock('@/adapters/pdf-renaming/components/HistoryList', () => ({
  HistoryList: () => <div data-testid="history-list">HistoryList</div>,
}))

const dbQuerySpy = vi.fn().mockResolvedValue({ rows: [{ count: '0' }] })

vi.mock('@/infrastructure/db/index', () => ({
  getDb: () => ({ query: dbQuerySpy }),
}))

vi.mock('@/adapters/pdf-renaming/store/historyStore', () => ({
  useHistoryStore: vi.fn().mockReturnValue({
    setJobs: vi.fn(),
    setTotal: vi.fn(),
    pageSize: 20,
    page: 1,
  }),
}))

describe('HistoryPage', () => {
  it('renders heading and HistoryList', () => {
    render(<HistoryPage />)
    expect(screen.getByRole('heading', { name: /rename history/i })).toBeInTheDocument()
    expect(screen.getByTestId('history-list')).toBeInTheDocument()
  })

  it('queries rename_jobs on mount', async () => {
    render(<HistoryPage />)
    // Allow effects to fire
    await new Promise((r) => setTimeout(r, 50))
    expect(dbQuerySpy).toHaveBeenCalledWith(
      expect.stringContaining('FROM rename_jobs'),
      expect.any(Array),
    )
  })
})
