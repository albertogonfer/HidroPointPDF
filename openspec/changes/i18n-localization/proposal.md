# Proposal: i18n Localization (ES/EN)

## Intent

The app mixes Spanish and English strings across 9 adapter files with no i18n infrastructure. Users need a consistent Spanish-first experience with the ability to switch to English. All 55 user-facing strings must be translatable, with language preference persisted in localStorage.

## Scope

### In Scope
- i18next + react-i18next setup with Spanish default, English fallback
- Language switcher `<select>` in header nav, persisted to `localStorage` key `hidropoint-lang`
- 55 translation keys in `es.json` and `en.json`
- `statusConfig` labels refactored to use `t()` inside component
- `formatDate` locale driven by `i18n.language`
- `Trans` component for FeedbackForm success banner (inline `<a>`)

### Out of Scope
- RTL languages or additional locales beyond ES/EN
- Server-side rendering or SSR i18n
- Pluralization beyond the single `previewTable.header` case

## Capabilities

### New Capabilities
- `i18n`: i18next initialization, language detection, localStorage persistence, and LanguageSwitcher UI

### Modified Capabilities
- None (no existing specs)

## Approach

Install `i18next`, `react-i18next@^15`, `i18next-browser-languagedetector`. Create `src/i18n/index.ts` with inline resources (JSON imports). Import in `main.tsx` before render. Add `<select>` switcher in `router.tsx` header. Replace all hardcoded strings with `t()` calls across 9 adapter files.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/i18n/` | New | i18next config + locale JSON files |
| `src/main.tsx` | Modified | Import `./i18n` |
| `src/router.tsx` | Modified | Add LanguageSwitcher, translate nav/footer |
| `src/adapters/pdf-renaming/components/` | Modified | 4 files: `t()` for all strings, `statusConfig` refactor, `formatDate` locale |
| `src/adapters/pdf-renaming/pages/` | Modified | 3 files: `t()` for titles/subtitles |
| `src/adapters/feedback-reporting/` | Modified | 2 files: `t()` for form labels, errors, success banner with `Trans` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `statusConfig` at module scope breaks `t()` | Med | Move inside component or wrap in function receiving `t` |
| react-i18next v14 incompatible with React 19 | Low | Pin `react-i18next@^15` which has explicit React 19 support |

## Rollback Plan

Remove `src/i18n/` directory, revert `main.tsx` import, revert all `t()` calls to hardcoded strings, uninstall i18next packages. Git revert of the feature branch.

## Dependencies

- `i18next` (npm)
- `react-i18next@^15` (npm)
- `i18next-browser-languagedetector` (npm)

## Success Criteria

- [ ] App loads in Spanish by default
- [ ] Switching to EN translates all 55 strings immediately
- [ ] Language preference survives page reload (localStorage)
- [ ] `formatDate` respects current language
- [ ] `FeedbackForm` success banner renders clickable link via `Trans`
