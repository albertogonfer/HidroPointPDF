import type { PreviewRow } from '../store/dropZoneStore'
import { useDropZoneStore } from '../store/dropZoneStore'

interface PreviewTableProps {
  rows: PreviewRow[]
  onConfirm: () => void
}

/**
 * Table showing original name | proposed name | company | override input | status.
 * Each row is individually overrideable via a text input.
 * Confirm button is disabled until at least one row exists.
 */
export function PreviewTable({ rows, onConfirm }: PreviewTableProps) {
  const { updateFinalName } = useDropZoneStore()

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-400">
        <p>No files to preview — drop PDF files above</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Original name</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Final name (editable)</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr key={`${row.file.name}-${index}`} className="bg-white hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.file.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {row.parsedInvoice?.companyId ?? <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.finalName}
                    onChange={(e) => updateFinalName(index, e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  {row.hasOverride ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      override
                    </span>
                  ) : row.parsedInvoice?.confidence === 'stub' ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      stub — manual review
                    </span>
                  ) : row.parsedInvoice?.confidence === 'low' ? (
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      low confidence — manual review
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      ready
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={onConfirm}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm &amp; write files
        </button>
      </div>
    </div>
  )
}
