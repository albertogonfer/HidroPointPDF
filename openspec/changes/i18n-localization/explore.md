# Exploration: i18n-localization

## Current State

The app has **no i18n infrastructure** today. Strings are hardcoded directly in JSX across 9 files. There is a curious language split already present:

- **`src/adapters/feedback-reporting/`** — already written in Spanish (FeedbackForm, FeedbackPage use `"Descripción del error"`, `"Enviar reporte"`, `"Reportar problema de parseo"`, etc.)
- **`src/adapters/pdf-renaming/`** — written in English (`"Rename PDFs"`, `"Drop PDF files here"`, `"Write files"`, etc.)
- **`src/router.tsx`** — mixed: nav labels in English (`"Rename"`, `"History"`, `"Settings"`), footer in English

`HistoryList.tsx` uses `toLocaleDateString('es-ES', ...)` hardcoded — dates are already locale-formatted for Spanish.

No i18n library is installed. No `src/i18n/` directory exists.

---

## All Strings Requiring Translation Keys

### `src/router.tsx`
| Key | ES | EN |
|-----|----|----|
| `nav.rename` | Renombrar | Rename |
| `nav.history` | Historial | History |
| `nav.settings` | Ajustes | Settings |
| `app.loading` | Cargando… | Loading… |
| `footer.tagline` | HidroPoint Barcelona — todos los datos permanecen en tu navegador | HidroPoint Barcelona — all data stays in your browser |

**String count: 5**

---

### `src/adapters/pdf-renaming/components/BrowserWarning.tsx`
| Key | ES | EN |
|-----|----|----|
| `browserWarning.title` | Se requiere navegador Chromium | Chromium browser required |
| `browserWarning.description` | La escritura de archivos requiere Chrome 86+ o Edge 86+. Firefox y Safari no están soportados. Podés previsualizar los nombres propuestos, pero no se pueden escribir archivos al disco. | File writing requires Chrome 86+ or Edge 86+. Firefox and Safari are not supported. You can still preview proposed renames, but files cannot be written to disk. |

**String count: 2**

---

### `src/adapters/pdf-renaming/components/DropZone.tsx`
| Key | ES | EN |
|-----|----|----|
| `dropZone.processing` | Procesando archivos… | Processing files… |
| `dropZone.release` | Soltá para agregar archivos | Release to add files |
| `dropZone.idle` | Soltá archivos PDF acá | Drop PDF files here |
| `dropZone.hint` | Múltiples archivos soportados — solo facturas | Multiple files supported — invoices only |

**String count: 4**

---

### `src/adapters/pdf-renaming/components/PreviewTable.tsx`
| Key | ES | EN |
|-----|----|----|
| `previewTable.empty` | Sin archivos para previsualizar | No files to preview yet |
| `previewTable.header` | `{{count}} archivo{{s}} para renombrar` | `{{count}} file{{s}} to rename` |
| `previewTable.col.original` | Original | Original |
| `previewTable.col.company` | Empresa | Company |
| `previewTable.col.finalName` | Nombre final | Final name |
| `previewTable.col.status` | Estado | Status |
| `previewTable.editHint` | Editá cualquier nombre antes de confirmar. Los cambios quedan registrados. | Edit any filename before confirming. Changes are tracked. |
| `previewTable.confirm` | Escribir archivos | Write files |
| `previewTable.reportLink` | Reportar problema | Reportar problema *(already ES — keep key)* |
| `status.override` | override | override |
| `status.stub` | stub — revisar | stub — review |
| `status.low` | confianza baja | low confidence |
| `status.ready` | listo | ready |

**String count: 13**

> ⚠️ Note: `statusConfig` labels are hardcoded strings inside an object literal, not JSX — will need refactoring to use `t()` inside the component rather than at module level.

---

### `src/adapters/pdf-renaming/components/HistoryList.tsx`
| Key | ES | EN |
|-----|----|----|
| `history.search.placeholder` | Buscar por nombre original o final… | Search by original or final name… |
| `history.empty` | Sin historial de renombrados | No rename history yet |
| `history.pagination.label` | Página {{page}} de {{total}} | Page {{page}} of {{total}} |
| `history.pagination.prev` | ← Anterior | ← Prev |
| `history.pagination.next` | Siguiente → | Next → |
| `history.badge.override` | override | override |

**String count: 6**

> Note: `formatDate` uses `'es-ES'` locale hardcoded. Must be driven by current i18n language at runtime.

---

### `src/adapters/pdf-renaming/pages/IntakePage.tsx`
| Key | ES | EN |
|-----|----|----|
| `intake.title` | Renombrar PDFs | Rename PDFs |
| `intake.subtitle` | Soltá facturas en PDF — la app propone un nombre de archivo normalizado para cada una. | Drop invoice PDFs — the app proposes a normalized filename for each one. |

