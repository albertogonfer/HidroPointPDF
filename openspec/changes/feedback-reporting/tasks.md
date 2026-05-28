# Tasks: Feedback Reporting

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 520-760 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 foundation/tests → PR 2 UI/store/route → PR 3 API/integration |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain, schema, use-case, RED/GREEN unit tests | PR 1 | base = feature/tracker branch |
| 2 | Feedback page, store, PreviewTable link, UI tests | PR 2 | base = PR 1 branch |
| 3 | `api/feedback.ts`, `vercel.json`, integration tests | PR 3 | base = PR 2 branch |

## Phase 1: Foundation

- [x] 1.1 [domain: pdf] RED: add `tests/unit/domain/feedback-reporting/model/FeedbackReport.test.ts` for required fields, consent/file rules, and 3MB rejection.
- [x] 1.2 [domain: pdf] GREEN: create `src/domain/feedback-reporting/model/FeedbackReport.ts` plus `ports/IFeedbackSubmitter.ts` and `ports/IFeedbackRepository.ts`.
- [x] 1.3 [domain: pdf] RED: add `tests/unit/application/feedback-reporting/use-cases/submitFeedback.test.ts` for validate → submit → save and failure paths.
- [x] 1.4 [domain: pdf] GREEN: create `src/application/feedback-reporting/use-cases/submitFeedback.ts` and export via `src/application/feedback-reporting/use-cases/index.ts`.
- [x] 1.5 [domain: pdf] REFACTOR: update `src/infrastructure/db/index.ts` and `src/infrastructure/db/schema.sql` with `feedback_reports`; cover in `tests/unit/infrastructure/db/db-init.test.ts`.

## Phase 2: UI and Wiring

- [ ] 2.1 [domain: pdf] RED: add `tests/integration/adapters/pdf-renaming/components/PreviewTable.test.tsx` for “Report issue” visibility only on `hasOverride` rows.
- [ ] 2.2 [domain: pdf] GREEN: modify `src/adapters/pdf-renaming/components/PreviewTable.tsx` to link overridden rows to `/feedback` with company/original/proposed/final query params.
- [ ] 2.3 [domain: pdf] RED: add `tests/integration/adapters/feedback-reporting/pages/FeedbackPage.test.tsx` for prefill, required Spanish errors, consent gate, and success/error states.
- [ ] 2.4 [domain: pdf] GREEN: create `src/adapters/feedback-reporting/components/FeedbackForm.tsx`, `pages/FeedbackPage.tsx`, and `store/feedbackStore.ts` using the submit use-case.
- [ ] 2.5 [domain: pdf] REFACTOR: modify `src/router.tsx` for lazy `/feedback` routing and keep loading/navigation behavior consistent.

## Phase 3: Infrastructure and Verification

- [x] 3.1 [domain: pdf] RED: add `tests/integration/infrastructure/feedback/VercelFunctionFeedbackSubmitter.test.ts` for POST `/api/feedback` success and plain-language failure mapping.
- [x] 3.2 [domain: pdf] GREEN: create `src/infrastructure/feedback/VercelFunctionFeedbackSubmitter.ts` and `PGliteFeedbackRepository.ts`.
- [x] 3.3 [domain: pdf] RED: add `tests/integration/api/feedback.test.ts` for multipart-only requests, PDF magic bytes, missing fields, GitHub body format, and attachment/no-attachment flows.
- [x] 3.4 [domain: pdf] GREEN: create `api/feedback.ts` and modify `vercel.json` to exclude `/api/` from COOP/COEP while using env-only secrets.
- [x] 3.5 [domain: pdf] REFACTOR: run `npx vitest run` and fix any cross-layer regressions before apply moves to verification.
