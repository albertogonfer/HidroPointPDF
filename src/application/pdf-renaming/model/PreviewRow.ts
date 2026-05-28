import type { ParsedInvoice } from '@/domain/pdf-renaming/model/types.ts'

/**
 * Represents a single PDF file processed through the renaming pipeline,
 * ready for user review and confirmation.
 */
export type PreviewRow = {
  file: File
  parsedInvoice: ParsedInvoice | null
  proposedName: string
  finalName: string
  hasOverride: boolean
}
