# HidroPointPDF

Web app for HidroPoint Barcelona to automate PDF invoice renaming, invoice management, and bank reconciliation.

Runs entirely in the browser — no backend, no server, no installation required.

> **Browser requirement**: Chrome 86+ or Edge 86+ only. Firefox is not supported (requires the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)).

---

## Running locally

**Requirements**: Node.js 20+ and [pnpm](https://pnpm.io/installation).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

---

## How to use

### PDF Renaming

1. Open the app and go to **Intake**.
2. Drag and drop one or more invoice PDFs onto the drop zone.
3. The app parses each file and proposes a normalized filename based on the company template.
4. Review the preview table. Edit any row manually if the proposed name is wrong.
5. Click **Confirm** to write the renamed copies to your chosen output folder.
   - On first use, the browser will ask you to select a folder — this is the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) permission prompt.
6. Go to **History** to see all past rename jobs and search by original name.

### Supported companies

| Company | Status |
|---|---|
| Interpartner | ✅ Full parser |
| Santa Lucía | ✅ Full parser |
| IRIS | ✅ Full parser |
| iServis | ✅ Full parser |
| RDS | ✅ Full parser |
| AXA | ⚠️ Stub — configure template in Settings once 2025 sample files are available |
| GENERALI | ⚠️ Stub — configure template in Settings once 2025 sample files are available |

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server at `localhost:5173` |
| `pnpm build` | Type-check and build for production to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm test` | Run all unit and integration tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | Run TypeScript type-checker without emitting |
| `pnpm lint` | Run ESLint |

---

## Architecture

Hexagonal (ports & adapters) with strict layer boundaries:

```
src/
  domain/          # Pure business logic — no framework deps
  application/     # Use cases (processFile, confirmRename)
  infrastructure/  # PGlite DB, PDF parsers, File System Access API
  adapters/        # React components, pages, Zustand stores
tests/
  unit/            # Domain and infrastructure unit tests
  integration/     # React component and store tests
  e2e/             # Playwright end-to-end tests
```

Data is persisted locally in the browser via [PGlite](https://electric-sql.com/docs/reference/pglite) (PostgreSQL compiled to WASM). Nothing leaves the device.
