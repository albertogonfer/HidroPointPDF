/**
 * Vercel Serverless Function — POST /api/feedback
 *
 * Receives multipart/form-data, validates input, uploads PDF to Supabase
 * Storage, and creates a GitHub Issue. Returns { issueUrl, issueNumber }.
 *
 * Runtime: Node.js (not Edge — Edge has 1MB body limit + no FormData parsing)
 * Dependencies: NONE beyond built-in fetch (Node 18+)
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET
 *   GITHUB_TOKEN, GITHUB_REPO  (format: "owner/repo")
 */

export const config = { runtime: 'nodejs20.x' }

const MAX_FILE_BYTES = 3 * 1024 * 1024 // 3 MB
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] // %PDF

// ─── types ────────────────────────────────────────────────────────────────────

interface FeedbackFields {
  companyId: string
  originalName: string
  proposedName: string
  expectedName: string
  description: string
}

interface IssueResult {
  issueUrl: string
  issueNumber: number
}

// ─── pure helpers ─────────────────────────────────────────────────────────────

export function extractFields(fd: FormData): FeedbackFields | null {
  const companyId = fd.get('companyId')
  const originalName = fd.get('originalName')
  const proposedName = fd.get('proposedName')
  const expectedName = fd.get('expectedName')
  const description = fd.get('description')

  if (
    typeof companyId !== 'string' || !companyId ||
    typeof originalName !== 'string' || !originalName ||
    typeof proposedName !== 'string' || !proposedName ||
    typeof expectedName !== 'string' || !expectedName ||
    typeof description !== 'string' || !description
  ) {
    return null
  }

  return { companyId, originalName, proposedName, expectedName, description }
}

export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false
  return PDF_MAGIC.every((b, i) => bytes[i] === b)
}

export function buildIssueBody(
  fields: FeedbackFields,
  hasAttachment: boolean,
): string {
  return [
    `## Reporte de parser`,
    ``,
    `| Campo | Valor |`,
    `|-------|-------|`,
    `| **Empresa** | ${fields.companyId} |`,
    `| **Archivo original** | \`${fields.originalName}\` |`,
    `| **Nombre propuesto** | \`${fields.proposedName}\` |`,
    `| **Nombre correcto** | \`${fields.expectedName}\` |`,
    ``,
    `### Descripción`,
    ``,
    fields.description,
    ``,
    `### Archivo adjunto`,
    ``,
    hasAttachment ? `✅ Se adjuntó un PDF a Supabase Storage.` : `❌ Sin archivo adjunto.`,
  ].join('\n')
}

// ─── upstream calls ───────────────────────────────────────────────────────────

async function uploadToSupabase(
  fileBytes: Uint8Array,
  originalName: string,
  supabaseUrl: string,
  serviceKey: string,
  bucket: string,
): Promise<void> {
  const path = `${Date.now()}-${originalName}`
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: fileBytes,
  })

  if (!res.ok) {
    throw new Error(`Supabase upload failed: ${res.status}`)
  }
}

async function createGithubIssue(
  fields: FeedbackFields,
  hasAttachment: boolean,
  token: string,
  repo: string,
): Promise<IssueResult> {
  const url = `https://api.github.com/repos/${repo}/issues`
  const title = `[Parser] ${fields.companyId} — ${fields.originalName}`
  const body = buildIssueBody(fields, hasAttachment)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      title,
      body,
      labels: ['parser-bug', 'feedback'],
    }),
  })

  if (!res.ok) {
    throw new Error(`GitHub issue creation failed: ${res.status}`)
  }

  const data = (await res.json()) as { html_url: string; number: number }
  return { issueUrl: data.html_url, issueNumber: data.number }
}

// ─── handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  // Parse multipart form data
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400 })
  }

  // Validate required fields
  const fields = extractFields(fd)
  if (!fields) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  // Handle optional file
  const fileEntry = fd.get('file')
  let fileBytes: Uint8Array | null = null

  if (fileEntry instanceof File && fileEntry.size > 0) {
    // Size check
    if (fileEntry.size > MAX_FILE_BYTES) {
      return new Response(
        JSON.stringify({ error: 'File exceeds 3MB limit' }),
        { status: 413 },
      )
    }

    const arrayBuffer = await fileEntry.arrayBuffer()
    fileBytes = new Uint8Array(arrayBuffer)

    // Magic bytes check
    if (!hasPdfMagicBytes(fileBytes)) {
      return new Response(
        JSON.stringify({ error: 'Invalid PDF: bad magic bytes' }),
        { status: 400 },
      )
    }
  }

  // Resolve env vars
  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? ''
  const bucket = process.env.SUPABASE_BUCKET ?? ''
  const githubToken = process.env.GITHUB_TOKEN ?? ''
  const githubRepo = process.env.GITHUB_REPO ?? ''

  try {
    // Upload PDF if present
    if (fileBytes) {
      await uploadToSupabase(fileBytes, fields.originalName, supabaseUrl, serviceKey, bucket)
    }

    // Create GitHub issue
    const result = await createGithubIssue(fields, fileBytes !== null, githubToken, githubRepo)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream service failure' }), { status: 502 })
  }
}
