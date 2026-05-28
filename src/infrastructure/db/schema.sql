CREATE TABLE IF NOT EXISTS companies (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  folder_prefix TEXT NOT NULL,
  parent_id     TEXT REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS renaming_rules (
  id          SERIAL PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id),
  template    TEXT NOT NULL,
  active      BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rename_jobs (
  id             SERIAL PRIMARY KEY,
  company_id     TEXT REFERENCES companies(id),
  original_name  TEXT NOT NULL,
  proposed_name  TEXT NOT NULL,
  final_name     TEXT NOT NULL,
  target_folder  TEXT NOT NULL,
  had_override   BOOLEAN DEFAULT false,
  status         TEXT NOT NULL DEFAULT 'completed',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_registrations (
  id             SERIAL PRIMARY KEY,
  job_id         INT REFERENCES rename_jobs(id),
  invoice_number TEXT,
  invoice_date   DATE,
  amount         NUMERIC(10,2),
  registered     BOOLEAN DEFAULT false
);
