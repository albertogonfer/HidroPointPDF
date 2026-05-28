# Exploration: feedback-reporting

## Current State

The app is a fully client-side React 19 + Vite SPA deployed on Vercel. The core loop is:
1. User drops PDFs on `IntakePage` → parser extracts invoice metadata → `PreviewTable` shows proposed filenames → user confirms → files are renamed via FSAA.
2. `rename_jobs` table in PGlite records every rename (original_name, proposed_name, final_name, company_id).
3. No server-side code exists today — `vercel.json` only sets COOP/COEP headers required by PGlite WASM.
4. No feedback, error-reporting, or external-network path exists anywhere in the codebase.

Parser failures surface silently: if the proposed name looks wrong, the user just types over it (`updateFinalName` in `dropZoneStore`). There is no structured way to report the failure upstream.

## Affected Areas

- `src/adapters/pdf-renaming/pages/IntakePage.tsx` — needs a "Report wrong name" trigger after a rename row is overridden
- `src/adapters/pdf-renaming/components/PreviewTable.tsx` — row-level action to open feedback form
- `src/adapters/pdf-renaming/store/dropZoneStore.ts` — already tracks `hasOverride`; can use that flag
- `src/router.tsx` — needs `/feedback` route for standalone page
- `src/infrastructure/db/schema.sql` — new `feedback_reports` table for local history
- `vercel.json` — must NOT route `/api/*` through static headers (Functions bypass it automatically)
- `api/feedback.ts` *(new)* — Vercel Function: secure proxy for GitHub + Supabase
- `src/domain/feedback-reporting/` *(new)* — domain model + port for feedback
- `src/application/feedback-reporting/` *(new)* — use-case: submit feedback
- `src/adapters/feedback-reporting/` *(new)* — form components + page + store
- `src/infrastructure/feedback/` *(new)* — client-side HTTP adapter calling `api/feedback.ts`

## Hexagonal Layer Boundaries

```
Domain (pure, no I/O):
  FeedbackReport entity — { id, companyId, originalName, proposedName, expectedName, description, pdfAttached, gdprConsent, submittedAt, githubIssueUrl }
  FeedbackReportRepository port — save(report): Promise<void>
  FeedbackSubmitter port — submit(report, pdfBlob?): Promise<{ issueUrl: string }>

Application:
  submitFeedback use-case — orchestrates: validate consent → call submitter → persist to local DB

Infrastructure:
  VercelFunctionFeedbackSubmitter — multipart POST to /api/feedback, receives { issueUrl }
  PGliteFeedbackRepository — INSERT into feedback_reports

Adapters:
  FeedbackPage / FeedbackForm component (driven adapter)
  FeedbackStore (Zustand)

Vercel Function (api/feedback.ts — outside the hexagon):
  Receives multipart/form-data (JSON fields + optional PDF blob)
  Uploads PDF to Supabase Storage using service key
  Creates GitHub Issue via REST API using token
  Returns { issueUrl, storageUrl }
```

## New Infrastructure Required

| Item | Purpose | Notes |
|------|---------|-------|
| Supabase project | PDF storage | Free tier: 1 GB. Bucket: `feedback-pdfs`, public read OFF. |
| `SUPABASE_URL` env var (Vercel) | Base URL for storage API | Never in client bundle |
| `SUPABASE_SERVICE_KEY` env var (Vercel) | Bypasses RLS for upload | Service key ≠ anon key |
| `GITHUB_TOKEN` env var (Vercel) | Create issues via API | Fine-grained PAT: `issues:write` on one repo only |
| `GITHUB_REPO` env var (Vercel) | `owner/repo` target | E.g. `albertogonfer/HidroPointPDF` |
| `api/feedback.ts` | Vercel Function | Receives form, calls Supabase + GitHub |

## Approaches

### Approach 1 — Vercel Function with `multipart/form-data` (recommended)
The browser sends a single `FormData` POST to `/api/feedback`. The function parses it with the Node.js `formidable` library (or the native `request.formData()` in Edge runtime), uploads the PDF blob to Supabase Storage, creates the GitHub issue, and returns `{ issueUrl, storageUrl }`.

- **Pros**: One round-trip; no pre-signed URL dance; PDF never hits the client bundle; works within Vercel Hobby 4.5 MB body limit for PDFs up to ~4 MB compressed
- **Cons**: Vercel Hobby Functions have a **4.5 MB request body limit** — invoices are typically < 1 MB so this is fine, but must be documented; CORS must be explicitly allowed for the function route
- **Effort**: Medium

### Approach 2 — Client-side pre-signed URL + separate Issue creation call
Frontend fetches a pre-signed upload URL from a lightweight `/api/storage-token` function, uploads directly to Supabase from the browser, then calls `/api/create-issue` with the storage path.

