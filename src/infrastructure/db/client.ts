import { PGlite } from '@electric-sql/pglite'

let instance: PGlite | null = null

export function getDb(): PGlite {
  if (!instance) {
    throw new Error('DB not initialized. Call initDb() first.')
  }
  return instance
}

export async function createDb(): Promise<PGlite> {
  instance = new PGlite()
  return instance
}
