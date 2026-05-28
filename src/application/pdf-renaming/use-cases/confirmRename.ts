import { resolveSubfolder, writeFile } from '@/infrastructure/fs/fsaaWriter.ts'
import { resolveFolder } from '@/infrastructure/fs/folderResolver.ts'
import { getDb } from '@/infrastructure/db'
import type { PreviewRow } from '../model/PreviewRow'
import type { CompanyId } from '@/domain/pdf-renaming/model/types.ts'

export async function confirmRename(
  rows: PreviewRow[],
  rootHandle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = getDb()

  for (const row of rows) {
    const invoice = row.parsedInvoice
    const companyId = invoice?.companyId ?? 'UNKNOWN'
    const date = invoice?.date ?? new Date().toISOString().slice(0, 10)

    let folderParts: string[] = []
    try {
      folderParts = await resolveFolder(companyId as CompanyId, date)
    } catch {
      folderParts = ['UNKNOWN']
    }

    const targetFolder = folderParts.join('/')
    const folder = await resolveSubfolder(rootHandle, folderParts)
    const data = await row.file.arrayBuffer()
    await writeFile(folder, row.finalName + '.pdf', data)

    await db.query(
      `INSERT INTO rename_jobs (company_id, original_name, proposed_name, final_name, target_folder, had_override)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [companyId, row.file.name, row.proposedName, row.finalName, targetFolder, row.hasOverride],
    )
  }
}
