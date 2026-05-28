# Design: Feedback Reporting

## Technical Approach

Add a new `feedback-reporting` bounded context following the existing hexagonal layout (`domain/ → application/ → infrastructure/ → adapters/`). A Vercel Function (`api/feedback.ts`) acts as a secure proxy — receives multipart FormData, uploads PDF to Supabase Storage, creates a GitHub Issue, and returns the issue URL. The frontend form submits via `fetch`, and the use-case orchestrates validation → submit → local save.

## Architecture Decisions

| Decision | Alternatives | Rationale |
|----------|-------------|-----------|
| Node.js runtime for Vercel Function | Edge runtime | Edge lacks multipart parsing and has 1MB body limit; Node.js supports `formData()` natively and allows 4.5MB |
| `fetch()` for GitHub + Supabase APIs | `octokit`, `@supabase/supabase-js` | Zero extra deps in the Function — faster cold starts, smaller bundle. Both APIs are simple REST calls |
| Separate `api/feedback.ts` (not in `src/`) | Client-side direct calls | Secrets (GitHub PAT, Supabase service key) must never reach the browser |
| COOP/COEP header exclusion via regex | Remove headers entirely | PGlite requires `SharedArrayBuffer` (needs COOP/COEP) on all app routes; only `/api/` must be excluded |
| Standalone `/feedback` page (not modal) | Modal dialog on IntakePage | Form has file upload + consent — modal would feel cramped; page allows deep-linking from PreviewTable |

## Data Flow

```
PreviewTable "Report issue" button
        │
        ▼
  FeedbackPage (/feedback?company=X&original=Y&proposed=Z&final=W)
        │
        ▼
  FeedbackForm (controlled, consent gate)
        │  submit
        ▼
  feedbackStore.submit()
        │
        ▼
  submitFeedback(use-case)
        │
        ├─→ validate(entity)
        │
        ├─→ IFeedbackSubmitter.submit(formData) ──→ POST /api/feedback
        │                                                │
        │                                    ┌───────────┴───────────┐
        │                                    ▼                       ▼
        │                              Supabase Storage      GitHub Issues API
        │                              (upload PDF)          (create issue)
        │                                    └───────────┬───────────┘
        │                                                ▼
        │                                    { issueUrl, issueNumber }
        │
        └─→ IFeedbackRepository.save(report) ──→ PGlite feedback_reports
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/feedback-reporting/model/FeedbackReport.ts` | Create | Pure entity type + `validate()` function |
| `src/domain/feedback-reporting/ports/IFeedbackSubmitter.ts` | Create | Port: `submit(data) → {issueUrl, issueNumber}` |
| `src/domain/feedback-reporting/ports/IFeedbackRepository.ts` | Create | Port: `save(report) → void` |
| `src/application/feedback-reporting/use-cases/submitFeedback.ts` | Create | Orchestrates validate → submit → save |
| `src/infrastructure/feedback/VercelFunctionFeedbackSubmitter.ts` | Create | Implements `IFeedbackSubmitter` via `fetch` to `/api/feedback` |
| `src/infrastructure/feedback/PGliteFeedbackRepository.ts` | Create | Implements `IFeedbackRepository` via PGlite |
| `src/infrastructure/db/index.ts` | Modify | Add `feedback_reports` table to `SCHEMA_SQL` |
| `src/infrastructure/db/schema.sql` | Modify | Add `feedback_reports` DDL (reference copy) |
| `src/adapters/feedback-reporting/components/FeedbackForm.tsx` | Create | Controlled form with consent gate and file input |
| `src/adapters/feedback-reporting/store/feedbackStore.ts` | Create | Zustand store: loading, error, success states |
| `src/adapters/feedback-reporting/pages/FeedbackPage.tsx` | Create | Page at `/feedback`, reads query params |
| `src/router.tsx` | Modify | Add lazy `/feedback` route |
| `src/adapters/pdf-renaming/components/PreviewTable.tsx` | Modify | Add "Report issue" link on `hasOverride` rows |
| `api/feedback.ts` | Create | Vercel Function: multipart parse → validate → Supabase upload → GitHub issue |
| `vercel.json` | Modify | Split header source to exclude `/api/` from COOP/COEP |

## Interfaces / Contracts

```typescript
// domain/feedback-reporting/model/FeedbackReport.ts
export type FeedbackReport = {
  companyId: string
  originalName: string
  proposedName: string
  expectedName: string
  description: string
  hadAttachment: boolean
  githubIssueUrl: string
  githubIssueNumber: number
  createdAt: Date
}

export type FeedbackInput = Omit<FeedbackReport, 'githubIssueUrl' | 'githubIssueNumber' | 'createdAt' | 'hadAttachment'> & {
  file?: File
}

// domain/feedback-reporting/ports/IFeedbackSubmitter.ts
export interface IFeedbackSubmitter {
  submit(data: FormData): Promise<{ issueUrl: string; issueNumber: number }>
}

// domain/feedback-reporting/ports/IFeedbackRepository.ts
export interface IFeedbackRepository {
  save(report: FeedbackReport): Promise<void>
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `FeedbackReport.validate()` — required fields, edge cases | Vitest, pure function |
| Unit | `submitFeedback` use-case — orchestration with mock ports | Vitest, mock `IFeedbackSubmitter` + `IFeedbackRepository` |
| Integration | Vercel Function `api/feedback.ts` — multipart parsing, validation errors | Vitest with mock `fetch` for GitHub/Supabase |
| E2E | Full form flow in browser | Manual (no Playwright setup exists) |

## Migration / Rollout

No migration required. The `feedback_reports` table is added via `CREATE TABLE IF NOT EXISTS` in the PGlite schema string — it runs on next app load. Vercel Function deploys automatically. Environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`, `GITHUB_TOKEN`, `GITHUB_REPO`) must be set in Vercel project settings before deploy.

## Open Questions

- [ ] Should the "Report issue" button also appear on rows where parsing failed entirely (no company detected), or only on overridden rows?
- [ ] Should feedback history be viewable in a dedicated UI, or is PGlite storage enough for now?
