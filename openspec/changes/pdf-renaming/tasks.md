# Tasks: PDF Renaming Engine

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900-1400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 bootstrap+DB → PR 2 parsers+engine → PR 3 UI+FSAA+history |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Bootstrap app, test harness, PGlite schema/seed | PR 1 | Base main; includes RED app smoke tests |
| 2 | Add parser registry, company parsers, renaming engine, stores | PR 2 | Base PR 1; keep FSAA/UI out |
| 3 | Add DropZone/Preview/History UI, FSAA writes, E2E, docs | PR 3 | Base PR 2; ships end-to-end flow |

## Phase 1: Foundation

- [x] 1.1 [pdf] Scaffold `package.json`, `tsconfig*.json`, `vite.config.ts`, `src/main.tsx`, and `src/router.tsx` for React 19 + TypeScript + Tailwind.
- [x] 1.2 [pdf] RED: add failing app/test harness checks in `vitest.config.ts`, `playwright.config.ts`, and `src/test/setup.ts` for intake/history routes.
- [x] 1.3 [pdf] GREEN: create `src/db/client.ts`, `src/db/schema.sql`, and `src/db/seed.ts` with `companies`, `renaming_rules`, `rename_jobs`, `invoice_registrations`.

## Phase 2: Parsers and Engine

- [x] 2.1 [pdf] RED: add unit tests in `src/domains/pdf-renaming/engine/*.test.ts` and `src/domains/pdf-renaming/parsers/*.test.ts` for normalization, templates, success, and stub/manual-override cases.
- [x] 2.2 [pdf] GREEN: create `src/domains/pdf-renaming/parsers/parser.interface.ts`, `parser-registry.ts`, `interpartner.parser.ts`, `santa-lucia.parser.ts`, `iris.parser.ts`, `iservis.parser.ts`, `rds.parser.ts`, `axa.parser.ts`, `generali.parser.ts`.
- [x] 2.3 [pdf] GREEN: implement `src/domains/pdf-renaming/engine/stripAccents.ts`, `templateInterpolator.ts`, and `renamingEngine.ts` using PGlite templates, extracted content, and payment-notification rules.
- [x] 2.4 [pdf] REFACTOR: add shared types and Zustand wiring in `src/domains/pdf-renaming/store/dropZoneStore.ts`, `sessionStore.ts`, and `historyStore.ts`.

## Phase 3: UI and File Writing

- [x] 3.1 [pdf] RED: write integration tests for multi-drop preview, row-only manual override, unsupported browser warning, and permission-denied handling in `src/domains/pdf-renaming/components/*.test.tsx`.
- [x] 3.2 [pdf] GREEN: create `src/domains/pdf-renaming/components/DropZone.tsx`, `PreviewTable.tsx`, `HistoryList.tsx`, `BrowserWarning.tsx`, and route wiring in `src/router.tsx`.
- [x] 3.3 [pdf] GREEN: implement `src/domains/pdf-renaming/fs/folderResolver.ts` and `fsaaWriter.ts` so confirm writes copies only after explicit approval and logs jobs to PGlite.

## Phase 4: Verification and Cleanup

- [x] 4.1 [pdf] REFACTOR: add Playwright coverage in `tests/pdf-renaming.spec.ts` for drop → confirm → write → audit log with mocked FSAA handles.
- [x] 4.2 [pdf] REFACTOR: document Chromium-only support and AXA/GENERALI stub limits in `README.md`; run `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`.
