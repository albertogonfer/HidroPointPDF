# Feedback Reporting Specification

## Purpose

Allow users to report incorrect parser results directly from the application. This provides a secure, GDPR-compliant mechanism to submit feedback, including optional PDF attachments, which automatically generates a GitHub issue for maintainers and records the report locally.

## ADDED Requirements

### Requirement: Feedback Trigger

The system MUST provide a way for users to initiate a feedback report for parser inaccuracies.

#### Scenario: Display report button on overridden rows
- GIVEN the user is viewing the PreviewTable
- WHEN a row has been manually edited by the user (`hasOverride: true`)
- THEN a "Report issue" button MUST be visible on that row

### Requirement: Feedback Form Initialization

The system MUST initialize the feedback form with context from the failed parsing attempt.

#### Scenario: Open pre-filled feedback form
- GIVEN the user clicks the "Report issue" button on a specific row
- WHEN the FeedbackForm (modal or page) opens
- THEN it MUST be pre-filled with the company, original filename, proposed filename, and final filename (user's correction)

### Requirement: Feedback Form Fields

The system MUST collect required information and consent before submission.

#### Scenario: Validate required fields
- GIVEN the user is filling out the FeedbackForm
- WHEN they attempt to submit
- THEN the description field (textarea) MUST be required
- AND the expected name field MUST be required and editable

#### Scenario: Reveal file upload upon consent
- GIVEN the user is viewing the FeedbackForm
- WHEN the consent checkbox is not checked
- THEN the file upload input MUST NOT be visible
- WHEN the user checks the consent checkbox
- THEN the file upload input MUST become visible

### Requirement: File Upload Constraints

The system MUST restrict file uploads to valid, reasonably sized PDFs.

#### Scenario: Accept valid PDF
- GIVEN the user has checked the consent checkbox
- WHEN they select a PDF file under 3MB
- THEN the file MUST be accepted and its filename and size displayed

#### Scenario: Reject oversized file
- GIVEN the user has checked the consent checkbox
- WHEN they select a file larger than 3MB
- THEN the file MUST be rejected client-side with a clear error message in Spanish

### Requirement: Feedback Submission

The system MUST process submissions securely and create external records.

#### Scenario: Successful submission
- GIVEN the user has filled all required fields validly
- WHEN they submit the form
- THEN the system MUST call the `submitFeedback` use-case
- AND POST FormData to `/api/feedback`
- AND the Vercel Function MUST upload the PDF to Supabase Storage and create a GitHub Issue
- AND the system MUST show a success state with a link to the GitHub issue ("Tu reporte fue enviado — ver issue #123")
- AND a local PGlite record MUST be saved in the `feedback_reports` table

#### Scenario: Network or API failure
- GIVEN the user submits the form
- WHEN a network error, Supabase upload failure, or GitHub API failure occurs
- THEN the system MUST display a plain-language error message in Spanish
- AND the local record MUST NOT be saved as successful

### Requirement: API Security and Validation

The server-side API MUST validate requests and protect secrets.

#### Scenario: API validation and secrets
- GIVEN a POST request to `/api/feedback`
- WHEN the request is processed
- THEN it MUST validate the `content-type` is `multipart/form-data`
- AND verify PDF magic bytes if a file is present
- AND ensure all required fields are present
- AND use `SUPABASE_SERVICE_KEY` and `GITHUB_TOKEN` exclusively from environment variables

### Requirement: Local History Schema

The system MUST store feedback history locally using a specific schema.

#### Scenario: Save to PGlite
- GIVEN a successful feedback submission
- WHEN the local record is created
- THEN it MUST be inserted into a new `feedback_reports` table with columns: `id SERIAL`, `company_id TEXT`, `original_name TEXT`, `proposed_name TEXT`, `expected_name TEXT`, `description TEXT`, `had_attachment BOOLEAN`, `github_issue_url TEXT`, `github_issue_number INTEGER`, `created_at TIMESTAMPTZ`

### Requirement: GitHub Issue Template

The system MUST format the created GitHub issue consistently.

#### Scenario: Format GitHub Issue
- GIVEN the Vercel Function creates a GitHub Issue
- WHEN the issue is created
- THEN the title MUST be `[Parser] {companyId} — {originalName}`
- AND the body MUST include "Empresa", "Archivo original", "Nombre propuesto", "Nombre correcto", "Descripción", and "Archivo adjunto"
- AND it MUST include labels `parser-bug` and `feedback`