**String count: 2**

---

### `src/adapters/pdf-renaming/pages/HistoryPage.tsx`
| Key | ES | EN |
|-----|----|----|
| `historyPage.title` | Historial de renombrados | Rename History |
| `historyPage.subtitle` | Todos los trabajos anteriores, almacenados localmente en tu navegador. | All past rename jobs, stored locally in your browser. |

**String count: 2**

---

### `src/adapters/pdf-renaming/pages/SettingsPage.tsx`
| Key | ES | EN |
|-----|----|----|
| `settingsPage.title` | Ajustes | Settings |
| `settingsPage.subtitle` | Plantillas de reglas de renombrado y configuración de empresas. | Renaming rule templates and company configuration. |
| `settingsPage.comingSoon` | Próximamente | Coming soon |
| `settingsPage.comingSoonDetail` | Las plantillas de AXA y GENERALI serán configurables aquí cuando estén disponibles los archivos de muestra de 2025. | AXA and GENERALI templates will be configurable here once 2025 sample files are available. |

**String count: 4**

---

### `src/adapters/feedback-reporting/pages/FeedbackPage.tsx`
| Key | ES | EN |
|-----|----|----|
| `feedbackPage.title` | Reportar problema de parseo | Report a parsing issue |
| `feedbackPage.subtitle` | Completá el formulario para ayudarnos a mejorar el analizador de PDFs. | Fill in the form to help us improve the PDF parser. |
| `feedbackPage.context.company` | Empresa | Company |
| `feedbackPage.context.original` | Archivo original | Original file |
| `feedbackPage.context.proposed` | Nombre propuesto | Proposed name |

**String count: 5**

---

### `src/adapters/feedback-reporting/components/FeedbackForm.tsx`
| Key | ES | EN |
|-----|----|----|
| `feedbackForm.success` | Reporte enviado — | Report submitted — |
| `feedbackForm.success.viewIssue` | ver issue #{{number}} | view issue #{{number}} |
| `feedbackForm.description.label` | Descripción del error | Error description |
| `feedbackForm.description.placeholder` | Describí qué salió mal con el nombre propuesto... | Describe what went wrong with the proposed name... |
| `feedbackForm.expectedName.label` | Nombre correcto del archivo | Correct filename |
| `feedbackForm.consent` | Este archivo contiene datos de facturas. Confirmo que quiero compartirlo para ayudar a corregir el error. | This file contains invoice data. I confirm I want to share it to help fix the error. |
| `feedbackForm.file.label` | Adjuntar PDF (opcional, máx. 3 MB) | Attach PDF (optional, max 3 MB) |
| `feedbackForm.file.sizeError` | El archivo excede el tamaño máximo de 3 MB. | File exceeds the maximum size of 3 MB. |
| `feedbackForm.submit` | Enviar reporte | Submit report |
| `feedbackForm.submitting` | Enviando… | Submitting… |
| `feedbackForm.error.validation` | Por favor completá los campos requeridos antes de enviar. | Please fill in the required fields before submitting. |
| `feedbackForm.error.generic` | Ocurrió un error al enviar el reporte. Intentá nuevamente. | An error occurred while submitting the report. Please try again. |

**String count: 12**

---

### TOTAL STRING COUNT: **55 keys**

---

## Affected Areas

- `src/router.tsx` — nav labels, footer, loading fallback; language switcher dropdown added here
- `src/adapters/pdf-renaming/components/BrowserWarning.tsx` — 2 strings
- `src/adapters/pdf-renaming/components/DropZone.tsx` — 4 strings
- `src/adapters/pdf-renaming/components/PreviewTable.tsx` — 13 strings (incl. statusConfig refactor)
- `src/adapters/pdf-renaming/components/HistoryList.tsx` — 6 strings + `formatDate` locale fix
- `src/adapters/pdf-renaming/pages/IntakePage.tsx` — 2 strings
- `src/adapters/pdf-renaming/pages/HistoryPage.tsx` — 2 strings
- `src/adapters/pdf-renaming/pages/SettingsPage.tsx` — 4 strings
- `src/adapters/feedback-reporting/pages/FeedbackPage.tsx` — 5 strings
- `src/adapters/feedback-reporting/components/FeedbackForm.tsx` — 12 strings (error messages in catch blocks)
- `src/i18n/index.ts` — **CREATE**: i18next configuration, languageDetector setup, localStorage persistence
- `src/i18n/locales/es.json` — **CREATE**: 55 Spanish keys (default language)
- `src/i18n/locales/en.json` — **CREATE**: 55 English keys
- `src/main.tsx` — **MODIFY**: import `src/i18n/index.ts` before rendering
- `src/router.tsx` — **MODIFY**: add language switcher `<select>` in header nav area

