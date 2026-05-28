import { create } from 'zustand'

type FeedbackStatus = 'idle' | 'submitting' | 'success' | 'error'

type FeedbackState = {
  status: FeedbackStatus
  issueUrl: string | null
  issueNumber: number | null
  errorMessage: string | null
}

type FeedbackActions = {
  setSubmitting: () => void
  setSuccess: (issueUrl: string, issueNumber: number) => void
  setError: (message: string) => void
  reset: () => void
}

const initialState: FeedbackState = {
  status: 'idle',
  issueUrl: null,
  issueNumber: null,
  errorMessage: null,
}

export const useFeedbackStore = create<FeedbackState & FeedbackActions>((set) => ({
  ...initialState,

  setSubmitting: () =>
    set({ status: 'submitting', issueUrl: null, issueNumber: null, errorMessage: null }),

  setSuccess: (issueUrl, issueNumber) =>
    set({ status: 'success', issueUrl, issueNumber, errorMessage: null }),

  setError: (message) =>
    set({ status: 'error', errorMessage: message, issueUrl: null, issueNumber: null }),

  reset: () => set(initialState),
}))
