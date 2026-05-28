# Design: PDF Renaming Engine

## Technical Approach

Fully client-side pipeline: pdfjs-dist extracts text → per-company parser produces `ParsedInvoice` → renaming engine interpolates PGlite-stored template → preview table lets user confirm/override → File System Access API writes renamed PDF to target subfolder → PGlite records audit job.

No Vercel edge function needed. Entire change stays client-side.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Parser pattern | One module per company implementing `InvoiceParser` interface | Single regex table | Each company's PDF layout is structurally different; shared regex breaks on edge cases |
| Rule storage | Hybrid: TS function + PGlite template string | Fully hardcoded / full DSL | AXA/GENERALI unknown; templates are user-editable without deploy, no arbitrary code injection |
| Folder resolution | Relative paths from user-picked root handle via FSAA | Hardcoded absolute paths | Portable across machines; user picks root once per session |
| Blob storage | None — metadata only in PGlite | IndexedDB blobs | Files live on disk; DB is audit log only; avoids quota pressure |
| Accent stripping | `str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` | `remove-accents` lib | Native, zero-dep, handles ñ/ü/ç/all Latin diacritics |

## Project Structure (Greenfield)

```
src/
├── domains/
│   ├── pdf-renaming/              ← this change
│   │   ├── components/            ← DropZone, PreviewTable, HistoryList, BrowserWarning
│   │   ├── parsers/               ← InvoiceParser interface + per-company modules
│   │   │   ├── parser.interface.ts
│   │   │   ├── parser-registry.ts ← maps CompanyId → parser instance
│   │   │   ├── interpartner.parser.ts
│   │   │   ├── santa-lucia.parser.ts
│   │   │   ├── iris.parser.ts
│   │   │   ├── axa.parser.ts      ← stub
│   │   │   ├── iservis.parser.ts
│   │   │   ├── generali.parser.ts ← stub
│   │   │   └── rds.parser.ts
│   │   ├── engine/                ← renamingEngine.ts, stripAccents.ts, templateInterpolator.ts
│   │   ├── fs/                    ← fsaaWriter.ts, folderResolver.ts
│   │   └── store/                 ← dropZoneStore.ts, sessionStore.ts, historyStore.ts
│   ├── invoice-management/        ← future
│   ├── bank-reconciliation/       ← future
│   └── dashboard/                 ← future
├── db/
│   ├── client.ts                  ← singleton PGlite instance
│   ├── schema.sql                 ← DDL
│   └── seed.ts                    ← companies + default templates
├── components/ui/                 ← shadcn/ui primitives
├── router.tsx
└── main.tsx
```

## Data Flow (Sequence)

```
User                DropZone         ParserRegistry     RenamingEngine    PreviewTable       FSAA Writer      PGlite
 │                     │                  │                  │                │                  │              │
 │── drag PDFs ───────→│                  │                  │                │                  │              │
 │                     │── ArrayBuffer ──→│                  │                │                  │              │
 │                     │                  │── pdfjs getText  │                │                  │              │
 │                     │                  │── match company  │                │                  │              │
 │                     │                  │── ParsedInvoice ─→│               │                  │              │
 │                     │                  │                  │── load template from PGlite ─────────────────────→│
 │                     │                  │                  │── interpolate + stripAccents      │              │
 │                     │                  │                  │── proposedName ─→│                │              │
 │                     │                  │                  │                │←─ user edits ────│              │
 │── confirm ─────────────────────────────────────────────────────────────────→│                │              │
 │                     │                  │                  │                │── write PDF ────→│              │
 │                     │                  │                  │                │                  │── INSERT job →│
```

## Interfaces / Contracts

```typescript
interface InvoiceParser {
  companyId: CompanyId
  extract(pdfText: string): ParsedInvoice
}

type CompanyId =
  | 'INTERPARTNER' | 'SANTA_LUCIA' | 'IRIS'
  | 'AXA' | 'ISERVIS' | 'GENERALI' | 'RDS'

type ParsedInvoice = {
  companyId: CompanyId
  invoiceNumber: string | null
  date: string | null          // ISO 8601
  amount: number | null
  firstName: string | null
  lastName: string | null
  rawText: string
  confidence: 'high' | 'low' | 'stub'
}

// Renaming engine
function applyTemplate(invoice: ParsedInvoice, template: string): string
function stripAccents(input: string): string

// FSAA
interface FsaaWriter {
  requestRoot(): Promise<FileSystemDirectoryHandle>
  writeFile(root: FileSystemDirectoryHandle, relativePath: string, data: ArrayBuffer): Promise<void>
}
```

## PGlite Schema

```sql
CREATE TABLE companies (
  id    TEXT PRIMARY KEY,        -- 'AXA', 'INTERPARTNER', etc.
  name  TEXT NOT NULL,
  folder_prefix TEXT NOT NULL,   -- '01', '04', etc.
  parent_id TEXT REFERENCES companies(id)
);

CREATE TABLE renaming_rules (
  id          SERIAL PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id),
  template    TEXT NOT NULL,     -- '{date} FRA. {invoiceNumber} {lastName}, {firstName}'
  active      BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rename_jobs (
  id             SERIAL PRIMARY KEY,
  company_id     TEXT REFERENCES companies(id),
  original_name  TEXT NOT NULL,
  proposed_name  TEXT NOT NULL,
  final_name     TEXT NOT NULL,
  target_folder  TEXT NOT NULL,
  had_override   BOOLEAN DEFAULT false,
  status         TEXT NOT NULL DEFAULT 'completed',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoice_registrations (
  id             SERIAL PRIMARY KEY,
  job_id         INT REFERENCES rename_jobs(id),
  invoice_number TEXT,
  invoice_date   DATE,
  amount         NUMERIC(10,2),
  registered     BOOLEAN DEFAULT false
);
```

## Zustand Stores

```typescript
// dropZoneStore
{ dragActive: boolean, pendingFiles: File[], parsedResults: ParsedInvoice[], previewRows: PreviewRow[], confirming: boolean }

// sessionStore
{ rootFolderHandle: FileSystemDirectoryHandle | null, hasPermission: boolean, fsaaSupported: boolean }

// historyStore
{ jobs: RenameJob[], page: number, pageSize: number, total: number, searchTerm: string }
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | `stripAccents`, `applyTemplate`, each parser's `extract` | Vitest with fixture PDF text strings |
| Integration | Parse → rename → preview pipeline (no FSAA) | Vitest + `@testing-library/react` |
| E2E | Drop PDF → confirm → verify file written | Playwright (Chromium only), mock FSAA handles |

## Browser Compatibility

On mount, check `'showDirectoryPicker' in window`. If absent → render `<BrowserWarning>` banner blocking write operations. Read-only preview still works.

Required: **Chrome 86+ / Edge 86+**. Firefox and Safari unsupported.

## Migration / Rollout

No migration required. Greenfield module. `seed.ts` populates `companies` and `renaming_rules` on first PGlite init. AXA and GENERALI get placeholder templates editable via future Settings UI.

## Open Questions

- [ ] Exact AXA and GENERALI filename templates — pending 2025 sample files
- [ ] Confirm folder_prefix mapping (01–08) per company with user
