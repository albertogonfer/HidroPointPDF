import { describe, it, expect } from 'vitest'
import { interpolateTemplate } from '@/domain/pdf-renaming/services/templateInterpolator'
import type { ParsedInvoice } from '@/domain/pdf-renaming/model/types'

const baseInvoice: ParsedInvoice = {
  companyId: 'INTERPARTNER',
  invoiceNumber: '2024/001',
  date: '2024-03-15',
  amount: 1250.5,
  firstName: 'Juan',
  lastName: 'García',
  rawText: 'raw pdf text',
  confidence: 'high',
}

describe('interpolateTemplate', () => {
  it('replaces {date} token', () => {
    const result = interpolateTemplate('{date}', baseInvoice)
    expect(result).toBe('2024-03-15')
  })

  it('replaces {invoiceNumber} token', () => {
    const result = interpolateTemplate('{invoiceNumber}', baseInvoice)
    expect(result).toBe('2024/001')
  })

  it('replaces {lastName} token', () => {
    const result = interpolateTemplate('{lastName}', baseInvoice)
    expect(result).toBe('García')
  })

  it('replaces {firstName} token', () => {
    const result = interpolateTemplate('{firstName}', baseInvoice)
    expect(result).toBe('Juan')
  })

  it('replaces {amount} token', () => {
    const result = interpolateTemplate('{amount}', baseInvoice)
    expect(result).toBe('1250.5')
  })

  it('replaces multiple tokens in one template', () => {
    const result = interpolateTemplate('{date} FRA. {invoiceNumber} {lastName}, {firstName}', baseInvoice)
    expect(result).toBe('2024-03-15 FRA. 2024/001 García, Juan')
  })

  it('replaces missing field with empty string', () => {
    const nullInvoice: ParsedInvoice = { ...baseInvoice, invoiceNumber: null, date: null }
    const result = interpolateTemplate('{date} {invoiceNumber}', nullInvoice)
    expect(result).toBe(' ')
  })

  it('leaves unknown tokens as-is', () => {
    const result = interpolateTemplate('{unknown}', baseInvoice)
    expect(result).toBe('{unknown}')
  })

  it('handles empty template', () => {
    const result = interpolateTemplate('', baseInvoice)
    expect(result).toBe('')
  })
})
