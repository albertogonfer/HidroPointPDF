# Proposal: PDF Renaming Engine

## Intent

Automate the normalization and organization of incoming invoices by extracting metadata and applying company-specific renaming rules, replacing a tedious manual process.

## Scope

### In Scope
- Drag & drop UI for PDF intake and preview table
- PDF metadata extraction using `pdfjs-dist`
- Hybrid renaming rules (TypeScript functions + PGlite templates)
- Fallback manual override UI for unparseable or unrecognized PDFs
- Writing renamed PDFs to disk via the File System Access API
- Job history audit log stored in PGlite
- Stripping accents and special characters from filenames

### Out of Scope
- Firefox/Safari support (Chromium-only via File System Access API)
- Automatic folder polling/watching
- Storing PDF blobs in the database

## Capabilities

### New Capabilities
- `pdf-renaming`: Core functionality for dropping PDFs, extracting metadata, applying naming rules, previewing changes, writing renamed copies to disk, and logging job history.

### Modified Capabilities
- None

## Approach

Implement a fully client-side solution. `pdfjs-dist` extracts text from dropped PDFs, feeding into per-company rule functions that use PGlite-stored templates. A preview table allows user confirmation and manual overrides (essential for stubbed parsers like AXA/GENERALI). The File System Access API writes the renamed files to target subfolders, while PGlite records the audit history.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domains/pdf-renaming/` | New | Domain root |
| `src/domains/pdf-renaming/rules/` | New | Per-company rule definitions |
| `src/domains/pdf-renaming/parser/` | New | PDF metadata extraction |
| `src/domains/pdf-renaming/store/` | New | Zustand state for drop zone & queue |
| `src/domains/pdf-renaming/components/` | New | UI for drop zone and preview table |
| `src/db/schema/` | New | PGlite schema (companies, rules, jobs) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Extraction fails on scanned PDFs | High | Mandatory manual override UI path |
| AXA/GENERALI rules unknown | High | Deploy with stub parsers; configure later via UI |
| Firefox users blocked | High | Explicit UI warning that Chrome/Edge is required |
| Browser data cleared | Low | Files are safe on disk; only job history is lost |

## Rollback Plan

Greenfield module, so technical rollback is reverting the commits. Operationally, the app writes *copies* of files to target folders; the original PDFs in the drop zone remain untouched or can act as backups if a batch is misnamed.

## Dependencies

- `pdfjs-dist`
- Chromium-based browser (Chrome/Edge)

## Success Criteria

- [ ] PDFs dropped into UI show a preview of proposed new names
- [ ] User can manually override any proposed name
- [ ] Confirmed files are successfully written to target directories via File System Access API
- [ ] Accents and special characters are stripped from final filenames
- [ ] Job history is recorded in PGlite
