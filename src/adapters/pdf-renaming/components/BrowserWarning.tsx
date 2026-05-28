interface BrowserWarningProps {
  fsaaSupported: boolean
}

/**
 * Renders a warning banner when the File System Access API is not available.
 * Blocks write operations but allows read-only preview.
 */
export function BrowserWarning({ fsaaSupported }: BrowserWarningProps) {
  if (fsaaSupported) return null

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-md border border-yellow-400 bg-yellow-50 px-4 py-3 text-yellow-800"
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="font-semibold">Chromium-based browser required</p>
        <p className="text-sm">
          File writing requires a Chromium browser (Chrome 86+ or Edge 86+). Firefox and Safari are
          not supported. You can still preview proposed renames, but files cannot be written to disk.
        </p>
      </div>
    </div>
  )
}
