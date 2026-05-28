import { create } from 'zustand'

type SessionState = {
  rootFolderHandle: FileSystemDirectoryHandle | null
  hasPermission: boolean
  fsaaSupported: boolean
}

type SessionActions = {
  setRootFolderHandle: (handle: FileSystemDirectoryHandle | null) => void
  setHasPermission: (has: boolean) => void
  checkFsaaSupport: () => void
  reset: () => void
}

const initialState: SessionState = {
  rootFolderHandle: null,
  hasPermission: false,
  fsaaSupported: false,
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  ...initialState,

  setRootFolderHandle: (handle) =>
    set({ rootFolderHandle: handle, hasPermission: handle !== null }),

  setHasPermission: (has) => set({ hasPermission: has }),

  checkFsaaSupport: () =>
    set({ fsaaSupported: typeof window !== 'undefined' && 'showDirectoryPicker' in window }),

  reset: () => set(initialState),
}))
