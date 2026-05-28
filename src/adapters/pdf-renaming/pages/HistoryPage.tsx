import { useEffect } from 'react'
import { HistoryList } from '../components/HistoryList'
import { useHistoryStore } from '../store/historyStore'
import { getDb } from '../../../infrastructure/db/index'

export default function HistoryPage() {
  const { setJobs, setTotal, pageSize, page } = useHistoryStore()

  useEffect(() => {
    async function loadJobs() {
      try {
        const db = getDb()
        const result = await db.query<{
          id: number
          company_id: string
          original_name: string
          proposed_name: string
          final_name: string
          target_folder: string
          had_override: boolean
          status: string
          created_at: string
        }>(
          `SELECT id, company_id, original_name, proposed_name, final_name,
                  target_folder, had_override, status, created_at
           FROM rename_jobs
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
          [pageSize, (page - 1) * pageSize],
        )

        const countResult = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM rename_jobs')

        setJobs(
          result.rows.map((r) => ({
            id: r.id,
            companyId: r.company_id,
            originalName: r.original_name,
            proposedName: r.proposed_name,
            finalName: r.final_name,
            targetFolder: r.target_folder,
            hadOverride: r.had_override,
            status: r.status,
            createdAt: r.created_at,
          })),
        )
        setTotal(parseInt(countResult.rows[0].count, 10))
      } catch {
        // DB not initialized yet — no jobs to show
      }
    }
    loadJobs()
  }, [page, pageSize, setJobs, setTotal])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Rename History</h1>
        <p className="mt-1 text-sm text-gray-500">All past rename jobs, stored locally in your browser.</p>
      </div>
      <HistoryList />
    </div>
  )
}
