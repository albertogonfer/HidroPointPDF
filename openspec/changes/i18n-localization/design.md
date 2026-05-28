# Design: i18n Localization (ES/EN)

## Technical Approach

Use i18next with react-i18next v15 and browser language detector. Inline JSON resources (no HTTP backend). Import i18n config in `main.tsx` before React renders. Flat key namespace with dot-notation grouping. This stays fully client-side — no edge functions needed.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| i18n library | i18next + react-i18next v15 | Custom React context | Industry standard; `Trans` component for rich text; interpolation/plurals built-in; React 19 compatible |
| Resource loading | Inline JSON imports | i18next-http-backend | Only 55 keys, Vite handles JSON natively, no async loading needed |
| Key structure | Flat, dot-notation (`previewTable.status.ready`) | Namespaced | App is small; single namespace avoids `ns` config overhead |
| Default language | `lng: 'es'` with detection order `['localStorage']` | `navigator` first | Business requirement: Spanish default regardless of browser |
| LanguageSwitcher | `<select>` in header nav | Toggle button / dropdown menu | Matches existing nav simplicity; extensible to more locales later |

## Data Flow

```
main.tsx ──import──→ src/i18n/index.ts ──init──→ i18next instance
                          │                            │
                     es.json / en.json          localStorage('hidropoint-lang')
                                                       │
router.tsx ──→ <LanguageSwitcher> ──onChange──→ i18n.changeLanguage(lng)
                                                       │
Components ──→ useTranslation() ──→ t('key') ──→ re-render with new strings
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/i18n/index.ts` | Create | i18next init: `lng: 'es'`, `fallbackLng: 'en'`, detection `['localStorage']`, `lookupLocalStorage: 'hidropoint-lang'`, inline resources |
| `src/i18n/locales/es.json` | Create | 55 Spanish translation keys |
| `src/i18n/locales/en.json` | Create | 55 English translation keys |
| `src/main.tsx` | Modify | Add `import './i18n'` before React render |
| `src/router.tsx` | Modify | Add `<select>` LanguageSwitcher right of nav; translate nav labels, footer, loading text with `t()` |
| `src/adapters/pdf-renaming/components/PreviewTable.tsx` | Modify | Move `statusConfig` labels inside component using `t()`; translate table headers, edit hint, confirm button |
| `src/adapters/pdf-renaming/components/HistoryList.tsx` | Modify | `formatDate` reads `i18n.language` for locale; translate search, pagination, empty state |
| `src/adapters/pdf-renaming/components/BrowserWarning.tsx` | Modify | `useTranslation()` for 2 strings |
| `src/adapters/pdf-renaming/components/DropZone.tsx` | Modify | `useTranslation()` for 4 strings |
| `src/adapters/pdf-renaming/pages/IntakePage.tsx` | Modify | `useTranslation()` for title/subtitle |
| `src/adapters/pdf-renaming/pages/HistoryPage.tsx` | Modify | `useTranslation()` for title/subtitle |
| `src/adapters/pdf-renaming/pages/SettingsPage.tsx` | Modify | `useTranslation()` for 4 strings |
| `src/adapters/feedback-reporting/pages/FeedbackPage.tsx` | Modify | `useTranslation()` for 5 strings |
| `src/adapters/feedback-reporting/components/FeedbackForm.tsx` | Modify | `useTranslation()` for 12 strings; `Trans` for success banner with `<a>` |

## Interfaces / Contracts

```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: 'es',
    fallbackLng: 'en',
    detection: { order: ['localStorage'], lookupLocalStorage: 'hidropoint-lang' },
    interpolation: { escapeValue: false },
  })

export default i18n
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `t()` returns correct key per language | Create test i18n instance, wrap render in `I18nextProvider` |
| Unit | LanguageSwitcher changes language | Simulate select change, assert `i18n.language` updates |
| Unit | `statusConfig` labels reactive to language | Switch language mid-render, assert badge text changes |
| Integration | Full page renders all strings in ES/EN | Render IntakePage with test i18n, snapshot both languages |
| E2E | Language switch persists across reload | Playwright: switch to EN, reload, assert EN strings |

## Migration / Rollout

No migration required. Pure additive change — no data schema changes, no feature flags needed.

## Open Questions

None — all decisions resolved.
