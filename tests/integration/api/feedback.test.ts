// @vitest-environment node
/**
 * Integration tests for api/feedback.ts (Vercel Function)
 *
 * Run in Node environment (not jsdom) because the handler uses the Web Fetch
 * API Request/Response which jsdom doesn't implement correctly for formData().
 * fetch() is mocked globally so no real HTTP calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// RED: api/feedback.ts does not exist yet — this import will fail until GREEN
import handler from '../../../api/feedback'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>, file?: File): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  if (file) fd.append('file', file)
  return fd
}

function makePdfBytes(size = 16): Uint8Array {
  // Valid PDF magic bytes: %PDF
  const buf = new Uint8Array(size)
  buf[0] = 0x25 // %
  buf[1] = 0x50 // P
  buf[2] = 0x44 // D
  buf[3] = 0x46 // F
  return buf
}

function makeRequest(fd: FormData): Request {
  return new Request('https://example.com/api/feedback', {
    method: 'POST',
    body: fd,
  })
}

const VALID_FIELDS = {
  companyId: 'AXA',
  originalName: 'original.pdf',
  proposedName: 'proposed.pdf',
  expectedName: 'expected.pdf',
  description: 'Something was wrong with the parser.',
}

// ─── test suite ──────────────────────────────────────────────────────────────

describe('api/feedback handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    // Default: both upstream calls succeed
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('supabase')) {
          return Promise.resolve(new Response(null, { status: 200 }))
        }
        // GitHub
        return Promise.resolve(
          new Response(
            JSON.stringify({ html_url: 'https://github.com/org/repo/issues/42', number: 42 }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }),
    )

    // Provide env vars used by the handler
    vi.stubEnv('SUPABASE_URL', 'https://fake.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'fake-service-key')
    vi.stubEnv('SUPABASE_BUCKET', 'feedback-pdfs')
    vi.stubEnv('GITHUB_TOKEN', 'fake-token')
    vi.stubEnv('GITHUB_REPO', 'org/repo')
  })

  // ── happy path ──────────────────────────────────────────────────────────────

  it('returns 200 with issueUrl and issueNumber on valid request without file', async () => {
    const req = makeRequest(makeFormData(VALID_FIELDS))
    const res = await handler(req)

    expect(res.status).toBe(200)
    const body = await res.json() as { issueUrl: string; issueNumber: number }
    expect(body.issueUrl).toBe('https://github.com/org/repo/issues/42')
    expect(body.issueNumber).toBe(42)
  })

  it('returns 200 when a valid PDF attachment is included', async () => {
    const pdfBytes = makePdfBytes(100)
    const file = new File([pdfBytes], 'test.pdf', { type: 'application/pdf' })
    const req = makeRequest(makeFormData(VALID_FIELDS, file))
    const res = await handler(req)

    expect(res.status).toBe(200)
    const body = await res.json() as { issueUrl: string; issueNumber: number }
    expect(body.issueNumber).toBe(42)
  })

  // ── validation: missing required fields ────────────────────────────────────

  it('returns 400 when companyId is missing', async () => {
    const { companyId: _removed, ...rest } = VALID_FIELDS
    const req = makeRequest(makeFormData(rest as Record<string, string>))
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when description is missing', async () => {
    const { description: _removed, ...rest } = VALID_FIELDS
    const req = makeRequest(makeFormData(rest as Record<string, string>))
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when expectedName is missing', async () => {
    const { expectedName: _removed, ...rest } = VALID_FIELDS
    const req = makeRequest(makeFormData(rest as Record<string, string>))
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  // ── validation: PDF magic bytes ────────────────────────────────────────────

  it('returns 400 when file lacks PDF magic bytes', async () => {
    const badBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04])
    const file = new File([badBytes], 'notapdf.pdf', { type: 'application/pdf' })
    const req = makeRequest(makeFormData(VALID_FIELDS, file))
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  // ── validation: file size ─────────────────────────────────────────────────

  it('returns 413 when file exceeds 3MB', async () => {
    const bigBuffer = new Uint8Array(3 * 1024 * 1024 + 1)
    bigBuffer[0] = 0x25 // %
    bigBuffer[1] = 0x50 // P
    bigBuffer[2] = 0x44 // D
    bigBuffer[3] = 0x46 // F
    const file = new File([bigBuffer], 'big.pdf', { type: 'application/pdf' })
    const req = makeRequest(makeFormData(VALID_FIELDS, file))
    const res = await handler(req)
    expect(res.status).toBe(413)
  })

  // ── upstream failures ──────────────────────────────────────────────────────

  it('returns 502 when Supabase upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('supabase')) {
          return Promise.resolve(new Response('{"error":"storage error"}', { status: 500 }))
        }
        return Promise.resolve(
          new Response(JSON.stringify({ html_url: 'https://x', number: 1 }), { status: 201 }),
        )
      }),
    )

    const pdfBytes = makePdfBytes(100)
    const file = new File([pdfBytes], 'test.pdf', { type: 'application/pdf' })
    const req = makeRequest(makeFormData(VALID_FIELDS, file))
    const res = await handler(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when GitHub issue creation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('supabase')) {
          return Promise.resolve(new Response(null, { status: 200 }))
        }
        return Promise.resolve(new Response('{"message":"Bad credentials"}', { status: 401 }))
      }),
    )

    const req = makeRequest(makeFormData(VALID_FIELDS))
    const res = await handler(req)
    expect(res.status).toBe(502)
  })

  // ── GitHub issue body format ────────────────────────────────────────────────

  it('formats the GitHub issue with required Spanish labels in body', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (String(url).includes('supabase')) {
        return Promise.resolve(new Response(null, { status: 200 }))
      }
      // Capture the GitHub API call body
      const body = JSON.parse((init?.body as string) ?? '{}') as {
        title: string
        body: string
        labels: string[]
      }
      expect(body.title).toBe('[Parser] AXA — original.pdf')
      expect(body.body).toContain('Empresa')
      expect(body.body).toContain('Archivo original')
      expect(body.body).toContain('Nombre propuesto')
      expect(body.body).toContain('Nombre correcto')
      expect(body.body).toContain('Descripción')
      expect(body.body).toContain('Archivo adjunto')
      expect(body.labels).toContain('parser-bug')
      expect(body.labels).toContain('feedback')
      return Promise.resolve(
        new Response(JSON.stringify({ html_url: 'https://x', number: 1 }), { status: 201 }),
      )
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = makeRequest(makeFormData(VALID_FIELDS))
    const res = await handler(req)
    expect(res.status).toBe(200)
  })
})
