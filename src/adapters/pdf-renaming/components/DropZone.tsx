import { useCallback, useRef } from 'react'
import { useDropZoneStore } from '../store/dropZoneStore'
import { processFile } from '../../../application/pdf-renaming/use-cases'

/**
 * Drag-and-drop area accepting multiple PDF files.
 * On drop: reads files, parses them through the parser pipeline,
 * and populates the preview rows in dropZoneStore.
 */
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

  return (
    <div
      data-testid="drop-zone"
      data-drag-active={String(dragActive)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
        dragActive
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400',
      ].join(' ')}
    >
      {confirming || processingRef.current ? (
        <p className="text-sm">Processing files…</p>
      ) : (
        <>
          <svg
            aria-hidden="true"
            className="mb-3 h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm font-medium">Drag & drop PDF files here</p>
          <p className="mt-1 text-xs">Multiple files supported</p>
        </>
      )}
    </div>
  )
}
