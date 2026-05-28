import { describe, it, expect } from 'vitest'
import { stripAccents } from '@/domain/pdf-renaming/services/stripAccents'

describe('stripAccents', () => {
  it('strips ñ → n', () => {
    expect(stripAccents('España')).toBe('Espana')
  })

  it('strips ü → u', () => {
    expect(stripAccents('über')).toBe('uber')
  })

  it('strips ç → c', () => {
    expect(stripAccents('façade')).toBe('facade')
  })

  it('strips á → a', () => {
    expect(stripAccents('García')).toBe('Garcia')
  })

  it('strips é → e', () => {
    expect(stripAccents('étoile')).toBe('etoile')
  })

  it('strips í → i', () => {
    expect(stripAccents('María')).toBe('Maria')
  })

  it('strips ó → o', () => {
    expect(stripAccents('Gómez')).toBe('Gomez')
  })

  it('strips ú → u', () => {
    expect(stripAccents('Múnich')).toBe('Munich')
  })

  it('handles strings with no accents unchanged', () => {
    expect(stripAccents('Hello World')).toBe('Hello World')
  })

  it('handles empty string', () => {
    expect(stripAccents('')).toBe('')
  })

  it('handles mixed accented and non-accented', () => {
    expect(stripAccents('Pérez López')).toBe('Perez Lopez')
  })
})
