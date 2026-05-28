# Exploration: pdf-renaming

_Generated: 2026-05-27 | Project: hidropoint | Stack: React 19 + TypeScript + Vite + pdfjs-dist + PGlite_

---

## Current State

Greenfield project — no source files exist yet. Stack is confirmed via `openspec/config.yaml`:

- **PDF parsing**: `pdfjs-dist` (in-browser, already in the chosen stack)
- **PDF generation/manipulation**: `pdf-lib`
- **Persistence**: PGlite (PostgreSQL WASM, fully client-side)
- **UI**: React 19 + shadcn/ui + Tailwind CSS
- **State**: Zustand
- **No server required** for this domain — all processing is client-side

There are no existing specs. This is the first domain to be designed.

---

## Affected Areas

This is a new domain; no files exist yet. When implemented, the affected modules will be:

| Path (planned) | Role |
|---|---|
| `src/domains/pdf-renaming/` | Domain root — renaming engine, rules, models |
| `src/domains/pdf-renaming/rules/` | Per-company rule definitions |
| `src/domains/pdf-renaming/parser/` | PDF metadata extraction via pdfjs-dist |
| `src/domains/pdf-renaming/store/` | Zustand slice for drop zone + queued files |
| `src/domains/pdf-renaming/components/` | Drop zone UI, rename preview, file list |
| `src/db/schema/` | PGlite tables: companies, renaming_rules, invoice_jobs |

---

## Questions Explored

### 1. How to model company-specific renaming rules (configurable vs hardcoded)

**Context**: 7 companies, each with a distinct naming convention. AXA and GENERALI rules must be inferred from 2025 files (not yet available). Some companies have subsidiaries (IRIS → INTERPARTNER, CAJAMAR → GENERALI).

**Approaches**:

#### Option A — Rule functions hardcoded per company
Each company has a TypeScript function `renameFor{Company}(pdf: ParsedPDF): string`. Rules live in source code.

- Pros: type-safe, testable, no schema migration to update a rule
- Cons: deploy needed to change a rule; AXA/GENERALI must be placeholders until files arrive
- Effort: Low

#### Option B — Data-driven rules in PGlite
A `renaming_rules` table stores pattern templates, field extractors, and output templates per company. Rules are editable at runtime via a UI.

- Pros: user can update AXA/GENERALI rules from within the app without a code deploy; supports future companies
- Cons: requires a rule DSL or template language (e.g., `{year}-{month}-{invoice_number}`); harder to test variations; more initial complexity
- Effort: High

#### Option C — Hybrid (recommended)
Hardcoded rule **functions** per company, but each function reads its **template string** from PGlite (`renaming_rules` table). The function signature is fixed in code; only the configurable parts (date format, field order, separators) are stored in the DB.

- Pros: predictable behavior (no arbitrary code injection), user-editable for AXA/GENERALI once files arrive, testable with fixtures
- Cons: slight complexity in the template engine (simple string interpolation, not a full DSL)
- Effort: Medium

**Recommendation**: Option C — Hybrid. Ship with hardcoded templates for known companies (INTERPARTNER, SANTA LUCÍA, IRIS, ISERVIS, RDS). AXA and GENERALI rules stored as empty/placeholder templates in PGlite and filled when the user inspects the 2025 files.

---

### 2. How to handle PDF parsing in-browser (pdfjs-dist) to extract invoice metadata

**Context**: Each PDF contains invoice metadata (company name, invoice number, date, amount). The rename is based on this content for AXA/GENERALI payment notifications.

**Approach (single, no meaningful alternative)**:
Use `pdfjs-dist` (already in the stack). Load the PDF `ArrayBuffer`, call `getPage(1)`, extract text content, then apply regex/heuristic extractors per company to pull fields.

Key design decisions:
- **Parser is per-company**: each company's PDF layout is different; a single generic extractor won't work
- **Extraction result is typed**: `ParsedInvoice = { companyId, invoiceNumber, date, amount, rawText }` — unknown fields are `null`, not errors
- **AXA/GENERALI parsers are stubs** until sample PDFs are available; they return `null` for all fields, triggering manual naming mode
- **pdfjs-dist worker**: must be configured correctly in Vite; the worker URL must be explicitly set to avoid CORS issues with Vite's dev server

**Risk**: pdfjs-dist text extraction is position-based (not semantic). Multi-column PDFs or scanned images will produce unreliable text. Mitigation: show raw extracted text to the user alongside the rename preview, so they can correct it.

---

### 3. How to simulate the folder structure in a web app

**Context**: Real folder structure:
```
000 FACTURAS PDTES. DE REGISTRAR/     ← drop zone
01 INTERPARTNER/                       ← quick register
02 SANTA LUCÍA/
...
2025 CONTABILIDAD/
  VENTAS/
    01 ENERO/
    02 FEBRERO/
    ...
  COMPRAS/
    ...
BÚSQUEDAS/
```

**Approaches**:

#### Option A — File System Access API (real filesystem)
Use `window.showDirectoryPicker()` to grant access to the actual folder on disk. Read/write PDFs directly.

- Pros: files land in the real folder structure; no sync needed; user sees results in Explorer/Finder immediately
- Cons: requires user gesture per session to re-grant access; not supported in Firefox; requires HTTPS; complex permission handling
- Effort: Medium

#### Option B — Virtual filesystem in PGlite (IndexedDB-backed)
Store file blobs in PGlite. Display a virtual folder tree in the UI. User exports/downloads renamed files.

- Pros: works in all browsers; no permission drama; full control over the structure
- Cons: files don't appear on disk automatically; user must download; risk of data loss if IndexedDB is cleared
- Effort: High

