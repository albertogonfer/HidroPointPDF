import { useTranslation } from 'react-i18next'
import { useHistoryStore } from '../store/historyStore'
import type { RenameJob } from '../store/historyStore'

function formatDate(isoString: string, locale: string): string {
  try {
    return new Date(isoString).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function HistoryList() {
  const { t, i18n } = useTranslation()
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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder={t('historyList.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {!jobs.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-400">{t('historyList.empty')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {filtered.map((job: RenameJob, i: number) => (
            <div
              key={job.id}
              className={['flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60', i > 0 ? 'border-t border-gray-100' : ''].join(' ')}
            >
              {/* Company pill */}
              <span className="mt-0.5 inline-flex flex-shrink-0 items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                {job.companyId}
              </span>

              {/* Names */}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-mono text-xs text-gray-400" title={job.originalName}>
                  {job.originalName}
                </p>
                <p className="truncate font-mono text-xs font-semibold text-gray-800" title={job.finalName}>
                  → {job.finalName}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right">
                <span className="text-xs text-gray-400">{formatDate(job.createdAt, i18n.language)}</span>
                {job.hadOverride && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-amber-200">
                    override
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-400">{t('historyList.pageOf', { page, total: totalPages })}</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('historyList.prevPage')}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('historyList.nextPage')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
