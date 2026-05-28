# Proposal: Feedback Reporting

## Intent

Allow non-technical users to report parser failures directly from the app. The report includes a description, the wrong/expected filenames, and optionally the PDF that failed (with explicit GDPR consent). A Vercel Function acts as a secure proxy to upload the PDF to Supabase Storage and create a GitHub Issue automatically, while a local PGlite record tracks the user's history.

## Scope

### In Scope
- Vercel Function (`api/feedback.ts`) to receive FormData, upload to Supabase, and create a GitHub Issue.
- Domain models and ports (`FeedbackReport`, `IFeedbackSubmitter`, `IFeedbackRepository`).
- Application use-case (`submitFeedback.ts`).
- Infrastructure DB schema update for `feedback_reports` table and local history repository.
- FeedbackForm UI with explicit GDPR consent for PDF attachment and 3MB size limit enforcement.
- Integration with `PreviewTable.tsx` to add a "Report issue" button on override rows.
- Fix `vercel.json` to exclude API routes from COOP/COEP headers.

### Out of Scope
- Server-side processing or PDF parsing (app remains strictly client-side).
- Reading GitHub issue status back into the UI.
- Direct-to-Supabase uploads from the client (avoiding pre-signed URL complexity).

## Capabilities

### New Capabilities
- `feedback-reporting`: Ability for users to report incorrect parser results directly to the repository maintainers, including metadata and optional GDPR-compliant PDF attachments.

### Modified Capabilities
- None

## Approach

Use a Vercel Function (Node.js runtime) with `multipart/form-data` to act as a secure proxy (Approach 1). The frontend sends a single POST request containing the form fields and optional PDF. The function uploads the PDF to Supabase Storage using a service key and creates a GitHub issue using a PAT, ensuring secrets never reach the client. Local history is stored in PGlite.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/feedback.ts` | New | Vercel Function proxy for Supabase and GitHub |
| `src/domain/feedback-reporting/` | New | Entity and repository/submitter ports |
| `src/application/feedback-reporting/` | New | `submitFeedback` use case |
| `src/adapters/feedback-reporting/` | New | Form UI, page, and Zustand store |
| `src/infrastructure/feedback/` | New | API submitter and PGlite repository |
| `src/adapters/pdf-renaming/components/PreviewTable.tsx` | Modified | Add trigger button on override rows |
| `src/infrastructure/db/schema.sql` | Modified | Add `feedback_reports` table |
| `vercel.json` | Modified | Exclude `/api/` from COOP/COEP headers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vercel 4.5MB request limit | High | Enforce strict 3MB max file size client-side |
| COOP/COEP blocking API requests | High | Update `vercel.json` to exclude `/api/(.*)` paths |
| Client-side token leakage | Low | Use Vercel env vars for Supabase Service Key and GitHub Token; no keys in frontend code |
| Unintended data exposure | Medium | Keep PDF input hidden until explicit GDPR consent is checked |

## Rollback Plan

- Revert `vercel.json` header changes.
- Delete `api/feedback.ts`.
- Remove the "Report issue" button from `PreviewTable.tsx`.
- Drop `feedback_reports` table from PGlite schema (or leave it dormant).

## Dependencies

- Supabase project and bucket (`feedback-pdfs`).
- Supabase Service Key (Env var).
- GitHub PAT with `issues:write` (Env var).

## Success Criteria

- [ ] Users can click "Report issue" when a parsed name is wrong in the preview table.
- [ ] Users can attach a PDF only after explicitly checking GDPR consent.
- [ ] Submitting the form successfully creates a GitHub Issue with the storage URL.
- [ ] PDFs larger than 3MB are rejected client-side with a clear message.
- [ ] The report history is saved locally in PGlite.
