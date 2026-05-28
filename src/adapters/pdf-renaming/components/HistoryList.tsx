import { useHistoryStore } from '../store/historyStore'
import type { RenameJob } from '../store/historyStore'

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return isoString
  }
}

/**
 * Paginated, searchable list of rename_jobs from PGlite (via historyStore).
 * Searchable by original_name or final_name. Shows override badge.
 */
export function HistoryList() {
  const { jobs, page, pageSize, total, setPage, setSearchTerm, searchTerm } = useHistoryStore()

  const filtered = jobs.filter((job: RenameJob) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      job.originalName.toLowerCase().includes(term) ||
      job.finalName.toLowerCase().includes(term)
    )
  })

  const totalPages = Math.ceil(total / pageSize)

  if (!jobs.length) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-400">
        <p>No rename history yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search by original or final name…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {filtered.map((job: RenameJob) => (
          <div key={job.id} className="flex items-start gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">{job.companyId}</span>
                <span className="text-xs text-gray-400">{formatDate(job.createdAt)}</span>
                {job.hadOverride && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    override
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-xs text-gray-600">{job.originalName}</p>
              <p className="mt-0.5 truncate font-mono text-xs font-semibold text-gray-900">
                → {job.finalName}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
