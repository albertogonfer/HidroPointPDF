import type { PGlite } from '@electric-sql/pglite'

const COMPANIES = [
  { id: 'INTERPARTNER', name: 'Interpartner', folder_prefix: '01', parent_id: null },
  { id: 'SANTA_LUCIA', name: 'Santa Lucía', folder_prefix: '02', parent_id: null },
  { id: 'IRIS', name: 'Iris', folder_prefix: '03', parent_id: null },
  { id: 'AXA', name: 'AXA', folder_prefix: '04', parent_id: null },
  { id: 'ISERVIS', name: 'Iservis', folder_prefix: '05', parent_id: null },
  { id: 'GENERALI', name: 'Generali', folder_prefix: '06', parent_id: null },
  { id: 'RDS', name: 'RDS', folder_prefix: '07', parent_id: null },
]

const DEFAULT_RULES: Array<{ company_id: string; template: string }> = [
  {
    company_id: 'INTERPARTNER',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
  {
    company_id: 'SANTA_LUCIA',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
  {
    company_id: 'IRIS',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
  {
    company_id: 'AXA',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
  {
    company_id: 'ISERVIS',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
  {
    company_id: 'GENERALI',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
  {
    company_id: 'RDS',
    template: '{date} FRA. {invoiceNumber} {lastName}, {firstName}',
  },
]

export async function seed(db: PGlite): Promise<void> {
  for (const company of COMPANIES) {
    await db.query(
      `INSERT INTO companies (id, name, folder_prefix, parent_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [company.id, company.name, company.folder_prefix, company.parent_id],
    )
  }

  for (const rule of DEFAULT_RULES) {
    const existing = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM renaming_rules WHERE company_id = $1',
      [rule.company_id],
    )
    if (Number(existing.rows[0].count) === 0) {
      await db.query(
        'INSERT INTO renaming_rules (company_id, template) VALUES ($1, $2)',
        [rule.company_id, rule.template],
      )
    }
  }
}
