import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryList } from '@/adapters/pdf-renaming/components/HistoryList'
import { useHistoryStore } from '@/adapters/pdf-renaming/store/historyStore'
import type { RenameJob } from '@/adapters/pdf-renaming/store/historyStore'

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

describe('HistoryList', () => {
  beforeEach(() => {
    useHistoryStore.getState().reset()
  })

  it('shows empty state when no jobs', () => {
    render(<HistoryList />)
    expect(screen.getByText(/no history|no jobs|no rename|sin historial/i)).toBeInTheDocument()
  })

  it('renders a list of rename jobs', () => {
    useHistoryStore.setState({ jobs: [makeJob(1), makeJob(2)], total: 2 })
    render(<HistoryList />)
    expect(screen.getByText('original-1.pdf')).toBeInTheDocument()
    expect(screen.getByText('original-2.pdf')).toBeInTheDocument()
  })

  it('shows original and final name for each job', () => {
    useHistoryStore.setState({ jobs: [makeJob(1)], total: 1 })
    render(<HistoryList />)
    expect(screen.getByText('original-1.pdf')).toBeInTheDocument()
    expect(screen.getByText(/final-1\.pdf/)).toBeInTheDocument()
  })

  it('shows company name', () => {
    useHistoryStore.setState({ jobs: [makeJob(1)], total: 1 })
    render(<HistoryList />)
    expect(screen.getByText(/INTERPARTNER/)).toBeInTheDocument()
  })

  it('shows had_override badge when job has override', () => {
    useHistoryStore.setState({
      jobs: [makeJob(1, { hadOverride: true })],
      total: 1,
    })
    render(<HistoryList />)
    expect(screen.getByText(/override/i)).toBeInTheDocument()
  })

  it('filters jobs by search term on original name', () => {
    useHistoryStore.setState({
      jobs: [makeJob(1, { originalName: 'invoice-abc.pdf' }), makeJob(2, { originalName: 'scan-xyz.pdf' })],
      total: 2,
    })
    render(<HistoryList />)
    const searchInput = screen.getByPlaceholderText(/search|buscar/i)
    fireEvent.change(searchInput, { target: { value: 'abc' } })
    expect(screen.getByText('invoice-abc.pdf')).toBeInTheDocument()
    expect(screen.queryByText('scan-xyz.pdf')).not.toBeInTheDocument()
  })

  it('shows pagination controls when total > pageSize', () => {
    const jobs = Array.from({ length: 25 }, (_, i) => makeJob(i + 1))
    useHistoryStore.setState({ jobs, total: 25, pageSize: 20 })
    render(<HistoryList />)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2)
  })

  it('formats date in a human-readable way', () => {
    useHistoryStore.setState({ jobs: [makeJob(1)], total: 1 })
    render(<HistoryList />)
    // Date "2024-01-15T10:00:00Z" should appear in some readable form
    expect(screen.getByText(/2024|Jan|15/i)).toBeInTheDocument()
  })
})
