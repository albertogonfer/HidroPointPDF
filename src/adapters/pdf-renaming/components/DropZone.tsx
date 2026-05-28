import { useCallback, useRef } from 'react'
import { useDropZoneStore } from '../store/dropZoneStore'
import { processFile } from '../../../application/pdf-renaming/use-cases'

export function DropZone() {
  const { dragActive, confirming, setDragActive, setPendingFiles, setPreviewRows, setConfirming } =
    useDropZoneStore()

  const processingRef = useRef(false)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [setDragActive])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [setDragActive])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      )

      if (!files.length) return

      setPendingFiles(files)
      setConfirming(false)
      processingRef.current = true

      const rows = await Promise.all(files.map(processFile))
      setPreviewRows(rows)
      processingRef.current = false
    },
    [setDragActive, setPendingFiles, setPreviewRows, setConfirming],
  )

  const isLoading = confirming || processingRef.current

  return (
    <div
      data-testid="drop-zone"
      data-drag-active={String(dragActive)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-150',
        dragActive
          ? 'border-purple-400 bg-purple-50 shadow-inner'
          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/40',
      ].join(' ')}
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 text-purple-600">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium">Processing files…</p>
        </div>
      ) : (
        <div className={['flex flex-col items-center gap-3', dragActive ? 'text-purple-600' : 'text-gray-400'].join(' ')}>
          <div className={['flex h-14 w-14 items-center justify-center rounded-2xl transition-colors', dragActive ? 'bg-purple-100' : 'bg-gray-100'].join(' ')}>
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {dragActive ? 'Release to add files' : 'Drop PDF files here'}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">Multiple files supported — invoices only</p>
          </div>
        </div>
      )}
    </div>
  )
}
