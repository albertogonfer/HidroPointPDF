import { useEffect, useState } from 'react'
import { BrowserWarning } from '../components/BrowserWarning'
import { DropZone } from '../components/DropZone'
import { PreviewTable } from '../components/PreviewTable'
import { useSessionStore } from '../store/sessionStore'
import { useDropZoneStore } from '../store/dropZoneStore'
import { requestRoot, FsaaError } from '../../../infrastructure/fs/fsaaWriter'
import { confirmRename } from '../../../application/pdf-renaming/use-cases'

export default function IntakePage() {
  const { fsaaSupported, checkFsaaSupport, rootFolderHandle, setRootFolderHandle } = useSessionStore()
  const { previewRows, setConfirming, reset } = useDropZoneStore()
  const [fsaaErrorMessage, setFsaaErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    checkFsaaSupport()
  }, [checkFsaaSupport])

  async function handleConfirm() {
    setConfirming(true)
    setFsaaErrorMessage(null)
    try {
      let root = rootFolderHandle
      if (!root) {
        root = await requestRoot()
        setRootFolderHandle(root)
      }

      await confirmRename(previewRows, root)
      reset()
    } catch (err) {
      if (err instanceof FsaaError) {
        setFsaaErrorMessage(err.message)
      } else {
        console.error('Write failed:', err)
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">PDF Rename</h1>
      <BrowserWarning fsaaSupported={fsaaSupported} />
      {fsaaErrorMessage && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fsaaErrorMessage}
        </div>
      )}
      <DropZone />
      <PreviewTable rows={previewRows} onConfirm={handleConfirm} />
    </div>
  )
}
