import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSessionStore } from '@/adapters/pdf-renaming/store/sessionStore'

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('has falsy initial state', () => {
    const state = useSessionStore.getState()
    expect(state.rootFolderHandle).toBeNull()
    expect(state.hasPermission).toBe(false)
    expect(state.fsaaSupported).toBe(false)
  })

  it('setRootFolderHandle sets handle and hasPermission to true', () => {
    const fakeHandle = { name: 'root' } as FileSystemDirectoryHandle
    useSessionStore.getState().setRootFolderHandle(fakeHandle)
    expect(useSessionStore.getState().rootFolderHandle).toBe(fakeHandle)
    expect(useSessionStore.getState().hasPermission).toBe(true)
  })

  it('setRootFolderHandle with null sets hasPermission to false', () => {
    useSessionStore.getState().setRootFolderHandle(null)
    expect(useSessionStore.getState().rootFolderHandle).toBeNull()
    expect(useSessionStore.getState().hasPermission).toBe(false)
  })

  it('setHasPermission toggles hasPermission', () => {
    useSessionStore.getState().setHasPermission(true)
    expect(useSessionStore.getState().hasPermission).toBe(true)
    useSessionStore.getState().setHasPermission(false)
    expect(useSessionStore.getState().hasPermission).toBe(false)
  })

  it('checkFsaaSupport sets fsaaSupported based on window.showDirectoryPicker', () => {
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    useSessionStore.getState().checkFsaaSupport()
    expect(useSessionStore.getState().fsaaSupported).toBe(true)
    vi.unstubAllGlobals()
  })

  it('reset restores initial state', () => {
    useSessionStore.getState().setHasPermission(true)
    useSessionStore.getState().reset()
    expect(useSessionStore.getState().hasPermission).toBe(false)
    expect(useSessionStore.getState().rootFolderHandle).toBeNull()
  })
})
