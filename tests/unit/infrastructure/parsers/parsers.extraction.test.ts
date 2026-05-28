import { describe, it, expect } from 'vitest'
import { interpartnerParser } from '@/infrastructure/parsers/interpartner.parser'
import { santaLuciaParser } from '@/infrastructure/parsers/santa-lucia.parser'
import { irisParser } from '@/infrastructure/parsers/iris.parser'
import { iservisParser } from '@/infrastructure/parsers/iservis.parser'
import { rdsParser } from '@/infrastructure/parsers/rds.parser'
import { axaParser } from '@/infrastructure/parsers/axa.parser'
import { generaliParser } from '@/infrastructure/parsers/generali.parser'

// ---------------------------------------------------------------------------
// Fixture text strings per parser
// ---------------------------------------------------------------------------

const INTERPARTNER_TEXT = `
INTERPARTNER ASSISTANCE S.A.
Nº EXP: 2024/00123
Fecha: 15/03/2024
ASEGURADO: Pedro Garcia Lopez
TOTAL: 1.250,50 €
`

const SANTA_LUCIA_TEXT = `
SANTA LUCIA S.A. SEGUROS Y REASEGUROS
FACTURA Nº: SL-2024-0042
Fecha: 20/04/2024
TOMADOR: Ana Martinez Ruiz
IMPORTE TOTAL: 320,00 €
`

const IRIS_TEXT = `
IRIS ASSISTANCE S.A.
Nº EXPEDIENTE: EXP-2024-0078
Fecha: 05/06/2024
ASEGURADO: Carlos Lopez Fernandez
TOTAL: 99,99 €
`

const ISERVIS_TEXT = `
ISERVIS SERVICIOS
Nº FACTURA: FAC-2024-001
Fecha: 10/07/2024
CLIENTE: Laura Sanchez Gomez
TOTAL: 450,00 €
`

const RDS_TEXT = `
RDS SERVICIOS S.L.
Nº FACTURA: RDS-2024-0099
Fecha: 18/08/2024
CLIENTE: Miguel Torres Vila
TOTAL: 87,50 €
`

// ---------------------------------------------------------------------------
// Successful extraction per parser
// ---------------------------------------------------------------------------

describe('parsers.extraction — successful extraction', () => {
  it('interpartner: extracts invoiceNumber, date, amount from fixture text', () => {
    const result = interpartnerParser.extract(INTERPARTNER_TEXT)
    expect(result.companyId).toBe('INTERPARTNER')
    expect(result.invoiceNumber).toBeTruthy()
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.amount).toBeGreaterThan(0)
    expect(result.confidence).toBe('high')
  })

  it('santa-lucia: extracts invoiceNumber, date, amount from fixture text', () => {
    const result = santaLuciaParser.extract(SANTA_LUCIA_TEXT)
    expect(result.companyId).toBe('SANTA_LUCIA')
    expect(result.invoiceNumber).toBeTruthy()
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.amount).toBeGreaterThan(0)
    expect(result.confidence).toBe('high')
  })

  it('iris: extracts invoiceNumber, date, amount from fixture text', () => {
    const result = irisParser.extract(IRIS_TEXT)
    expect(result.companyId).toBe('IRIS')
    expect(result.invoiceNumber).toBeTruthy()
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.amount).toBeGreaterThan(0)
    expect(result.confidence).toBe('high')
  })

  it('iservis: extracts invoiceNumber, date, amount from fixture text', () => {
    const result = iservisParser.extract(ISERVIS_TEXT)
    expect(result.companyId).toBe('ISERVIS')
    expect(result.invoiceNumber).toBeTruthy()
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.amount).toBeGreaterThan(0)
    expect(result.confidence).toBe('high')
  })

  it('rds: extracts invoiceNumber, date, amount from fixture text', () => {
    const result = rdsParser.extract(RDS_TEXT)
    expect(result.companyId).toBe('RDS')
    expect(result.invoiceNumber).toBeTruthy()
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.amount).toBeGreaterThan(0)
    expect(result.confidence).toBe('high')
  })
})

// ---------------------------------------------------------------------------
// Low-confidence / unparseable fields
// ---------------------------------------------------------------------------

describe('parsers.extraction — low confidence when fields missing', () => {
  it('interpartner returns confidence:low when invoice number absent', () => {
    const result = interpartnerParser.extract('INTERPARTNER ASSISTANCE texto sin referencia de factura')
    expect(result.invoiceNumber).toBeNull()
    expect(result.confidence).toBe('low')
  })

  it('santa-lucia returns confidence:low when invoice number absent', () => {
    const result = santaLuciaParser.extract('SANTA LUCIA plain text with no factura')
    expect(result.invoiceNumber).toBeNull()
    expect(result.confidence).toBe('low')
  })
})

// ---------------------------------------------------------------------------
// Payment notification renaming
// ---------------------------------------------------------------------------

const PAYMENT_NOTIFICATION_TEXT = `
INTERPARTNER ASSISTANCE S.A.
NOTIFICACION DE PAGO
Nº EXPEDIENTE: 2024/00999
Fecha: 01/09/2024
ASEGURADO: Jorge Ruiz Diaz
TOTAL: 750,00 €
`

describe('parsers.extraction — payment notification', () => {
  it('interpartner: extracts data from a payment notification text', () => {
    const result = interpartnerParser.extract(PAYMENT_NOTIFICATION_TEXT)
    expect(result.invoiceNumber).toBeTruthy()
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.amount).toBeGreaterThan(0)
    // The engine will use the invoice data to generate a proposed name — not the original filename
    expect(result.rawText).toContain('NOTIFICACION DE PAGO')
  })
})

// ---------------------------------------------------------------------------
// Stub parsers: AXA and GENERALI
// ---------------------------------------------------------------------------

describe('parsers.extraction — AXA stub', () => {
  it('returns stub confidence with rawText preserved', () => {
    const result = axaParser.extract('AXA Invoice text here')
    expect(result.companyId).toBe('AXA')
    expect(result.confidence).toBe('stub')
    expect(result.invoiceNumber).toBeNull()
    expect(result.date).toBeNull()
    expect(result.rawText).toBe('AXA Invoice text here')
  })

  it('returns null for all extracted fields', () => {
    const result = axaParser.extract('')
    expect(result.firstName).toBeNull()
    expect(result.lastName).toBeNull()
    expect(result.amount).toBeNull()
  })
})

describe('parsers.extraction — GENERALI stub', () => {
  it('returns stub confidence with rawText preserved', () => {
    const result = generaliParser.extract('GENERALI Invoice text here')
    expect(result.companyId).toBe('GENERALI')
    expect(result.confidence).toBe('stub')
    expect(result.invoiceNumber).toBeNull()
    expect(result.date).toBeNull()
    expect(result.rawText).toBe('GENERALI Invoice text here')
  })

  it('returns null for all extracted fields', () => {
    const result = generaliParser.extract('')
    expect(result.firstName).toBeNull()
    expect(result.lastName).toBeNull()
    expect(result.amount).toBeNull()
  })
})
