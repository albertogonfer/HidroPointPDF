import { create } from 'zustand'
import type { PreviewRow } from '../../../application/pdf-renaming/model/PreviewRow'
import type { ParsedInvoice } from '../../../domain/pdf-renaming/model/types'

export type { PreviewRow }

type DropZoneState = {
  dragActive: boolean
  pendingFiles: File[]
  parsedResults: ParsedInvoice[]
  previewRows: PreviewRow[]
  confirming: boolean
}

type DropZoneActions = {
  setDragActive: (active: boolean) => void
  setPendingFiles: (files: File[]) => void
  addParsedResult: (result: ParsedInvoice) => void
  setPreviewRows: (rows: PreviewRow[]) => void
  updateFinalName: (index: number, finalName: string) => void
  setConfirming: (confirming: boolean) => void
  reset: () => void
}

const initialState: DropZoneState = {
  dragActive: false,
  pendingFiles: [],
  parsedResults: [],
  previewRows: [],
  confirming: false,
}

export const useDropZoneStore = create<DropZoneState & DropZoneActions>((set) => ({
  ...initialState,

  setDragActive: (active) => set({ dragActive: active }),

  setPendingFiles: (files) => set({ pendingFiles: files }),

  addParsedResult: (result) =>
    set((state) => ({ parsedResults: [...state.parsedResults, result] })),

  setPreviewRows: (rows) => set({ previewRows: rows }),

  updateFinalName: (index, finalName) =>
    set((state) => {
      const updated = [...state.previewRows]
      if (updated[index]) {
        updated[index] = { ...updated[index], finalName, hasOverride: true }
      }
      return { previewRows: updated }
    }),

  setConfirming: (confirming) => set({ confirming }),

  reset: () => set(initialState),
}))
