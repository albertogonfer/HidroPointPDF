import { describe, it, expect, vi } from 'vitest'
import { requestRoot, writeFile, resolveSubfolder, FsaaError } from '@/infrastructure/fs/fsaaWriter'

// Mock FileSystemDirectoryHandle
const makeFileHandle = (name: string) => ({
  name,
  kind: 'file' as const,
  createWritable: vi.fn().mockResolvedValue({
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
})

const makeDirHandle = (name: string): FileSystemDirectoryHandle => {
  const subHandles: Record<string, FileSystemDirectoryHandle> = {}
  return {
    name,
    kind: 'directory' as const,
    getFileHandle: vi.fn().mockImplementation((filename: string, opts?: { create?: boolean }) => {
      return Promise.resolve(makeFileHandle(filename))
    }),
    getDirectoryHandle: vi.fn().mockImplementation((dirName: string, opts?: { create?: boolean }) => {
      if (!subHandles[dirName]) {
        subHandles[dirName] = makeDirHandle(dirName)
      }
      return Promise.resolve(subHandles[dirName])
    }),
    removeEntry: vi.fn(),
    resolve: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    [Symbol.asyncIterator]: vi.fn(),
    isSameEntry: vi.fn().mockResolvedValue(false),
  } as unknown as FileSystemDirectoryHandle
}

describe('fsaaWriter', () => {
  describe('requestRoot', () => {
    it('calls showDirectoryPicker and returns the handle', async () => {
      const mockHandle = makeDirHandle('root')
      vi.stubGlobal('showDirectoryPicker', vi.fn().mockResolvedValue(mockHandle))

      const result = await requestRoot()
      expect(result).toBe(mockHandle)
      vi.unstubAllGlobals()
    })

    it('throws descriptive error when permission is denied', async () => {
      vi.stubGlobal('showDirectoryPicker', vi.fn().mockRejectedValue(
        Object.assign(new Error('Permission denied'), { name: 'SecurityError' })
      ))

      await expect(requestRoot()).rejects.toThrow(/permission denied/i)
      await expect(requestRoot()).rejects.toBeInstanceOf(FsaaError)
      vi.unstubAllGlobals()
    })

    it('throws descriptive error when user aborts', async () => {
      vi.stubGlobal('showDirectoryPicker', vi.fn().mockRejectedValue(
        Object.assign(new Error('Aborted'), { name: 'AbortError' })
      ))

      await expect(requestRoot()).rejects.toThrow(/cancelled|aborted/i)
      vi.unstubAllGlobals()
    })
  })

  describe('resolveSubfolder', () => {
    it('navigates through multiple path parts', async () => {
      const root = makeDirHandle('root')
      await resolveSubfolder(root, ['01 INTERPARTNER', '2024', '01 ENERO'])
      expect(root.getDirectoryHandle).toHaveBeenCalledWith('01 INTERPARTNER', { create: true })
    })

    it('creates nested folders that do not exist', async () => {
      const root = makeDirHandle('root')
      const folder = await resolveSubfolder(root, ['A', 'B', 'C'])
      expect(folder.name).toBe('C')
    })

    it('returns root itself when parts is empty', async () => {
      const root = makeDirHandle('root')
      const result = await resolveSubfolder(root, [])
      expect(result).toBe(root)
    })

    it('throws with user-readable message when getDirectoryHandle throws NotAllowedError', async () => {
      const root = makeDirHandle('root')
      ;(root.getDirectoryHandle as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        Object.assign(new Error('Not allowed'), { name: 'NotAllowedError' })
      )
      await expect(resolveSubfolder(root, ['forbidden-folder'])).rejects.toThrow(
        /permission denied|not allowed/i
      )
    })
  })

  describe('writeFile', () => {
    it('writes data to the file at relativePath', async () => {
      const root = makeDirHandle('root')
      const data = new ArrayBuffer(4)
      await writeFile(root, 'output.pdf', data)
      expect(root.getFileHandle).toHaveBeenCalledWith('output.pdf', { create: true })
    })

    it('writes to nested path correctly', async () => {
      const root = makeDirHandle('root')
      const data = new ArrayBuffer(4)
      await writeFile(root, '01 INTERPARTNER/2024/01 ENERO/file.pdf', data)
      expect(root.getDirectoryHandle).toHaveBeenCalledWith('01 INTERPARTNER', { create: true })
    })

    it('throws with descriptive error on write failure', async () => {
      const root = makeDirHandle('root')
      ;(root.getFileHandle as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        Object.assign(new Error('Not allowed'), { name: 'NotAllowedError' })
      )
      const data = new ArrayBuffer(4)
      await expect(writeFile(root, 'fail.pdf', data)).rejects.toThrow(/permission denied|not allowed/i)
    })
  })
})