---

## Approaches

### 1. Standard i18next + react-i18next (recommended)
Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`. Create `src/i18n/index.ts` that configures the instance with `LanguageDetector` (localStorage key: `hidropoint-lang`), `initReactI18next`, and inline `resources` (import the two JSON files directly — no HTTP backend needed for a Vite SPA with only 55 keys).

- **Pros**: Industry standard; full TypeScript support via `declare module`; works with Vite tree-shaking; `useTranslation()` hook is idiomatic React; `Trans` component handles rich text (like the success banner with `<a>`)
- **Cons**: Adds ~20 KB gzipped to bundle (i18next + react-i18next)
- **Effort**: Low

### 2. Lightweight custom context + JSON
Implement a `LanguageContext` with `useReducer`, read from `localStorage`, load JSON via dynamic `import()`.

- **Pros**: Zero dependency; full control; tiny bundle delta
- **Cons**: Reinventing the wheel; no interpolation, plural, or `Trans` support out of the box; maintenance overhead grows with string count; no ecosystem tooling
- **Effort**: Medium (and worse long-term)

---

## Recommendation

**Option 1 — i18next + react-i18next + i18next-browser-languagedetector.**

Reasons:
1. The 55-key catalog will grow as features ship (Settings page, dashboard, reconciliation).
2. `FeedbackForm` already has interpolation needs (`ver issue #{{number}}`) and a rich-text success banner — `Trans` component handles this cleanly.
3. `HistoryList.formatDate` needs locale awareness — `i18next.language` drives `toLocaleDateString` trivially.
4. `statusConfig` labels (currently a static object) need to move inside the component so `t()` is in scope — minor refactor, not a blocker.
5. Vite handles JSON imports natively; no `i18next-http-backend` needed.
6. No Tailwind v4 interaction whatsoever — i18next is pure JS, no CSS concerns.

**Language switcher**: a plain `<select>` in `router.tsx` next to the existing `<nav>`, calling `i18n.changeLanguage(value)`. localStorage is handled automatically by `LanguageDetector` with `caches: ['localStorage']`.

**Default language**: `es`. `LanguageDetector` fallback order: `localStorage → navigator → 'es'`.

---

## Risks

- **`statusConfig` static object**: labels are at module scope, outside any React component. Moving them inside `PreviewTable` (or making them a function that receives `t`) is required — low effort but easy to miss.
- **`formatDate` hardcoded `'es-ES'`**: must read from `i18next.language` (or a locale map) at call time. Currently called from `HistoryList` — needs to accept locale or be replaced with a hook-based approach.
- **`FeedbackForm` error messages in `catch` block**: these are plain JS strings, not JSX — `useTranslation` must be called at component top level and `t()` called inside the catch. Standard pattern, just don't forget.
- **React 19 + i18next**: react-i18next v15 has explicit React 19 support. Must install `react-i18next@^15` — older v14 had `useTranslation` issues with React 19 concurrent features.
- **Bundle size**: ~20 KB gzipped added. Acceptable for this app size.
- **No pluralization complexity**: only one plural case in the app (`{{count}} file(s) to rename`). i18next's `_plural` key convention handles this with one extra key per locale — `previewTable.header_one` / `previewTable.header_other`.

---

## Files to Create

```
src/
  i18n/
    index.ts          ← i18next config + init
    locales/
      es.json         ← 55+ Spanish keys (default)
      en.json         ← 55+ English keys
```

## Files to Modify

```
src/main.tsx                                              ← import './i18n'
src/router.tsx                                            ← add <LanguageSwitcher /> in header
src/adapters/pdf-renaming/components/PreviewTable.tsx     ← move statusConfig inside component
src/adapters/pdf-renaming/components/HistoryList.tsx      ← fix formatDate locale
src/adapters/pdf-renaming/components/BrowserWarning.tsx   ← useTranslation
src/adapters/pdf-renaming/components/DropZone.tsx         ← useTranslation
src/adapters/pdf-renaming/pages/IntakePage.tsx            ← useTranslation
src/adapters/pdf-renaming/pages/HistoryPage.tsx           ← useTranslation
src/adapters/pdf-renaming/pages/SettingsPage.tsx          ← useTranslation
src/adapters/feedback-reporting/pages/FeedbackPage.tsx    ← useTranslation
src/adapters/feedback-reporting/components/FeedbackForm.tsx ← useTranslation (incl. catch blocks)
```

---

## Ready for Proposal

**Yes.** The scope is fully bounded, all strings are catalogued (55 keys), the approach is clear, and there are no architectural unknowns. The main non-obvious task is the `statusConfig` refactor and the `formatDate` locale fix — both are small.
