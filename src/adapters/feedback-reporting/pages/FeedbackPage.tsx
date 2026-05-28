import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FeedbackForm } from '../components/FeedbackForm'

export default function FeedbackPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const companyId = searchParams.get('companyId') ?? ''
  const originalName = searchParams.get('originalName') ?? ''
  const proposedName = searchParams.get('proposedName') ?? ''
  const expectedName = searchParams.get('expectedName') ?? ''

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t('feedbackPage.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('feedbackPage.subtitle')}
        </p>
      </div>

      {/* Context card */}
      {(companyId || originalName) && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700">
          {companyId && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-500">Empresa:</span>
              <span>{companyId}</span>
            </div>
          )}
          {originalName && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-500">Archivo original:</span>
              <span className="font-mono text-xs">{originalName}</span>
            </div>
          )}
          {proposedName && (
            <div className="flex gap-2">
              <span className="font-medium text-gray-500">Nombre propuesto:</span>
              <span className="font-mono text-xs">{proposedName}</span>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <FeedbackForm
          companyId={companyId}
          originalName={originalName}
          proposedName={proposedName}
          expectedName={expectedName}
        />
      </div>
    </div>
  )
}
