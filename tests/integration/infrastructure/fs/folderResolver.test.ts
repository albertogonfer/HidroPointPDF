import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveFolder } from '@/infrastructure/fs/folderResolver'

// Mock DB
vi.mock('@/infrastructure/db/index', () => ({
  getDb: vi.fn().mockReturnValue({
    query: vi.fn().mockImplementation((sql: string, params: unknown[]) => {
      const companyId = params[0] as string
      const map: Record<string, { folder_prefix: string; name: string }> = {
        INTERPARTNER: { folder_prefix: '01', name: 'INTERPARTNER' },
        SANTA_LUCIA: { folder_prefix: '02', name: 'SANTA LUCIA' },
        IRIS: { folder_prefix: '03', name: 'IRIS' },
        AXA: { folder_prefix: '04', name: 'AXA' },
        ISERVIS: { folder_prefix: '05', name: 'ISERVIS' },
        GENERALI: { folder_prefix: '06', name: 'GENERALI' },
        RDS: { folder_prefix: '07', name: 'RDS' },
      }
      const row = map[companyId]
      return Promise.resolve({ rows: row ? [row] : [] })
    }),
  }),
}))

describe('folderResolver', () => {
  it('resolves INTERPARTNER + 2025-01 to correct path', async () => {
    const parts = await resolveFolder('INTERPARTNER', '2025-01-15')
    expect(parts).toEqual(['01 INTERPARTNER', '2025', '01 ENERO'])
  })

  it('resolves SANTA_LUCIA + 2024-06 correctly', async () => {
    const parts = await resolveFolder('SANTA_LUCIA', '2024-06-10')
    expect(parts).toEqual(['02 SANTA LUCIA', '2024', '06 JUNIO'])
  })

  it('resolves AXA correctly', async () => {
    const parts = await resolveFolder('AXA', '2024-12-01')
    expect(parts).toEqual(['04 AXA', '2024', '12 DICIEMBRE'])
  })

  it('throws when company not found in DB', async () => {
    await expect(resolveFolder('UNKNOWN_CO' as any, '2024-01-01')).rejects.toThrow(/not found|unknown/i)
  })

  it('throws when date is null or invalid', async () => {
    await expect(resolveFolder('INTERPARTNER', null as any)).rejects.toThrow(/invalid date/i)
  })

  it('handles partial ISO date (YYYY-MM)', async () => {
    const parts = await resolveFolder('INTERPARTNER', '2025-03')
    expect(parts).toEqual(['01 INTERPARTNER', '2025', '03 MARZO'])
  })
})
