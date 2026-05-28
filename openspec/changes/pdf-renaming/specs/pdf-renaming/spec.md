# pdf-renaming Specification

## Purpose

Automate the normalization and organization of incoming invoices by extracting metadata, applying company-specific renaming rules, and writing files to the local file system using the File System Access API.

## Requirements

### Requirement: Drop Zone and File Intake
The system MUST support drag and drop of multiple PDF files simultaneously.

#### Scenario: User drops multiple PDFs
- GIVEN the application is open
- WHEN the user drags and drops multiple PDF files into the drop zone
- THEN the system parses the files and displays them in a preview table showing the original filename and proposed new name
- AND no file is written to disk at this stage

### Requirement: PDF Parsing
The system MUST extract `companyId`, `invoiceNumber`, `date`, and `amount` from the PDF text using `pdfjs-dist`, utilizing one specific parser per company.

#### Scenario: Successful extraction
- GIVEN a PDF for a known company (e.g., INTERPARTNER)
- WHEN the parser processes the file
- THEN it extracts all required fields successfully

#### Scenario: Unparseable fields trigger manual override
- GIVEN a PDF with missing or unparseable fields (e.g., scanned image or stubbed AXA parser)
- WHEN the parser processes the file and returns `null` for any field
- THEN the system flags the file for manual override in the UI

### Requirement: Renaming Rules and Normalization
The system MUST apply company-specific renaming templates and strip all accents, tildes, and special characters (e.g., ñ, ü, ç) from the final filenames. Payment notifications MUST be renamed based on extracted content rather than the original filename. AXA and GENERALI rules MUST be configurable stubs initially.

#### Scenario: Filename normalization
- GIVEN an extracted filename containing "Fáctüra_Niño_Cía"
- WHEN the renaming rule is applied
- THEN the resulting filename is "Factura_Nino_Cia"

#### Scenario: Payment notification renaming
- GIVEN a payment notification PDF named "scan_123.pdf"
- WHEN the renaming rule is applied
- THEN the proposed name uses extracted content (e.g., company and date) instead of the original name

### Requirement: Preview and Manual Override
The system MUST display a preview table of proposed name changes. Each row MUST be individually overrideable. The system MUST NOT write any files until the user explicitly confirms.

#### Scenario: User overrides a proposed name
- GIVEN the preview table is populated with proposed names
- WHEN the user edits the proposed name for a specific file
- THEN the system updates the proposed name in the UI without affecting other files

#### Scenario: Final confirmation before write
- GIVEN the user has reviewed the proposed names
- WHEN the user clicks the confirm button
- THEN the system begins writing the files to disk

### Requirement: File System Access API
The system MUST require the user to grant folder access once per session and write the renamed PDFs to the correct target folder on disk.

#### Scenario: Granting folder access
- GIVEN the user has not yet granted folder access in the current session
- WHEN the system attempts to write files or the user initiates the folder selection
- THEN the system prompts the user to grant access to the target directory

#### Scenario: Permission denied
- GIVEN the system attempts to write to the file system
- WHEN the user denies permission or the browser blocks access
- THEN the system gracefully handles the error and displays a clear error message to the user

### Requirement: Browser Compatibility
The system MUST run on Chromium-based browsers (Chrome, Edge). The system MUST display a clear warning if the File System Access API is not available.

#### Scenario: Unsupported browser
- GIVEN a user opens the application in Firefox
- WHEN the application initializes
- THEN the system displays a clear warning that a Chromium-based browser is required for file system access

### Requirement: Job History Audit Log
The system MUST record every rename operation including the original name, final name, company, timestamp, and any user overrides. This history MUST be displayed in a searchable and filterable list.

#### Scenario: Audit log recording
- GIVEN a batch of PDFs has been confirmed and written to disk
- WHEN the write operation completes
- THEN the system records the details of each renamed file in the job history database

#### Scenario: Viewing job history
- GIVEN the user navigates to the job history view
- WHEN the user enters a search term or applies a filter
- THEN the system displays only the matching rename operations
