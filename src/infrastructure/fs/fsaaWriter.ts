/**
 * File System Access API writer utilities.
 * Handles folder navigation, file creation, and permission errors.
 */

/**
 * Typed error for FSAA failures — carries a user-readable message for display in the UI.
 */
export class FsaaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FsaaError'
  }
}

/**
 * Prompts the user to pick a root directory via the File System Access API.
 */
export async function requestRoot(): Promise<FileSystemDirectoryHandle> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new FsaaError('File System Access API is not supported in this browser.')
  }

  try {
    return await (window as Window & { showDirectoryPicker(): Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
  } catch (err: unknown) {
    const error = err as DOMException
    if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
      throw new FsaaError('Permission denied: the browser blocked access to the file system.')
    }
    if (error.name === 'AbortError') {
      throw new FsaaError('Folder selection was cancelled by the user.')
    }
    throw err
  }
}

/**
 * Navigates (and optionally creates) a chain of subdirectories under root.
 * Returns the deepest directory handle.
 */
export async function resolveSubfolder(
  root: FileSystemDirectoryHandle,
  parts: string[],
): Promise<FileSystemDirectoryHandle> {
  let current = root
  for (const part of parts) {
    try {
      current = await current.getDirectoryHandle(part, { create: true })
    } catch (err: unknown) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        throw new FsaaError(`Permission denied: cannot access folder "${part}". Check folder permissions.`)
      }
      throw err
    }
  }
  return current
}

/**
 * Writes an ArrayBuffer to a file at the given relative path under root.
 * Path segments are separated by '/'. Intermediate directories are created.
 */
export async function writeFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  data: ArrayBuffer,
): Promise<void> {
  const parts = relativePath.split('/').filter(Boolean)
  const fileName = parts.pop()!
  const folder = await resolveSubfolder(root, parts)

  let fileHandle: FileSystemFileHandle
  try {
    fileHandle = await folder.getFileHandle(fileName, { create: true })
  } catch (err: unknown) {
    const error = err as DOMException
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      throw new FsaaError(`Permission denied: cannot write "${fileName}". Check folder permissions.`)
    }
    throw err
  }

  const writable = await fileHandle.createWritable()
  await writable.write(data)
  await writable.close()
}
