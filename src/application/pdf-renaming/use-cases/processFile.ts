import * as pdfjs from 'pdfjs-dist'
import { detectCompany, getParser } from '@/infrastructure/parsers/parser-registry.ts'
import { applyTemplate } from '@/domain/pdf-renaming/services/renamingEngine.ts'
import { getDb } from '@/infrastructure/db'
import type { PreviewRow } from '../model/PreviewRow'

// Configure worker — must be set before any pdfjs call
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const DEFAULT_TEMPLATE = '{date} FRA. {invoiceNumber} {lastName}, {firstName}'

async function extractText(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const texts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    texts.push(content.items.map((item) => ('str' in item ? (item as { str: string }).str : '')).join(' '))
  }
  return texts.join('\n')
}

async function loadTemplate(companyId: string): Promise<string> {
  try {
    const db = getDb()
    const result = await db.query<{ template: string }>(
      'SELECT template FROM renaming_rules WHERE company_id = $1 AND active = true LIMIT 1',
      [companyId],
    )
    if (result.rows.length > 0) return result.rows[0].template
  } catch {
    // DB not initialized or query failed — fall back to default
  }
  return DEFAULT_TEMPLATE
}

export async function processFile(file: File): Promise<PreviewRow> {
  const arrayBuffer = await file.arrayBuffer()
  const text = await extractText(arrayBuffer)
  const companyId = detectCompany(text)

  if (!companyId) {
    return {
      file,
      parsedInvoice: null,
      proposedName: file.name,
      finalName: file.name,
      hasOverride: false,
    }
  }

  const parser = getParser(companyId)
  if (!parser) {
    return {
      file,
      parsedInvoice: null,
      proposedName: file.name,
      finalName: file.name,
      hasOverride: false,
    }
  }
  const invoice = parser.extract(text)
  const template = await loadTemplate(companyId)
  const proposedName = applyTemplate(invoice, template)

  return {
    file,
    parsedInvoice: invoice,
    proposedName,
    finalName: proposedName,
    hasOverride: false,
  }
}
