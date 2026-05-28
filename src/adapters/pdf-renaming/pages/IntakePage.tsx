import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserWarning } from '../components/BrowserWarning'
import { DropZone } from '../components/DropZone'
import { PreviewTable } from '../components/PreviewTable'
import { useSessionStore } from '../store/sessionStore'
import { useDropZoneStore } from '../store/dropZoneStore'
import { requestRoot, FsaaError } from '../../../infrastructure/fs/fsaaWriter'
import { confirmRename } from '../../../application/pdf-renaming/use-cases'

export default function IntakePage() {
  const { t } = useTranslation()
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{t('intakePage.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('intakePage.subtitle')}
        </p>
      </div>

      <BrowserWarning fsaaSupported={fsaaSupported} />

      {fsaaErrorMessage && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {fsaaErrorMessage}
        </div>
      )}

      <DropZone />
      <PreviewTable rows={previewRows} onConfirm={handleConfirm} />
    </div>
  )
}
