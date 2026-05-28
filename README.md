# HidroPoint PDF Renamer

A browser-based tool for bulk-renaming invoice PDFs according to company-specific rules.
It runs entirely client-side — no server required.

## Browser Requirements

> **Chromium-only** — This application requires a Chromium-based browser (Chrome, Edge, or Chromium) because it uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (`showDirectoryPicker`) to write renamed files to disk. Firefox and Safari do not support this API and will show a compatibility warning.

## Setup

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

### Build

```bash
pnpm build
```

## Running Tests

```bash
# Unit + integration tests (vitest)
npx vitest run

# Unit + integration tests with coverage (≥80% threshold required)
npx vitest run --coverage

# E2E tests (Playwright — requires Chromium installed)
npx playwright install chromium
npx playwright test

# Type check
npx tsc --noEmit

# Lint
npx eslint src/
```

## How It Works

1. **Drop PDFs** onto the intake page — the app detects the company from the filename and extracts invoice fields via company-specific parsers.
2. **Review the preview table** — proposed new names are shown per row. Any row with low-confidence parsing is flagged for manual override.
3. **Confirm** — the app prompts you to pick a root output folder via the browser's directory picker. Files are written to company/year/month subdirectories under that root. A job record is written to the local PGlite database for audit history.

## Supported Companies

| ID | Company | Folder Prefix |
|----|---------|---------------|
| INTERPARTNER | Interpartner | 01 |
| SANTA_LUCIA | Santa Lucía | 02 |
| IRIS | Iris | 03 |
| AXA | AXA | 04 |
| ISERVIS | Iservis | 05 |
| GENERALI | Generali | 06 |
| RDS | RDS | 07 |

### AXA and GENERALI — Stub Parsers

The AXA and GENERALI parsers are **stubs**: they return a `confidence: 'stub'` result because the PDF structure for those companies was not available during development. All rows from these companies will be flagged for manual override in the preview table. The rename engine will still propose a name from whatever text it can extract; you must review and confirm manually.

## Folder Structure

Renamed files are placed under the chosen root folder using this path pattern:

```
{root}/
  {prefix} {COMPANY}/
    {YYYY}/
      {MM} {MONTH_NAME}/
        {renamed_file}.pdf
```

Example: `01 INTERPARTNER/2024/01 ENERO/2024-01-15 FRA. 001 GARCIA, JOSE.pdf`

## Known Limitations

- **Chromium only** — Firefox/Safari block `showDirectoryPicker`.
- **AXA / GENERALI parsers are stubs** — all rows require manual override.
- **Payment notification renaming** — invoices identified as payment notifications use a slightly different filename pattern; extraction confidence may be lower.
- The database (PGlite) is in-memory per browser tab — job history does not persist across hard reloads.
