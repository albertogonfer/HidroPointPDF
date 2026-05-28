import { describe, it, expect } from 'vitest'
import { applyTemplate } from '@/domain/pdf-renaming/services/renamingEngine'
import type { ParsedInvoice } from '@/domain/pdf-renaming/model/types'

const invoice: ParsedInvoice = {
  companyId: 'INTERPARTNER',
  invoiceNumber: '2024/001',
  date: '2024-03-15',
  amount: 1250.5,
  firstName: 'María',
  lastName: 'Gómez',
  rawText: 'some raw text',
  confidence: 'high',
}

describe('applyTemplate (renamingEngine)', () => {
  it('produces expected filename from template', () => {
    const result = applyTemplate(invoice, '{date} FRA. {invoiceNumber} {lastName}, {firstName}')
    expect(result).toBe('2024-03-15 FRA. 2024/001 Gomez, Maria')
  })

  it('strips accents from all interpolated fields', () => {
    const result = applyTemplate(invoice, '{lastName} {firstName}')
    expect(result).toBe('Gomez Maria')
  })

  it('handles null fields gracefully', () => {
    const nullInvoice: ParsedInvoice = { ...invoice, invoiceNumber: null }
    const result = applyTemplate(nullInvoice, '{date}-{invoiceNumber}')
    expect(result).toBe('2024-03-15-')
  })

  it('strips accents from lastName with ñ', () => {
    const nInvoice: ParsedInvoice = { ...invoice, lastName: 'Muñoz' }
    const result = applyTemplate(nInvoice, '{lastName}')
    expect(result).toBe('Munoz')
  })

  it('strips accents from amount (number, no accents — passes through)', () => {
    const result = applyTemplate(invoice, '{amount}')
    expect(result).toBe('1250.5')
  })
})
