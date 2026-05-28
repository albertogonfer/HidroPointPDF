# Tasks: i18n Localization (ES/EN)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 520-760 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 infra/router → PR 2 pdf adapters → PR 3 feedback + verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Bootstrap i18n, resources, switcher | PR 1 | base = feature/tracker branch; include router tests |
| 2 | Localize pdf-renaming views and date/status behavior | PR 2 | base = PR 1 branch; include adapter tests |
| 3 | Localize feedback flow and persistence verification | PR 3 | base = PR 2 branch; include e2e + cleanup |

## Phase 1: Foundation

- [ ] 1.1 [pdf][RED] Add `tests/unit/i18n/i18n-bootstrap.test.tsx` for default `es`, `hidropoint-lang` persistence, and header switcher language changes.
- [ ] 1.2 [pdf][GREEN] Create `src/i18n/index.ts`, `src/i18n/locales/es.json`, and `src/i18n/locales/en.json` with the 55 flat translation keys and localStorage detection.
- [ ] 1.3 [pdf][GREEN] Update `src/main.tsx` and `src/router.tsx` to import i18n, add the `<select>` switcher, and translate nav, footer, and loading copy.

## Phase 2: PDF Renaming Localization

- [ ] 2.1 [pdf][RED] Add `tests/unit/adapters/pdf-renaming/i18n-components.test.tsx` for `PreviewTable` status reactivity, `HistoryList` locale dates, and translated empty/search states.
- [ ] 2.2 [pdf][GREEN] Refactor `src/adapters/pdf-renaming/components/PreviewTable.tsx` so `statusConfig` is created at render time with `t()`, and translate headers, hints, CTA, and override link.
- [ ] 2.3 [pdf][GREEN] Update `src/adapters/pdf-renaming/components/HistoryList.tsx`, `BrowserWarning.tsx`, and `DropZone.tsx` to use `useTranslation()` and current-language date formatting.
- [ ] 2.4 [pdf][GREEN] Update `src/adapters/pdf-renaming/pages/IntakePage.tsx`, `HistoryPage.tsx`, and `SettingsPage.tsx` to translate titles, subtitles, and settings copy.

## Phase 3: Feedback Flow Localization

- [ ] 3.1 [pdf][RED] Add `tests/unit/adapters/feedback-reporting/feedback-i18n.test.tsx` for translated labels, validation/server errors, submit state, and success banner link rendering.
- [ ] 3.2 [pdf][GREEN] Update `src/adapters/feedback-reporting/pages/FeedbackPage.tsx` and `components/FeedbackForm.tsx` to use `useTranslation()` and `Trans` for the success banner `<a>`.

## Phase 4: Verification

- [ ] 4.1 [pdf] Add `tests/integration/i18n-localization.test.tsx` covering ES/EN render parity and the spec scenarios for Rename and Feedback pages.
- [ ] 4.2 [pdf] Add `tests/i18n-localization.spec.ts` for switch-to-EN, reload persistence, and immediate UI update without reload.
- [ ] 4.3 [pdf][REFACTOR] Remove remaining hardcoded strings in touched files, verify `es.json`/`en.json` key parity, then run `pnpm test`, `pnpm test:e2e`, `pnpm lint`, and `pnpm typecheck`.
