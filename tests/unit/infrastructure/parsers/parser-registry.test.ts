import { describe, it, expect } from 'vitest'
import { getParser, detectCompany, parserRegistry } from '@/infrastructure/parsers/parser-registry'

describe('parserRegistry', () => {
  it('getParser returns INTERPARTNER parser', () => {
    const parser = getParser('INTERPARTNER')
    expect(parser).toBeDefined()
    expect(parser?.companyId).toBe('INTERPARTNER')
  })

  it('getParser returns SANTA_LUCIA parser', () => {
    const parser = getParser('SANTA_LUCIA')
    expect(parser).toBeDefined()
    expect(parser?.companyId).toBe('SANTA_LUCIA')
  })

  it('getParser returns IRIS parser', () => {
    const parser = getParser('IRIS')
    expect(parser?.companyId).toBe('IRIS')
  })

  it('getParser returns ISERVIS parser', () => {
    const parser = getParser('ISERVIS')
    expect(parser?.companyId).toBe('ISERVIS')
  })

  it('getParser returns RDS parser', () => {
    const parser = getParser('RDS')
    expect(parser?.companyId).toBe('RDS')
  })

  it('getParser returns AXA stub parser', () => {
    const parser = getParser('AXA')
    expect(parser?.companyId).toBe('AXA')
  })

  it('getParser returns GENERALI stub parser', () => {
    const parser = getParser('GENERALI')
    expect(parser?.companyId).toBe('GENERALI')
  })

  it('getParser returns undefined for unknown company', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getParser('UNKNOWN' as any)).toBeUndefined()
  })

  it('registry contains all 7 companies', () => {
    expect(parserRegistry.size).toBe(7)
  })
})

describe('detectCompany', () => {
  it('detects INTERPARTNER from text keyword', () => {
    const result = detectCompany('Nº EXP: 2024/001 INTERPARTNER ASSISTANCE')
    expect(result).toBe('INTERPARTNER')
  })

  it('detects SANTA_LUCIA from text keyword', () => {
    const result = detectCompany('SANTA LUCIA S.A. Seguros y Reaseguros')
    expect(result).toBe('SANTA_LUCIA')
  })

  it('detects IRIS from text keyword', () => {
    const result = detectCompany('IRIS Assistance recibo pago')
    expect(result).toBe('IRIS')
  })

  it('detects ISERVIS from text keyword', () => {
    const result = detectCompany('iServis factura servicio')
    expect(result).toBe('ISERVIS')
  })

  it('detects RDS from text keyword', () => {
    const result = detectCompany('RDS Servicios factura 2024')
    expect(result).toBe('RDS')
  })

  it('detects AXA from text keyword', () => {
    const result = detectCompany('AXA SEGUROS GENERALES')
    expect(result).toBe('AXA')
  })

  it('detects GENERALI from text keyword', () => {
    const result = detectCompany('Generali España recibo')
    expect(result).toBe('GENERALI')
  })

  it('returns null for unknown text', () => {
    const result = detectCompany('some random document text')
    expect(result).toBeNull()
  })
})