#### Option C — File System Access API for write + in-memory for preview (recommended)
User grants access once to the root folder (e.g., `2025 CONTABILIDAD`). The app reads dropped PDFs from `000`, processes them in memory, and writes renamed copies to the correct subfolder using the File System Access API handle. PGlite stores job history and rule config, but not file blobs.

- Pros: real files on disk, no download step, job history persisted, works within Chrome/Edge (primary targets), no server needed
- Cons: Firefox users are blocked; session handle must be re-granted on reload (can be mitigated with `StorageManager.persist()` + handle serialization in IndexedDB, but this is a known limitation)
- Effort: Medium

**Recommendation**: Option C. Target Chrome/Edge explicitly (acceptable for a company internal tool). Document Firefox limitation in the UI.

---

### 4. How to handle the "drop zone" UX for incoming PDFs

**Context**: PDFs arrive by email, user saves them manually to `000 FACTURAS PDTES. DE REGISTRAR`, then the app must pick them up and process them.

**Approaches**:

#### Option A — Drag & drop onto the app UI
User drags PDFs from Explorer/Finder into the browser. Standard `<input type="file" multiple accept=".pdf">` or a drag-drop zone.

- Pros: universally supported; simple; no filesystem permission needed just to read
- Cons: user must manually drag each batch; no background watching
- Effort: Low

#### Option B — File System Access API directory watcher
Poll the `000` folder handle every N seconds, detect new files, process automatically.

- Pros: feels automatic; less manual friction
- Cons: no native "watch" in FSAA — must poll; requires the folder handle to be re-granted; battery/CPU cost; overkill for a small office tool
- Effort: High

**Recommendation**: Option A — drag & drop. The user already saves the PDFs manually to `000`; asking them to also drag them into the app is a minimal extra step. Can evolve to Option B later if the user finds it too tedious.

**UX detail**: the drop zone should show a rename preview table (original name → proposed name) before writing anything, with per-row overrides.

---

### 5. Data model for: companies, invoices, renaming rules

**Proposed PGlite schema** (PostgreSQL-compatible):

```sql
-- Companies and their subsidiaries
CREATE TABLE companies (
  id         SERIAL PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,          -- 'INTERPARTNER', 'AXA', etc.
  name       TEXT NOT NULL,
  folder_num SMALLINT NOT NULL,             -- 01..08
  parent_id  INTEGER REFERENCES companies(id)  -- for IRIS → INTERPARTNER, CAJAMAR → GENERALI
);

-- Configurable renaming templates per company
CREATE TABLE renaming_rules (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER NOT NULL REFERENCES companies(id),
  rule_type   TEXT NOT NULL,  -- 'quick_register' | 'individual_invoice' | 'payment_notification'
  template    TEXT NOT NULL,  -- e.g. '{year}-{month}-{invoice_number} {company_code}'
  extractors  JSONB,          -- field extraction hints for pdfjs parser
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Log of every rename job
CREATE TABLE rename_jobs (
  id              SERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now(),
  original_name   TEXT NOT NULL,
  proposed_name   TEXT NOT NULL,
  final_name      TEXT,           -- NULL until user confirms
  company_id      INTEGER REFERENCES companies(id),
  rule_type       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | skipped
  destination     TEXT,           -- virtual path or FSAA subfolder
  registered_excel BOOLEAN DEFAULT false
);

-- Monthly invoice tracking (for Ventas/Compras folders)
CREATE TABLE invoice_registrations (
  id              SERIAL PRIMARY KEY,
  rename_job_id   INTEGER REFERENCES rename_jobs(id),
  month           SMALLINT,
  year            SMALLINT,
  ledger_type     TEXT,  -- 'ventas' | 'compras'
  excel_confirmed BOOLEAN DEFAULT false
);
```

**Notes**:
- No file blobs stored in PGlite — only metadata and job history
- `extractors JSONB` allows per-company field extraction hints to evolve without schema migration
- `registered_excel` flag controls whether a PDF is copied to the month folder (per business rule: only if registered in Excel)

---

## Recommendation Summary

| Question | Recommended Approach | Effort |
|---|---|---|
| Company rules | Hybrid: hardcoded functions + PGlite templates | Medium |
| PDF parsing | pdfjs-dist per-company extractors, typed result | Medium |
| Folder structure | File System Access API (Chrome/Edge) + PGlite for history | Medium |
| Drop zone UX | Drag & drop with rename preview table | Low |
| Data model | PGlite schema above (no blob storage) | Low |

---

## Risks

1. **AXA / GENERALI rules are unknown**: parsers must be stubs; the app needs a "manual name override" path for any PDF that cannot be parsed.
2. **pdfjs-dist text extraction quality**: scanned PDFs or image-only PDFs will produce empty text. A fallback manual rename mode is mandatory.
3. **File System Access API browser support**: Firefox (~28% desktop share) does not support it. If the user also uses Firefox, Option A (drag & drop only) is the safer fallback.
4. **Accent normalization edge cases**: Spanish company names contain accents (SANTA LUCÍA, BÚSQUEDAS). The normalization function must use `String.prototype.normalize('NFD')` + regex strip, not a lookup table.
5. **Parent/subsidiary relationship**: IRIS invoices may arrive under INTERPARTNER branding. The parser or the user must disambiguate — the data model supports this via `parent_id`, but UX must expose it.
6. **PGlite IndexedDB persistence**: if the user clears browser data, all job history is lost. Document this limitation and optionally offer a JSON export.

---

## Ready for Proposal

**Yes.** The domain is well-understood. Key open items that the proposal must address:

- Confirm browser target (Chrome/Edge only is acceptable?)
- Confirm File System Access API as the write strategy
- Define the "manual override" UX for unknown parsers (AXA/GENERALI)
- Decide whether job history export (JSON/CSV) is in scope for this change
