import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { createTestI18n } from '../../helpers/i18nForTests'

// These tests will fail until i18n is set up — RED phase
describe('i18n bootstrap', () => {
  it('default language is es', async () => {
    // Once src/i18n/index.ts is created, this should pass
    const { default: i18n } = await import('@/i18n/index')
    expect(i18n.language).toBe('es')
  })

  it('es.json has nav.rename key', async () => {
    const es = (await import('@/i18n/locales/es.json')).default as Record<string, string>
    expect(es['nav.rename']).toBe('Renombrar')
  })

  it('en.json has nav.rename key', async () => {
    const en = (await import('@/i18n/locales/en.json')).default as Record<string, string>
    expect(en['nav.rename']).toBe('Rename')
  })

  it('es.json and en.json have parity (same keys)', async () => {
    const es = (await import('@/i18n/locales/es.json')).default as Record<string, string>
    const en = (await import('@/i18n/locales/en.json')).default as Record<string, string>
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })
})

describe('i18n LanguageSwitcher', () => {
  let i18n: ReturnType<typeof createTestI18n>

  beforeEach(() => {
    i18n = createTestI18n('es')
  })

  it('renders ES and EN options', async () => {
    const { LanguageSwitcher } = await import('@/adapters/shared/components/LanguageSwitcher')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <LanguageSwitcher />
        </MemoryRouter>
      </I18nextProvider>
    )
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByDisplayValue(/español|es/i)).toBeInTheDocument()
  })

  it('calls i18n.changeLanguage on select change', async () => {
    const { LanguageSwitcher } = await import('@/adapters/shared/components/LanguageSwitcher')
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <LanguageSwitcher />
        </MemoryRouter>
      </I18nextProvider>
    )
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'en' } })
    expect(i18n.language).toBe('en')
  })
})
