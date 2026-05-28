import { useState } from 'react'
import { submitFeedback } from '@/application/feedback-reporting/use-cases/submitFeedback'
import { VercelFunctionFeedbackSubmitter } from '@/infrastructure/feedback/VercelFunctionFeedbackSubmitter'
import { PGliteFeedbackRepository } from '@/infrastructure/db/PGliteFeedbackRepository'
import { useFeedbackStore } from '../store/feedbackStore'

interface FeedbackFormProps {
  companyId: string
  originalName: string
  proposedName: string
  expectedName: string
}

const MAX_FILE_SIZE = 3 * 1024 * 1024

export function FeedbackForm({ companyId, originalName, proposedName, expectedName: initialExpectedName }: FeedbackFormProps) {
  const [description, setDescription] = useState('')
  const [expectedName, setExpectedName] = useState(initialExpectedName)
  const [consent, setConsent] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const { status, issueUrl, issueNumber, errorMessage, setSubmitting, setSuccess, setError } = useFeedbackStore()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFileError(null)
    if (selected && selected.size > MAX_FILE_SIZE) {
      setFileError('El archivo excede el tamaño máximo de 3 MB.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting()

    try {
      const submitter = new VercelFunctionFeedbackSubmitter()
      const repository = new PGliteFeedbackRepository()

      const result = await submitFeedback(
        { companyId, originalName, proposedName, expectedName, description, file: file ?? undefined },
        submitter,
        repository
      )
      setSuccess(result.issueUrl, result.issueNumber)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al enviar el reporte.'
      setError(message.startsWith('validation:')
        ? 'Por favor completá los campos requeridos antes de enviar.'
        : 'Ocurrió un error al enviar el reporte. Intentá nuevamente.')
    }
  }

  const isSubmitting = status === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Success banner */}
      {status === 'success' && issueUrl && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-200">
          Reporte enviado —{' '}
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            ver issue #{issueNumber}
          </a>
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && errorMessage && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          {errorMessage}
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción del error
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describí qué salió mal con el nombre propuesto..."
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {/* Expected name */}
      <div className="space-y-1.5">
        <label htmlFor="expectedName" className="block text-sm font-medium text-gray-700">
          Nombre correcto del archivo
        </label>
        <input
          id="expectedName"
          name="expectedName"
          type="text"
          required
          value={expectedName}
          onChange={(e) => setExpectedName(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {/* Consent checkbox */}
      <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-amber-900">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              if (!e.target.checked) {
                setFile(null)
                setFileError(null)
              }
            }}
            className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-300"
          />
          <span>
            Este archivo contiene datos de facturas. Confirmo que quiero compartirlo para ayudar a corregir el error.
          </span>
        </label>
      </div>

      {/* File input — only when consent given */}
      {consent && (
        <div className="space-y-1.5">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Adjuntar PDF (opcional, máx. 3 MB)
          </label>
          <input
            id="file"
            data-testid="file-input"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
          />
          {fileError && (
            <p className="text-xs text-red-600">{fileError}</p>
          )}
          {file && !fileError && (
            <p className="text-xs text-gray-500">
              {file.name} — {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Enviando…
          </>
        ) : (
          'Enviar reporte'
        )}
      </button>
    </form>
  )
}
