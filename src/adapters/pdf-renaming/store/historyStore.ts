import { create } from 'zustand'

export type RenameJob = {
  id: number
  companyId: string
  originalName: string
  proposedName: string
  finalName: string
  targetFolder: string
  hadOverride: boolean
  status: string
  createdAt: string
}

type HistoryState = {
  jobs: RenameJob[]
  page: number
  pageSize: number
  total: number
  searchTerm: string
}

type HistoryActions = {
  setJobs: (jobs: RenameJob[]) => void
  setPage: (page: number) => void
  setTotal: (total: number) => void
  setSearchTerm: (term: string) => void
  addJob: (job: RenameJob) => void
  reset: () => void
}

const initialState: HistoryState = {
  jobs: [],
  page: 1,
  pageSize: 20,
  total: 0,
  searchTerm: '',
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set) => ({
  ...initialState,

  setJobs: (jobs) => set({ jobs }),

  setPage: (page) => set({ page }),

  setTotal: (total) => set({ total }),

  setSearchTerm: (term) => set({ searchTerm: term, page: 1 }),

  addJob: (job) =>
    set((state) => ({ jobs: [job, ...state.jobs], total: state.total + 1 })),

  reset: () => set(initialState),
}))
