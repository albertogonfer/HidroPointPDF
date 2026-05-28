export type CompanyId =
  | 'INTERPARTNER'
  | 'SANTA_LUCIA'
  | 'IRIS'
  | 'AXA'
  | 'ISERVIS'
  | 'GENERALI'
  | 'RDS'

export type ParsedInvoice = {
  companyId: CompanyId
  invoiceNumber: string | null
  date: string | null
  amount: number | null
  firstName: string | null
  lastName: string | null
  rawText: string
  confidence: 'high' | 'low' | 'stub'
}

export interface InvoiceParser {
  companyId: CompanyId
  extract(pdfText: string): ParsedInvoice
}
