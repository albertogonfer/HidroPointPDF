import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PreviewRow } from '../store/dropZoneStore'
import { useDropZoneStore } from '../store/dropZoneStore'

interface PreviewTableProps {
  rows: PreviewRow[]
  onConfirm: () => void
}

function StatusBadge({ row }: { row: PreviewRow }) {
  const { t } = useTranslation()

  const statusConfig = {
    override: { label: t('previewTable.status.override'), className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    stub:     { label: t('previewTable.status.stub'),     className: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
    low:      { label: t('previewTable.status.low'),      className: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' },
    ready:    { label: t('previewTable.status.ready'),    className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  }

  const key = row.hasOverride
    ? 'override'
    : row.parsedInvoice?.confidence === 'stub'
      ? 'stub'
      : row.parsedInvoice?.confidence === 'low'
        ? 'low'
        : 'ready'
  const { label, className } = statusConfig[key]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function PreviewTable({ rows, onConfirm }: PreviewTableProps) {
  const { updateFinalName } = useDropZoneStore()
  const { t } = useTranslation()

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-400">{t('previewTable.empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Card wrapper */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('previewTable.title', { count: rows.length })}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('previewTable.columns.original')}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('previewTable.columns.company')}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('previewTable.columns.finalName')}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('previewTable.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.file.name}-${index}`} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                  <td className="max-w-52 truncate px-5 py-3 font-mono text-xs text-gray-500" title={row.file.name}>
                    {row.file.name}
                  </td>
                  <td className="px-5 py-3">
                    {row.parsedInvoice?.companyId ? (
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {row.parsedInvoice.companyId}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      value={row.finalName}
                      onChange={(e) => updateFinalName(index, e.target.value)}
                      className="w-full min-w-64 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 font-mono text-xs text-gray-800 transition-colors focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge row={row} />
                      {row.hasOverride && (
                        <Link
                          to={`/feedback?${new URLSearchParams({
                            companyId: row.parsedInvoice?.companyId ?? '',
                            originalName: row.file.name,
                            proposedName: row.proposedName,
                            expectedName: row.finalName,
                          }).toString()}`}
                          className="text-xs font-medium text-purple-600 hover:text-purple-500 hover:underline"
                        >
                          {t('previewTable.reportLink')}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {t('previewTable.editHint')}
        </p>
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {t('previewTable.confirmButton')}
        </button>
      </div>
    </div>
  )
}