- **Pros**: Bypasses Vercel's body size limit; direct browser→Supabase transfer
- **Cons**: Two separate server round-trips; more complex error handling; pre-signed URL leaks storage path to the browser; requires CORS on Supabase bucket
- **Effort**: High

### Approach 3 — GitHub Discussion instead of GitHub Issue
Use GitHub Discussions API for less noise on the Issues tracker.

- **Pros**: Keeps Issues clean; Discussions have categories
- **Cons**: GraphQL-only API (more complex); requires Discussions enabled on the repo; non-standard; harder to triage
- **Effort**: Medium-High

## Recommendation

**Approach 1** — single multipart POST to `api/feedback.ts`. Invoice PDFs are small (< 1 MB typical) so the 4.5 MB Vercel limit is not a real constraint. Keeping everything in one function call simplifies error handling and keeps the client code minimal.

The form itself: 4 fields max.
1. "What company / invoice was this?" (text, pre-filled from `companyId` if available)
2. "What name did the app suggest?" (text, pre-filled from `proposedName`)
3. "What should the correct name be?" (text, required)
4. "Anything else to add?" (textarea, optional)
5. Attach PDF checkbox — triggers a visible GDPR consent banner before enabling the file input.

## GitHub Issue Template

```markdown
## Parser Failure Report

**Company**: {company}
**Original filename**: `{originalName}`
**App proposed**: `{proposedName}`
**Expected name**: `{expectedName}`

### User description
{description}

### Attached PDF
{storageUrl or "Not attached"}

---
*Submitted via HidroPointPDF feedback form — {timestamp}*
*Labels: bug, parser-failure*
```

## GDPR / Consent Design

- The PDF attachment field is HIDDEN by default.
- A checkbox labelled "I want to attach the PDF to help diagnose the problem" reveals it.
- When checked, a prominent warning is shown: "⚠️ This PDF may contain client names, invoice amounts, and other confidential data. It will be stored securely and used only to fix the parser. Check this box to confirm you consent to sharing it."
- Consent boolean is sent to the Vercel Function and stored in `feedback_reports.gdpr_consent`.
- Supabase bucket is PRIVATE — no public URL is generated; only the storage path is logged in the GitHub issue (accessible only to repo collaborators).

## PGlite Schema Addition

```sql
CREATE TABLE IF NOT EXISTS feedback_reports (
  id            SERIAL PRIMARY KEY,
  job_id        INT REFERENCES rename_jobs(id),
  company_id    TEXT REFERENCES companies(id),
  original_name TEXT NOT NULL,
  proposed_name TEXT NOT NULL,
  expected_name TEXT NOT NULL,
  description   TEXT,
  pdf_attached  BOOLEAN DEFAULT false,
  gdpr_consent  BOOLEAN DEFAULT false,
  github_url    TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT now()
);
```

## Risks

- **Vercel 4.5 MB body limit**: Real but manageable — invoice PDFs are almost always < 500 KB. Must add client-side size validation (reject > 3 MB with a clear message) and document the constraint.
- **CORS on `/api/feedback`**: By default Vercel Functions share the same origin as the static site, so no CORS issue for same-origin requests. Would only matter if the function is ever called from a different domain.
- **Supabase anon key vs service key**: NEVER use the anon key server-side for write operations — it respects RLS policies which may block uploads. The service key bypasses RLS and must live ONLY in the Vercel Function environment, never in the client bundle. The frontend sends zero Supabase credentials.
- **GitHub token scope**: Use a fine-grained PAT scoped to `issues:write` on the single target repo. Rotate it. If the repo goes private, the token still works but issue visibility is limited to collaborators.
- **COOP/COEP headers on `/api/` routes**: The current `vercel.json` applies `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to ALL routes (`/(.*)`). This will break the Vercel Function responses for browsers that enforce these headers on API calls. The `vercel.json` must be updated to EXCLUDE `/api/(.*)` from those headers.
- **PGlite persistence**: PGlite uses IndexedDB — local feedback history is device-specific and disappears if the user clears browser storage. This is acceptable for this use case.
- **Free tier limits**: Supabase 1 GB storage; at ~500 KB per PDF that's ~2000 reports before hitting the limit. Acceptable for now — file cleanup policy should be noted.
- **Edge vs Node.js runtime**: Vercel Edge Runtime does not support `formidable`. Use Node.js runtime (`export const config = { runtime: 'nodejs' }`) or use the Web Streams `request.formData()` API which IS available in Edge. Simplest path: Node.js runtime with the native `FormData` parser in Node 20+.

## Ready for Proposal

**Yes.** The architecture is clear, risks are identified and manageable, and the hexagonal boundaries map cleanly to the existing codebase. Recommended next step: `sdd-propose` to formalize intent, scope, rollback plan, and affected domains (new domain: `feedback-reporting`; cross-cutting: `pdf-renaming` for the IntakePage trigger).
