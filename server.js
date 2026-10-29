// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/db/connection.ts
import pg from "pg";

// src/db/schema.ts
var SCHEMA_SQL = `-- ConsentFlow \u2014 BSPHO ICF Workbench
-- Relational Schema for Paediatric Clinical Trials & ICF Matrix

CREATE TABLE IF NOT EXISTS studies (
    id VARCHAR(128) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_title VARCHAR(255) NOT NULL,
    sponsor TEXT NOT NULL,
    study_type VARCHAR(64) NOT NULL,
    phase VARCHAR(64) NOT NULL,
    responsible_pi TEXT NOT NULL,
    lead_site TEXT NOT NULL,
    assigned_coordinator TEXT NOT NULL DEFAULT 'Unassigned',
    current_workflow_stage VARCHAR(64) NOT NULL DEFAULT 'input_setup',
    current_step_index INTEGER NOT NULL DEFAULT 1,
    template_version VARCHAR(128) NOT NULL,
    custom_template JSONB,
    target_audiences JSONB NOT NULL DEFAULT '["adult", "parent", "adolescent", "child"]',
    target_languages JSONB NOT NULL DEFAULT '["EN", "NL", "FR"]',
    ready_documents_count INTEGER NOT NULL DEFAULT 0,
    total_documents_count INTEGER NOT NULL DEFAULT 12,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    cloud_bucket JSONB,
    bucket_files JSONB,
    created_date VARCHAR(64) NOT NULL,
    last_updated VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_sites (
    id VARCHAR(128) PRIMARY KEY,
    study_id VARCHAR(128) NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city VARCHAR(128) NOT NULL,
    country VARCHAR(128) NOT NULL DEFAULT 'Belgium',
    local_coordinator TEXT NOT NULL,
    ethics_committee_approval_date VARCHAR(64),
    insurance_policy_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_facts (
    id VARCHAR(128) PRIMARY KEY,
    study_id VARCHAR(128) NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    key VARCHAR(128) NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    conflict_value TEXT,
    source_doc TEXT NOT NULL,
    source_page INTEGER,
    confidence NUMERIC(4, 2) NOT NULL DEFAULT 0.95,
    status VARCHAR(32) NOT NULL DEFAULT 'extracted',
    affected_audiences JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consistency_issues (
    id VARCHAR(128) PRIMARY KEY,
    study_id VARCHAR(128) NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    fact_key VARCHAR(128) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'medium',
    issue_type VARCHAR(64),
    affected_docs JSONB NOT NULL DEFAULT '[]',
    source_evidence TEXT,
    discrepancy_note TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    resolution JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS icf_documents (
    id VARCHAR(128) PRIMARY KEY,
    study_id VARCHAR(128) NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    audience VARCHAR(32) NOT NULL,
    language VARCHAR(16) NOT NULL,
    title TEXT NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    status VARCHAR(64) NOT NULL DEFAULT 'draft_generated',
    issue_count INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 2500,
    last_updated VARCHAR(64) NOT NULL,
    updated_by TEXT NOT NULL,
    template_version VARCHAR(128) NOT NULL,
    blocks JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_study_audience_language UNIQUE (study_id, audience, language)
);

CREATE TABLE IF NOT EXISTS action_items (
    id VARCHAR(128) PRIMARY KEY,
    study_id VARCHAR(128) NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    study_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    target_audience VARCHAR(32),
    target_language VARCHAR(16),
    created_date VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_templates (
    id VARCHAR(128) PRIMARY KEY,
    name TEXT NOT NULL,
    base_template VARCHAR(128) NOT NULL,
    exclude_insurance BOOLEAN NOT NULL DEFAULT FALSE,
    exclude_contraception BOOLEAN NOT NULL DEFAULT FALSE,
    exclude_biobanking BOOLEAN NOT NULL DEFAULT FALSE,
    sections JSONB NOT NULL DEFAULT '[]',
    rationale TEXT,
    last_modified VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_studies_code ON studies(code);
CREATE INDEX IF NOT EXISTS idx_icf_documents_study ON icf_documents(study_id);
CREATE INDEX IF NOT EXISTS idx_study_facts_study ON study_facts(study_id);
CREATE INDEX IF NOT EXISTS idx_consistency_issues_study ON consistency_issues(study_id);
`;

// src/db/connection.ts
var { Pool } = pg;
var pool = null;
function getDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    return process.env.DATABASE_URL.trim();
  }
  const host = process.env.PGHOST || process.env.DB_HOST || "localhost";
  const port = process.env.PGPORT || process.env.DB_PORT || "5432";
  const user = process.env.PGUSER || process.env.DB_USER || "consentflow";
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || "consentflow_secret";
  const database = process.env.PGDATABASE || process.env.DB_NAME || "consentflow_db";
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
function isDatabaseConfigured() {
  return Boolean(
    process.env.DATABASE_URL || process.env.PGHOST || process.env.DB_HOST || process.env.POSTGRES_HOST
  );
}
function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    const isCloudSQL = connectionString.includes("cloudsql") || process.env.INSTANCE_CONNECTION_NAME;
    const isProduction = process.env.NODE_ENV === "production";
    pool = new Pool({
      connectionString,
      ssl: isCloudSQL || isProduction && !connectionString.includes("localhost") && !connectionString.includes("db:5432") ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 5e3
    });
    pool.on("error", (err) => {
      console.warn("[DB Pool Error]", err.message);
    });
  }
  return pool;
}
async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}
async function checkDatabaseHealth() {
  try {
    const res = await query("SELECT version()");
    return {
      ok: true,
      message: "Connected to PostgreSQL / Cloud SQL",
      version: res.rows[0]?.version
    };
  } catch (err) {
    return {
      ok: false,
      message: `Database connection failed: ${err.message}`
    };
  }
}
async function initSchema() {
  await query(SCHEMA_SQL);
  await query(`
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS assigned_coordinator TEXT NOT NULL DEFAULT 'Unassigned';
    ALTER TABLE consistency_issues ADD COLUMN IF NOT EXISTS issue_type VARCHAR(64);
    ALTER TABLE consistency_issues ADD COLUMN IF NOT EXISTS resolution JSONB;
  `);
  console.log("[DB] Schema verified and initialized successfully.");
}

// src/db/seed.ts
import { fileURLToPath } from "url";
import path from "path";

// src/services/cloudBucketService.ts
var OFFICIAL_GCS_BUCKETS = [
  {
    bucketName: "use-cases-qwiklabs-gcp-01-d64f5abfabdc",
    bucketUri: "gs://use-cases-qwiklabs-gcp-01-d64f5abfabdc/",
    region: "europe-west1 (Belgium)",
    storageClass: "STANDARD",
    encryption: "Demo label",
    compliance: "Demo sample URI \u2014 live IAM not verified",
    isConnected: false,
    lastSyncedAt: "\u2014",
    totalObjects: 24,
    totalSizeMb: 186.4
  },
  {
    bucketName: "bspho-trial-dossiers-belgium",
    bucketUri: "gs://bspho-trial-dossiers-belgium/protocols/",
    region: "europe-west1 (Brussels, Belgium)",
    storageClass: "STANDARD",
    encryption: "Demo label",
    compliance: "Demo sample URI \u2014 live IAM not verified",
    isConnected: false,
    lastSyncedAt: "\u2014",
    totalObjects: 18,
    totalSizeMb: 142.6
  },
  {
    bucketName: "bspho-official-templates-v24",
    bucketUri: "gs://bspho-official-templates-v24/master/",
    region: "europe-west1 (Brussels, Belgium)",
    storageClass: "STANDARD",
    encryption: "Demo label",
    compliance: "Demo sample URI \u2014 live IAM not verified",
    isConnected: false,
    lastSyncedAt: "\u2014",
    totalObjects: 12,
    totalSizeMb: 48.2
  },
  {
    bucketName: "uz-gent-clinical-oncology-vault",
    bucketUri: "gs://uz-gent-clinical-oncology-vault/leuk-01/",
    region: "europe-west1 (Brussels, Belgium)",
    storageClass: "STANDARD",
    encryption: "Demo label",
    compliance: "Demo sample URI \u2014 live IAM not verified",
    isConnected: false,
    lastSyncedAt: "\u2014",
    totalObjects: 6,
    totalSizeMb: 34.1
  }
];
var MOCK_BUCKET_FILES_LEUK_01 = [
  {
    id: "gcs-leuk-01",
    name: "ALL-Together1_Sponsor_Protocol_v1.4_Final.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/ALL-Together1_Sponsor_Protocol_v1.4_Final.pdf",
    category: "protocol",
    sizeBytes: 14820120,
    sizeFormatted: "14.1 MB",
    contentType: "application/pdf",
    updatedAt: "2026-10-24 16:30 CET",
    checksumMd5: "a89f3c1d94b0028e",
    etag: '"c2394a19-01"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 14
  },
  {
    id: "gcs-leuk-02",
    name: "Investigator_Brochure_PEG_Asparaginase_v3.2.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/Investigator_Brochure_PEG_Asparaginase_v3.2.pdf",
    category: "protocol",
    sizeBytes: 8912440,
    sizeFormatted: "8.5 MB",
    contentType: "application/pdf",
    updatedAt: "2026-10-22 10:15 CET",
    checksumMd5: "fe14b09e3381a8c9",
    etag: '"d9817e22-03"',
    targetAudiences: ["adult", "parent", "adolescent"],
    targetLanguages: ["EN", "NL", "FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 6
  },
  {
    id: "gcs-leuk-03",
    name: "BSPHO_ICF_Standard_Template_v2.4_Master_EN.docx",
    path: "gs://bspho-official-templates-v24/master/BSPHO_ICF_Standard_Template_v2.4_Master_EN.docx",
    category: "template",
    sizeBytes: 1248e3,
    sizeFormatted: "1.2 MB",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    updatedAt: "2026-10-15 14:00 CET",
    checksumMd5: "71c82e0a4f5d6b81",
    etag: '"b991823a-12"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 8
  },
  {
    id: "gcs-leuk-04",
    name: "BSPHO_ICF_Template_v2.4_NL_Belgie.docx",
    path: "gs://bspho-official-templates-v24/master/BSPHO_ICF_Template_v2.4_NL_Belgie.docx",
    category: "template",
    sizeBytes: 129e4,
    sizeFormatted: "1.2 MB",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    updatedAt: "2026-10-15 14:05 CET",
    checksumMd5: "3e8812c9b4f001aa",
    etag: '"bb02183a-14"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["NL"],
    ingestionStatus: "ingested",
    extractedFactsCount: 8
  },
  {
    id: "gcs-leuk-05",
    name: "BSPHO_ICF_Template_v2.4_FR_Belgique.docx",
    path: "gs://bspho-official-templates-v24/master/BSPHO_ICF_Template_v2.4_FR_Belgique.docx",
    category: "template",
    sizeBytes: 131e4,
    sizeFormatted: "1.3 MB",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    updatedAt: "2026-10-15 14:10 CET",
    checksumMd5: "4f9923da10b332cc",
    etag: '"bc13941d-15"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 8
  },
  {
    id: "gcs-leuk-06",
    name: "PI_Redline_Dr_DeMoerloose_Word_Markup_v1.2.docx",
    path: "gs://uz-gent-clinical-oncology-vault/leuk-01/PI_Redline_Dr_DeMoerloose_Word_Markup_v1.2.docx",
    category: "pi_markup",
    sizeBytes: 142e4,
    sizeFormatted: "1.4 MB",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    updatedAt: "2026-10-28 14:15 CET",
    checksumMd5: "9b28a1c84f552109",
    etag: '"ef99104b-09"',
    targetAudiences: ["parent", "adolescent"],
    targetLanguages: ["EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 3
  },
  {
    id: "gcs-leuk-07",
    name: "UZ_Gent_Site_Information_Annex_1.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/sites/UZ_Gent_Site_Information_Annex_1.pdf",
    category: "site_info",
    sizeBytes: 74e4,
    sizeFormatted: "740 KB",
    contentType: "application/pdf",
    updatedAt: "2026-10-20 09:20 CET",
    checksumMd5: "12883da0f5bc912a",
    etag: '"aa48194c-02"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["NL", "EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 4
  },
  {
    id: "gcs-leuk-08",
    name: "Saint_Luc_Hospital_Belgian_Insurance_Rider_Pending.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/sites/Saint_Luc_Hospital_Belgian_Insurance_Rider_Pending.pdf",
    category: "site_info",
    sizeBytes: 512e3,
    sizeFormatted: "512 KB",
    contentType: "application/pdf",
    updatedAt: "2026-10-27 11:00 CET",
    checksumMd5: "66a12b0e98dd4311",
    etag: '"ab9012cd-08"',
    targetAudiences: ["adult", "parent"],
    targetLanguages: ["FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 2
  }
];
var MOCK_BUCKET_FILES_NEURO_03 = [
  {
    id: "gcs-neuro-01",
    name: "SIOP-E_Medulloblastoma_Protocol_v2.1_Final.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/SIOP-E_Medulloblastoma_Protocol_v2.1_Final.pdf",
    category: "protocol",
    sizeBytes: 1124e4,
    sizeFormatted: "10.7 MB",
    contentType: "application/pdf",
    updatedAt: "2026-10-18 11:20 CET",
    checksumMd5: "c1neuro01aabbcc",
    etag: '"neuro-01"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 9
  },
  {
    id: "gcs-neuro-02",
    name: "Investigator_Brochure_Adaptive_Cohort_v1.0.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/Investigator_Brochure_Adaptive_Cohort_v1.0.pdf",
    category: "protocol",
    sizeBytes: 62e5,
    sizeFormatted: "5.9 MB",
    contentType: "application/pdf",
    updatedAt: "2026-10-12 09:00 CET",
    checksumMd5: "c1neuro02ddeeff",
    etag: '"neuro-02"',
    targetAudiences: ["adult", "parent", "adolescent"],
    targetLanguages: ["EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 5
  },
  {
    id: "gcs-neuro-03",
    name: "HIRUZ_Observational_ICF_Template_Master_EN.docx",
    path: "gs://bspho-official-templates-v24/master/HIRUZ_Observational_ICF_Template_Master_EN.docx",
    category: "template",
    sizeBytes: 98e4,
    sizeFormatted: "958 KB",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    updatedAt: "2026-09-30 16:00 CET",
    checksumMd5: "c1neuro03tmpl01",
    etag: '"neuro-03"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 4
  },
  {
    id: "gcs-neuro-04",
    name: "UZ_Antwerpen_Site_Information_Annex.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/sites/UZ_Antwerpen_Site_Information_Annex.pdf",
    category: "site_info",
    sizeBytes: 41e4,
    sizeFormatted: "400 KB",
    contentType: "application/pdf",
    updatedAt: "2026-10-08 14:40 CET",
    checksumMd5: "c1neuro04site01",
    etag: '"neuro-04"',
    targetAudiences: ["adult", "parent"],
    targetLanguages: ["NL", "EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 3
  }
];
var MOCK_BUCKET_FILES_SARCOMA_08 = [
  {
    id: "gcs-sarc-01",
    name: "Euro-Ewing_Rhabdomyosarcoma_Protocol_v3.0_Final.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/Euro-Ewing_Rhabdomyosarcoma_Protocol_v3.0_Final.pdf",
    category: "protocol",
    sizeBytes: 134e5,
    sizeFormatted: "12.8 MB",
    contentType: "application/pdf",
    updatedAt: "2026-09-01 10:00 CET",
    checksumMd5: "c1sarc01proto",
    etag: '"sarc-01"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 11
  },
  {
    id: "gcs-sarc-02",
    name: "BSPHO_ICF_Standard_Template_v2.3_Master_EN.docx",
    path: "gs://bspho-official-templates-v24/master/BSPHO_ICF_Standard_Template_v2.3_Master_EN.docx",
    category: "template",
    sizeBytes: 118e4,
    sizeFormatted: "1.1 MB",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    updatedAt: "2023-10-01 12:00 CET",
    checksumMd5: "c1sarc02tmpl",
    etag: '"sarc-02"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 7
  },
  {
    id: "gcs-sarc-03",
    name: "PI_Approved_Package_Philippet_Signoff_v2.0.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/PI_Approved_Package_Philippet_Signoff_v2.0.pdf",
    category: "pi_markup",
    sizeBytes: 22e5,
    sizeFormatted: "2.1 MB",
    contentType: "application/pdf",
    updatedAt: "2026-10-20 15:30 CET",
    checksumMd5: "c1sarc03pi",
    etag: '"sarc-03"',
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    ingestionStatus: "ingested",
    extractedFactsCount: 2
  },
  {
    id: "gcs-sarc-04",
    name: "CHC_MontLegia_Ethics_Dossier_Annex.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/sites/CHC_MontLegia_Ethics_Dossier_Annex.pdf",
    category: "ethics_dossier",
    sizeBytes: 89e4,
    sizeFormatted: "869 KB",
    contentType: "application/pdf",
    updatedAt: "2023-11-04 09:15 CET",
    checksumMd5: "c1sarc04eth",
    etag: '"sarc-04"',
    targetAudiences: ["adult", "parent"],
    targetLanguages: ["FR", "EN"],
    ingestionStatus: "ingested",
    extractedFactsCount: 4
  },
  {
    id: "gcs-sarc-05",
    name: "HUDERF_Site_Insurance_Certificate_EUR-SAR-2023-441.pdf",
    path: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/sites/HUDERF_Site_Insurance_Certificate_EUR-SAR-2023-441.pdf",
    category: "site_info",
    sizeBytes: 54e4,
    sizeFormatted: "527 KB",
    contentType: "application/pdf",
    updatedAt: "2023-11-12 11:00 CET",
    checksumMd5: "c1sarc05ins",
    etag: '"sarc-05"',
    targetAudiences: ["adult", "parent"],
    targetLanguages: ["FR", "NL"],
    ingestionStatus: "ingested",
    extractedFactsCount: 2
  }
];

// src/utils/studyLogic.ts
var DEFAULT_TEMPLATE_SECTIONS = [
  {
    id: "sec-vol-consent",
    key: "voluntary_consent",
    title: "Voluntary Consent & Withdrawal Protection",
    description: "Guarantees freedom to withdraw at any time without prejudice to continuing care.",
    isIncluded: true,
    canExclude: false,
    category: "legal",
    statutoryBasis: "Belgian Law of 7 May 2004 Art. 6"
  },
  {
    id: "sec-insurance",
    key: "insurance_liability",
    title: "No-Fault Sponsor Liability Insurance",
    description: "Article 29 mandatory insurance for interventional clinical experiments.",
    isIncluded: true,
    canExclude: true,
    category: "legal",
    statutoryBasis: "Belgian Law of 7 May 2004 Art. 29"
  },
  {
    id: "sec-procedures",
    key: "study_procedures",
    title: "Clinical Procedures & Sampling Calendar",
    description: "Detailed calendar of blood draws, bone marrow aspirates, and scans.",
    isIncluded: true,
    canExclude: false,
    category: "clinical"
  },
  {
    id: "sec-contraception",
    key: "contraception_guidance",
    title: "Adolescent Contraception & Pregnancy Risk",
    description: "Reproductive risk guidelines adapted for teenagers and parent discussions.",
    isIncluded: true,
    canExclude: true,
    category: "clinical"
  },
  {
    id: "sec-biobank",
    key: "optional_biobanking",
    title: "Optional Genetic & Tumour Biobanking",
    description: "Secondary consent for residual sample preservation in national biobank.",
    isIncluded: true,
    canExclude: true,
    category: "optional_research"
  },
  {
    id: "sec-contacts",
    key: "emergency_contacts",
    title: "Hospital Ward & 24/7 Emergency Contacts",
    description: "Local Belgian participating site contact phone and PI pager details.",
    isIncluded: true,
    canExclude: false,
    category: "administrative"
  }
];
function createCustomTemplateConfig(name = "BSPHO Custom Paediatric Template", baseTemplate = "BSPHO ICF Template v2.4 (2024)", overrides) {
  const excludeInsurance = overrides?.excludeInsurance ?? false;
  const excludeContraception = overrides?.excludeContraception ?? false;
  const excludeBiobanking = overrides?.excludeBiobanking ?? false;
  const sections = DEFAULT_TEMPLATE_SECTIONS.map((sec) => {
    if (sec.key === "insurance_liability") {
      return { ...sec, isIncluded: !excludeInsurance };
    }
    if (sec.key === "contraception_guidance") {
      return { ...sec, isIncluded: !excludeContraception };
    }
    if (sec.key === "optional_biobanking") {
      return { ...sec, isIncluded: !excludeBiobanking };
    }
    return { ...sec };
  });
  return {
    id: overrides?.id || `tmpl-${Date.now()}`,
    name,
    baseTemplate,
    excludeInsurance,
    excludeContraception,
    excludeBiobanking,
    sections,
    rationale: overrides?.rationale || "Tailored for paediatric academic trial requirements.",
    lastModified: "2026-10-29"
  };
}

// src/data/mockData.ts
var MOCK_STUDY_BLOCKS_PARENT_EN = [
  {
    id: "blk-001",
    sectionNumber: "1.0",
    title: "Title of the Clinical Study and Regulatory Identification",
    policy: "REQUIRED_VERBATIM",
    content: "Official Title: ALL-Together1: A Treatment Study Protocol for Paediatric Acute Lymphoblastic Leukaemia.\nEudraCT / CTIS: 2024-500293-18-00 | Belgian Protocol Code: BSPHO-2024-LEUK-01.\nSponsor: European Leukaemia Network & BSPHO Working Group.",
    sourceReference: "Protocol Cover & CTIS Registry Summary",
    isEditedByPI: false
  },
  {
    id: "blk-002",
    sectionNumber: "2.1",
    title: "Purpose of this Research Study",
    policy: "ADAPTABLE_REQUIRED",
    content: "Your child is being invited to take part in a medical research study for Acute Lymphoblastic Leukaemia (ALL). The purpose of this study is to determine if risk-stratified therapy with PEG-Asparaginase reduces relapse risk while minimising treatment-related toxicities.",
    sourceReference: "Protocol Section 2.3 (Study Rationale)",
    isEditedByPI: false
  },
  {
    id: "blk-003",
    sectionNumber: "3.2",
    title: "Mandatory Legal Notification (Belgian Law of 7 May 2004)",
    policy: "REQUIRED_VERBATIM",
    content: "Participation in this clinical experiment is entirely voluntary. Refusal to participate or decision to withdraw at any time will not affect the quality of ongoing medical care, relationship with the treating physicians, or future healthcare entitlements under the Belgian compulsory healthcare insurance.",
    sourceReference: "BSPHO Standard Template v2.4, Legal Clause Art. 6",
    isEditedByPI: false
  },
  {
    id: "blk-004",
    sectionNumber: "4.2",
    title: "Study Procedures & Blood Sampling Schedule",
    policy: "ADAPTABLE_REQUIRED",
    content: "During the 6-week induction phase, your child will have 3 blood draws (approximately 5 mL each) scheduled during routine venous cannula access, minimizing needle distress. In addition, 2 bone marrow aspirates will be performed under standard paediatric procedural sedation.",
    sourceReference: "Investigator markup / Protocol p.20 mentions 4 draws",
    isEditedByPI: true,
    notes: "PI Dr. De Moerloose revised from 4 to 3 blood draws to reflect amended local clinical protocol."
  },
  {
    id: "blk-005",
    sectionNumber: "5.0",
    title: "No-Fault Clinical Trial Insurance (Belgian Law Clause)",
    policy: "REQUIRED_VERBATIM",
    content: "Even in the absence of fault, the sponsor is liable for damages sustained by the participant directly linked to the clinical trial, pursuant to Article 29 of the Belgian Law of 7 May 2004. Insurance has been subscribed with Chubb European Group SE, Policy number BEL-CLIN-2024-9982.",
    sourceReference: "Site Agreement & Insurance Certificate",
    isEditedByPI: false
  },
  {
    id: "blk-006",
    sectionNumber: "6.1",
    title: "Site Emergency Contact Details",
    policy: "PLACEHOLDER",
    content: "24/7 Paediatric Oncology On-Call Service: Demo Site Clinic, Campus Demo Lane 1, 9000 Demo-City. Phone: +32 00 000 00 00 (synthetic). Treating Investigator: Prof. Dr. Barbara De Moerloose (demo cast).",
    sourceReference: "Site Information Form Annex 1",
    isEditedByPI: false
  }
];
function generate12Documents(studyId, templateVersion) {
  const audiences = [
    { key: "adult", titlePrefix: "Adult Participant Information & Consent Form", baseWords: 3800 },
    { key: "parent", titlePrefix: "Parent / Legal Guardian Informed Consent Form", baseWords: 4300 },
    { key: "adolescent", titlePrefix: "Adolescent Information & Assent Form (12\u201317y)", baseWords: 2600 },
    { key: "child", titlePrefix: "Children Information & Assent Booklet (8\u201311y)", baseWords: 1400 }
  ];
  const languages = [
    { key: "EN", suffix: "EN" },
    { key: "NL", suffix: "NL" },
    { key: "FR", suffix: "FR" }
  ];
  const docs = [];
  for (const aud of audiences) {
    for (const lang of languages) {
      const docId = `doc-${studyId}-${aud.key}-${lang.key.toLowerCase()}`;
      let status = "draft_generated";
      let issueCount = 0;
      let version = "v1.0";
      if (studyId === "study-leuk-01") {
        if (aud.key === "adult" && lang.key === "EN") {
          status = "approved";
          version = "v1.2";
        } else if (aud.key === "adult" && (lang.key === "NL" || lang.key === "FR")) {
          status = "ready_to_translate";
          version = "v1.0";
        } else if (aud.key === "parent" && lang.key === "EN") {
          status = "pi_edited";
          version = "v1.2";
          issueCount = 1;
        } else if (aud.key === "parent" && lang.key === "NL") {
          status = "translating";
          version = "v1.0";
          issueCount = 1;
        } else if (aud.key === "parent" && lang.key === "FR") {
          status = "awaiting_pi_review";
          version = "v1.0";
          issueCount = 2;
        } else if (aud.key === "adolescent" && lang.key === "EN") {
          status = "awaiting_pi_review";
          version = "v1.1";
          issueCount = 1;
        } else if (aud.key === "adolescent") {
          status = "draft_generated";
          version = "v0.9";
          issueCount = 1;
        } else if (aud.key === "child") {
          status = lang.key === "FR" ? "approved" : "approved";
          version = "v1.1";
          issueCount = 0;
        }
      } else if (studyId === "study-sarcoma-08") {
        status = "exported";
        version = "v2.0";
        issueCount = 0;
      } else if (studyId === "study-neuro-03") {
        if (lang.key === "EN") {
          status = "draft_generated";
          version = "v0.8";
          issueCount = 2;
        } else {
          status = "not_started";
          version = "v0.1";
          issueCount = 0;
        }
      }
      docs.push({
        id: docId,
        studyId,
        audience: aud.key,
        language: lang.key,
        title: `${aud.titlePrefix} (${lang.suffix})`,
        version,
        status,
        issueCount,
        wordCount: aud.baseWords + (lang.key === "FR" ? 240 : lang.key === "NL" ? 120 : 0),
        lastUpdated: "2026-10-28",
        updatedBy: lang.key === "EN" ? "Prof. Dr. De Moerloose" : "Elena Vanderberghe (BSPHO)",
        templateVersion,
        blocks: aud.key === "parent" && lang.key === "EN" ? MOCK_STUDY_BLOCKS_PARENT_EN : void 0
      });
    }
  }
  return docs;
}
var INITIAL_STUDIES = [
  {
    id: "study-leuk-01",
    code: "BSPHO-2024-LEUK-01",
    title: "ALL-Together1: European Treatment Protocol for Paediatric Acute Lymphoblastic Leukaemia",
    shortTitle: "ALL-Together1 Paediatric ALL",
    sponsor: "European Leukaemia Network & BSPHO Leukaemia Committee",
    studyType: "Phase I/II Paediatric Trial",
    phase: "Phase III Multicentric",
    responsiblePI: "Prof. Dr. Barbara De Moerloose",
    leadSite: "UZ Gent - Paediatric Haematology & Oncology",
    assignedCoordinator: "Dr. Sophie Laurent",
    participatingSites: [
      {
        id: "site-uzg",
        name: "UZ Gent",
        city: "Gent",
        country: "Belgium",
        localCoordinator: "Elena Vanderberghe",
        ethicsCommitteeApprovalDate: "2024-06-15",
        insurancePolicyId: "BEL-CLIN-2024-9982"
      },
      {
        id: "site-uzl",
        name: "UZ Leuven (Campus Gasthuisberg)",
        city: "Leuven",
        country: "Belgium",
        localCoordinator: "Dr. Anne Uyttebroeck",
        ethicsCommitteeApprovalDate: "2024-07-02",
        insurancePolicyId: "BEL-CLIN-2024-9982"
      },
      {
        id: "site-csl",
        name: "Cliniques universitaires Saint-Luc",
        city: "Brussels",
        country: "Belgium",
        localCoordinator: "Dr. Marc Henrion",
        insurancePolicyId: void 0
        // Demonstrating missing insurance
      },
      {
        id: "site-huderf",
        name: "HUDERF (H\xF4pital Universitaire Des Enfants Reine Fabiola)",
        city: "Brussels",
        country: "Belgium",
        localCoordinator: "Dr. Alina Ferster",
        ethicsCommitteeApprovalDate: "2024-06-20",
        insurancePolicyId: "BEL-CLIN-2024-9982"
      }
    ],
    currentWorkflowStage: "pi_review",
    currentStepIndex: 5,
    templateVersion: "BSPHO ICF Template v2.4 (2024)",
    customTemplate: createCustomTemplateConfig(
      "BSPHO Interventional v2.4 (Standard)",
      "BSPHO ICF Template v2.4 (2024)"
    ),
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    documents: generate12Documents("study-leuk-01", "BSPHO ICF Template v2.4 (2024)"),
    facts: [
      {
        id: "fact-1",
        studyId: "study-leuk-01",
        key: "study_duration",
        label: "Total Study Duration",
        value: "24 months maintenance, 36 months total follow-up",
        sourceDoc: "Protocol Section 4.1",
        sourcePage: 14,
        confidence: 0.98,
        status: "confirmed",
        affectedAudiences: ["adult", "parent", "adolescent", "child"]
      },
      {
        id: "fact-2",
        studyId: "study-leuk-01",
        key: "blood_draws",
        label: "Number of Blood Draws (Induction)",
        value: "3 blood draws (PI markup)",
        conflictValue: "4 blood draws (Sponsor protocol page 20)",
        sourceDoc: "Sponsor Protocol v1.4, Section 6.2 vs Investigator Track Changes",
        sourcePage: 20,
        confidence: 0.76,
        status: "conflicted",
        affectedAudiences: ["adult", "parent", "adolescent", "child"]
      },
      {
        id: "fact-3",
        studyId: "study-leuk-01",
        key: "investigational_agent",
        label: "Investigational Intervention",
        value: "PEG-Asparaginase combined with Methotrexate",
        sourceDoc: "Investigator Brochure (IB) Section 3.2",
        sourcePage: 8,
        confidence: 0.99,
        status: "confirmed",
        affectedAudiences: ["adult", "parent", "adolescent"]
      },
      {
        id: "fact-4",
        studyId: "study-leuk-01",
        key: "site_insurance",
        label: "Belgian Clinical Trial No-Fault Insurance",
        value: "Chubb European Group SE - Policy BEL-CLIN-2024-9982",
        sourceDoc: "Central Ethics Dossier Annex 4",
        sourcePage: 1,
        confidence: 0.95,
        status: "conflicted",
        conflictValue: "Saint-Luc local rider missing certificate of insurance",
        affectedAudiences: ["adult", "parent"]
      }
    ],
    issues: [
      {
        id: "iss-01",
        studyId: "study-leuk-01",
        title: "Blood Sampling Frequency Discrepancy (4 vs 3 draws)",
        description: "Protocol p. 20 specifies 4 venous blood samples during the induction phase. PI Dr. De Moerloose marked 3 draws in the English draft to conform with local central venous access protocols. Dutch and French parent templates must be synchronized.",
        factKey: "blood_draws",
        severity: "high",
        affectedDocs: [
          { audience: "parent", language: "EN" },
          { audience: "parent", language: "NL" },
          { audience: "parent", language: "FR" },
          { audience: "adolescent", language: "EN" }
        ],
        sourceEvidence: "Sponsor Protocol p.20 vs Word Redline by Dr. De Moerloose",
        discrepancyNote: "Requires PI sign-off before propagating amendment to NL/FR translations.",
        status: "open",
        issueType: "clinical_discrepancy"
      },
      {
        id: "iss-02",
        studyId: "study-leuk-01",
        title: "Missing Insurance Certificate for Saint-Luc Hospital Site",
        description: "Local annex for Cliniques universitaires Saint-Luc does not have the mandatory policy addendum required under Article 29 of the Belgian Law of 7 May 2004.",
        factKey: "site_insurance",
        severity: "high",
        affectedDocs: [
          { audience: "parent", language: "FR" },
          { audience: "adult", language: "FR" }
        ],
        sourceEvidence: "Site Information Dossier (Saint-Luc)",
        discrepancyNote: "Site coordinator Dr. Marc Henrion contacted on 2026-10-27.",
        status: "open",
        issueType: "site_compliance"
      }
    ],
    createdDate: "2024-05-10",
    lastUpdated: "2026-10-28",
    readyDocumentsCount: 4,
    totalDocumentsCount: 12,
    completionPercentage: 33,
    cloudBucket: OFFICIAL_GCS_BUCKETS[0],
    bucketFiles: MOCK_BUCKET_FILES_LEUK_01
  },
  {
    id: "study-neuro-03",
    code: "BSPHO-2024-NEURO-03",
    title: "SIOP-E High-Risk Medulloblastoma & Neuroblastoma Adaptive Trial",
    shortTitle: "SIOP-E Medulloblastoma Trial",
    sponsor: "SIOP Europe Brain Tumour Group",
    studyType: "Phase I/II Paediatric Trial",
    phase: "Phase II Adaptive Cohort",
    responsiblePI: "Dr. Joris Verlooy",
    leadSite: "UZ Antwerpen",
    assignedCoordinator: "Elena Vanderberghe",
    participatingSites: [
      {
        id: "site-uza",
        name: "UZ Antwerpen",
        city: "Edegem / Antwerpen",
        country: "Belgium",
        localCoordinator: "Dr. Joris Verlooy",
        ethicsCommitteeApprovalDate: "2024-08-11",
        insurancePolicyId: "BEL-NEURO-2024-001"
      },
      {
        id: "site-uzl-2",
        name: "UZ Leuven",
        city: "Leuven",
        country: "Belgium",
        localCoordinator: "Prof. Dr. Sandra Jacobs",
        ethicsCommitteeApprovalDate: "2024-08-15",
        insurancePolicyId: "BEL-NEURO-2024-001"
      }
    ],
    currentWorkflowStage: "draft_generation",
    currentStepIndex: 4,
    templateVersion: "BSPHO ICF Template v2.4 (2024)",
    customTemplate: createCustomTemplateConfig(
      "HIRUZ Observational (Insurance Excluded)",
      "HIRUZ Paediatric Observational Template",
      {
        excludeInsurance: true,
        rationale: "Non-interventional protocol: Art. 29 no-fault insurance waived per Belgian FAMHP guidance."
      }
    ),
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    documents: generate12Documents("study-neuro-03", "BSPHO ICF Template v2.4 (2024)"),
    facts: [
      {
        id: "fact-n1",
        studyId: "study-neuro-03",
        key: "study_duration",
        label: "Study Duration",
        value: "18 months active therapy + 5 years survivorship",
        sourceDoc: "SIOP-E Medulloblastoma Protocol v2.1, Section 3.1",
        sourcePage: 9,
        confidence: 0.95,
        status: "confirmed",
        affectedAudiences: ["adult", "parent", "adolescent", "child"]
      },
      {
        id: "fact-n2",
        studyId: "study-neuro-03",
        key: "imaging_schedule",
        label: "MRI Surveillance Schedule",
        value: "Baseline + every 3 months during active therapy",
        sourceDoc: "SIOP-E Medulloblastoma Protocol v2.1, Section 5.4",
        sourcePage: 22,
        confidence: 0.91,
        status: "confirmed",
        affectedAudiences: ["adult", "parent", "adolescent"]
      },
      {
        id: "fact-n3",
        studyId: "study-neuro-03",
        key: "insurance_waiver",
        label: "No-Fault Insurance Status",
        value: "Waived \u2014 observational / non-interventional FAMHP guidance",
        sourceDoc: "HIRUZ Observational Template policy note",
        sourcePage: 1,
        confidence: 0.88,
        status: "confirmed",
        affectedAudiences: ["adult", "parent"]
      }
    ],
    issues: [],
    createdDate: "2024-07-22",
    lastUpdated: "2026-10-25",
    readyDocumentsCount: 0,
    totalDocumentsCount: 12,
    completionPercentage: 15,
    cloudBucket: {
      ...OFFICIAL_GCS_BUCKETS[1],
      bucketUri: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/",
      lastSyncedAt: "2026-10-25 09:10 CET",
      totalObjects: 4,
      totalSizeMb: 18
    },
    bucketFiles: MOCK_BUCKET_FILES_NEURO_03
  },
  {
    id: "study-sarcoma-08",
    code: "BSPHO-2023-SARCOMA-08",
    title: "Euro-Ewing Paediatric & Adolescent Rhabdomyosarcoma Protocol",
    shortTitle: "Euro-Ewing Sarcoma Trial",
    sponsor: "Euro-Ewing Consortium / BSPHO Sarcoma Committee",
    studyType: "Interventional",
    phase: "Phase III",
    responsiblePI: "Prof. Dr. Pierre Philippet",
    leadSite: "CHC MontL\xE9gia Li\xE8ge",
    assignedCoordinator: "Dr. Marc Henrion",
    participatingSites: [
      {
        id: "site-chc",
        name: "CHC MontL\xE9gia Li\xE8ge",
        city: "Li\xE8ge",
        country: "Belgium",
        localCoordinator: "Prof. Dr. Pierre Philippet",
        ethicsCommitteeApprovalDate: "2023-11-04",
        insurancePolicyId: "EUR-SAR-2023-441"
      },
      {
        id: "site-hud-2",
        name: "HUDERF Brussels",
        city: "Brussels",
        country: "Belgium",
        localCoordinator: "Dr. Laurence Dedeken",
        ethicsCommitteeApprovalDate: "2023-11-12",
        insurancePolicyId: "EUR-SAR-2023-441"
      }
    ],
    currentWorkflowStage: "finalize_export",
    currentStepIndex: 8,
    templateVersion: "BSPHO ICF Template v2.3 (2023)",
    customTemplate: createCustomTemplateConfig(
      "BSPHO Interventional v2.3 (Sarcoma archive)",
      "BSPHO ICF Template v2.3 (2023)"
    ),
    targetAudiences: ["adult", "parent", "adolescent", "child"],
    targetLanguages: ["EN", "NL", "FR"],
    documents: generate12Documents("study-sarcoma-08", "BSPHO ICF Template v2.3 (2023)"),
    facts: [
      {
        id: "fact-s1",
        studyId: "study-sarcoma-08",
        key: "study_duration",
        label: "Total Study Duration",
        value: "12 months induction/consolidation + 24 months follow-up",
        sourceDoc: "Euro-Ewing Protocol v3.0, Section 4.1",
        sourcePage: 16,
        confidence: 0.97,
        status: "confirmed",
        affectedAudiences: ["adult", "parent", "adolescent", "child"]
      },
      {
        id: "fact-s2",
        studyId: "study-sarcoma-08",
        key: "investigational_agent",
        label: "Investigational Intervention",
        value: "Standard multi-agent chemo \xB1 radiotherapy per risk stratum",
        sourceDoc: "Euro-Ewing Protocol v3.0, Section 6.0",
        sourcePage: 28,
        confidence: 0.96,
        status: "confirmed",
        affectedAudiences: ["adult", "parent", "adolescent"]
      },
      {
        id: "fact-s3",
        studyId: "study-sarcoma-08",
        key: "site_insurance",
        label: "Belgian Clinical Trial No-Fault Insurance",
        value: "Policy EUR-SAR-2023-441 (both participating sites)",
        sourceDoc: "HUDERF / CHC insurance certificates",
        sourcePage: 1,
        confidence: 0.99,
        status: "confirmed",
        affectedAudiences: ["adult", "parent"]
      }
    ],
    issues: [
      {
        id: "iss-s01",
        studyId: "study-sarcoma-08",
        title: "Radiotherapy optional wording \u2014 resolved for export",
        description: "Earlier NL parent draft omitted optional radiotherapy language present in EN. Corrected and re-exported in v2.0 package.",
        factKey: "investigational_agent",
        severity: "medium",
        affectedDocs: [
          { audience: "parent", language: "NL" },
          { audience: "parent", language: "FR" }
        ],
        sourceEvidence: "Euro-Ewing Protocol v3.0 \xA76.0 vs PI-approved package v2.0",
        discrepancyNote: "Resolved prior to finalize/export \u2014 retained for audit trail.",
        status: "resolved",
        issueType: "translation_inconsistency",
        resolution: {
          decision: "propagate_selected_value",
          selectedValue: "Include optional radiotherapy wording in NL/FR",
          rationale: "Align all languages with protocol \xA76.0 before ethics package export.",
          reviewerName: "Dr. Marc Henrion",
          reviewerRole: "Study Coordinator",
          decidedAt: "2026-10-15T10:00:00.000Z",
          demoSessionOnly: true
        }
      }
    ],
    createdDate: "2023-09-15",
    lastUpdated: "2026-10-27",
    readyDocumentsCount: 12,
    totalDocumentsCount: 12,
    completionPercentage: 100,
    cloudBucket: {
      ...OFFICIAL_GCS_BUCKETS[1],
      bucketUri: "gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/",
      lastSyncedAt: "2026-10-27 08:45 CET",
      totalObjects: 5,
      totalSizeMb: 17.4
    },
    bucketFiles: MOCK_BUCKET_FILES_SARCOMA_08
  }
];
var MOCK_ACTION_ITEMS = [
  {
    id: "act-01",
    studyId: "study-leuk-01",
    studyName: "BSPHO-2024-LEUK-01 (ALL-Together1)",
    title: "Missing site insurance rider for Saint-Luc Hospital",
    description: "Required by Belgian Law of 7 May 2004 Article 29 before ethical dossier submission. French ICF variants currently lack local insurer reference.",
    type: "missing_info",
    priority: "critical",
    targetAudience: "parent",
    targetLanguage: "FR",
    createdDate: "2026-10-27"
  },
  {
    id: "act-02",
    studyId: "study-leuk-01",
    studyName: "BSPHO-2024-LEUK-01 (ALL-Together1)",
    title: "PI-edited English document awaiting NL/FR translation",
    description: "Prof. Dr. De Moerloose uploaded redline revisions for Parent (EN) Section 4.2. Ready for constrained translation into Dutch and French templates.",
    type: "pi_review",
    priority: "high",
    targetAudience: "parent",
    targetLanguage: "EN",
    createdDate: "2026-10-28"
  },
  {
    id: "act-03",
    studyId: "study-leuk-01",
    studyName: "BSPHO-2024-LEUK-01 (ALL-Together1)",
    title: "Discrepancy: Blood sampling count between protocol & draft",
    description: "Sponsor Protocol Section 6.2 states 4 venous blood draws; Investigator revision specifies 3 draws. Discrepancy impact flagged for 4 documents.",
    type: "discrepancy",
    priority: "high",
    createdDate: "2026-10-28"
  },
  {
    id: "act-04",
    studyId: "study-sarcoma-08",
    studyName: "BSPHO-2023-SARCOMA-08 (Euro-Ewing)",
    title: "BSPHO Template v2.4 migration available for approval",
    description: "New national template release v2.4 includes updated GDPR clause and paediatric assent layout. 12 documents eligible for automated migration review.",
    type: "template_update",
    priority: "medium",
    createdDate: "2026-10-24"
  }
];

// src/db/seed.ts
async function runSeeder() {
  console.log("[Seeder] Starting idempotent database seed...");
  await initSchema();
  let studiesInserted = 0;
  let documentsInserted = 0;
  let factsInserted = 0;
  let issuesInserted = 0;
  let sitesInserted = 0;
  let actionsInserted = 0;
  let skippedCount = 0;
  for (const study of INITIAL_STUDIES) {
    const checkStudy = await query("SELECT id FROM studies WHERE id = $1", [study.id]);
    if (checkStudy.rows.length === 0) {
      await query(
        `INSERT INTO studies (
          id, code, title, short_title, sponsor, study_type, phase,
          responsible_pi, lead_site, assigned_coordinator, current_workflow_stage, current_step_index,
          template_version, custom_template, target_audiences, target_languages,
          ready_documents_count, total_documents_count, completion_percentage,
          cloud_bucket, bucket_files, created_date, last_updated
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19,
          $20, $21, $22, $23
        ) ON CONFLICT (id) DO NOTHING`,
        [
          study.id,
          study.code,
          study.title,
          study.shortTitle,
          study.sponsor,
          study.studyType,
          study.phase,
          study.responsiblePI,
          study.leadSite,
          study.assignedCoordinator,
          study.currentWorkflowStage,
          study.currentStepIndex,
          study.templateVersion,
          JSON.stringify(study.customTemplate || null),
          JSON.stringify(study.targetAudiences),
          JSON.stringify(study.targetLanguages),
          study.readyDocumentsCount,
          study.totalDocumentsCount,
          study.completionPercentage,
          JSON.stringify(study.cloudBucket || null),
          JSON.stringify(study.bucketFiles || null),
          study.createdDate,
          study.lastUpdated
        ]
      );
      studiesInserted++;
    } else {
      await query(
        `UPDATE studies
         SET assigned_coordinator = $1,
             ready_documents_count = $2,
             completion_percentage = $3,
             current_workflow_stage = $4,
             current_step_index = $5,
             custom_template = $6,
             cloud_bucket = $7,
             bucket_files = $8,
             last_updated = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10`,
        [
          study.assignedCoordinator,
          study.readyDocumentsCount,
          study.completionPercentage,
          study.currentWorkflowStage,
          study.currentStepIndex,
          JSON.stringify(study.customTemplate || null),
          JSON.stringify(study.cloudBucket || null),
          JSON.stringify(study.bucketFiles || null),
          study.lastUpdated,
          study.id
        ]
      );
      skippedCount++;
    }
    for (const site of study.participatingSites) {
      const checkSite = await query("SELECT id FROM study_sites WHERE id = $1", [site.id]);
      if (checkSite.rows.length === 0) {
        await query(
          `INSERT INTO study_sites (
            id, study_id, name, city, country, local_coordinator,
            ethics_committee_approval_date, insurance_policy_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING`,
          [
            site.id,
            study.id,
            site.name,
            site.city,
            site.country || "Belgium",
            site.localCoordinator,
            site.ethicsCommitteeApprovalDate || null,
            site.insurancePolicyId || null
          ]
        );
        sitesInserted++;
      }
    }
    for (const fact of study.facts) {
      const checkFact = await query("SELECT id FROM study_facts WHERE id = $1", [fact.id]);
      if (checkFact.rows.length === 0) {
        await query(
          `INSERT INTO study_facts (
            id, study_id, key, label, value, conflict_value,
            source_doc, source_page, confidence, status, affected_audiences
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING`,
          [
            fact.id,
            study.id,
            fact.key,
            fact.label,
            fact.value,
            fact.conflictValue || null,
            fact.sourceDoc,
            fact.sourcePage || null,
            fact.confidence,
            fact.status,
            JSON.stringify(fact.affectedAudiences)
          ]
        );
        factsInserted++;
      } else {
        await query(
          `UPDATE study_facts
           SET label = $1,
               value = $2,
               conflict_value = $3,
               source_doc = $4,
               source_page = $5,
               confidence = $6,
               status = $7,
               affected_audiences = $8
           WHERE id = $9`,
          [
            fact.label,
            fact.value,
            fact.conflictValue || null,
            fact.sourceDoc,
            fact.sourcePage || null,
            fact.confidence,
            fact.status,
            JSON.stringify(fact.affectedAudiences),
            fact.id
          ]
        );
      }
    }
    for (const issue of study.issues) {
      const checkIssue = await query("SELECT id FROM consistency_issues WHERE id = $1", [issue.id]);
      if (checkIssue.rows.length === 0) {
        await query(
          `INSERT INTO consistency_issues (
            id, study_id, title, description, fact_key,
            severity, issue_type, affected_docs, source_evidence, discrepancy_note, status, resolution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING`,
          [
            issue.id,
            study.id,
            issue.title,
            issue.description,
            issue.factKey,
            issue.severity,
            issue.issueType || null,
            JSON.stringify(issue.affectedDocs),
            issue.sourceEvidence,
            issue.discrepancyNote,
            issue.status,
            issue.resolution ? JSON.stringify(issue.resolution) : null
          ]
        );
        issuesInserted++;
      } else {
        await query(
          `UPDATE consistency_issues
           SET issue_type = COALESCE($1, issue_type),
               severity = $2,
               status = $3,
               affected_docs = $4,
               source_evidence = $5,
               discrepancy_note = $6
           WHERE id = $7`,
          [
            issue.issueType || null,
            issue.severity,
            issue.status,
            JSON.stringify(issue.affectedDocs),
            issue.sourceEvidence,
            issue.discrepancyNote,
            issue.id
          ]
        );
      }
    }
    for (const doc of study.documents) {
      const checkDoc = await query("SELECT id FROM icf_documents WHERE id = $1", [doc.id]);
      if (checkDoc.rows.length === 0) {
        await query(
          `INSERT INTO icf_documents (
            id, study_id, audience, language, title, version,
            status, issue_count, word_count, last_updated, updated_by,
            template_version, blocks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING`,
          [
            doc.id,
            study.id,
            doc.audience,
            doc.language,
            doc.title,
            doc.version,
            doc.status,
            doc.issueCount,
            doc.wordCount,
            doc.lastUpdated,
            doc.updatedBy,
            doc.templateVersion,
            JSON.stringify(doc.blocks || [])
          ]
        );
        documentsInserted++;
      } else {
        await query(
          `UPDATE icf_documents
           SET status = $1,
               issue_count = $2,
               version = $3,
               word_count = $4,
               last_updated = $5,
               updated_by = $6,
               template_version = $7,
               blocks = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [
            doc.status,
            doc.issueCount,
            doc.version,
            doc.wordCount,
            doc.lastUpdated,
            doc.updatedBy,
            doc.templateVersion,
            JSON.stringify(doc.blocks || []),
            doc.id
          ]
        );
      }
    }
  }
  for (const item of MOCK_ACTION_ITEMS) {
    const checkAction = await query("SELECT id FROM action_items WHERE id = $1", [item.id]);
    if (checkAction.rows.length === 0) {
      await query(
        `INSERT INTO action_items (
          id, study_id, study_name, title, description, type,
          priority, target_audience, target_language, created_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.studyId,
          item.studyName,
          item.title,
          item.description,
          item.type,
          item.priority,
          item.targetAudience || null,
          item.targetLanguage || null,
          item.createdDate
        ]
      );
      actionsInserted++;
    }
  }
  const standardTemplates = [
    createCustomTemplateConfig(
      "BSPHO Paediatric Interventional v2.4 (Standard)",
      "BSPHO ICF Template v2.4 (2024)",
      {
        id: "tmpl-bspho-interventional-v24",
        excludeInsurance: false,
        excludeContraception: false,
        excludeBiobanking: false
      }
    ),
    createCustomTemplateConfig(
      "HIRUZ Observational (Insurance Excluded)",
      "HIRUZ Paediatric Observational Template",
      {
        id: "tmpl-hiruz-observational",
        excludeInsurance: true,
        excludeContraception: true,
        rationale: "Article 29 no-fault insurance waived per Belgian Law & FAMHP non-interventional guidance."
      }
    )
  ];
  for (const tmpl of standardTemplates) {
    const checkTmpl = await query("SELECT id FROM custom_templates WHERE id = $1", [tmpl.id]);
    if (checkTmpl.rows.length === 0) {
      await query(
        `INSERT INTO custom_templates (
          id, name, base_template, exclude_insurance, exclude_contraception,
          exclude_biobanking, sections, rationale, last_modified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [
          tmpl.id,
          tmpl.name,
          tmpl.baseTemplate,
          tmpl.excludeInsurance,
          tmpl.excludeContraception,
          tmpl.excludeBiobanking,
          JSON.stringify(tmpl.sections),
          tmpl.rationale,
          tmpl.lastModified || "2026-10-29"
        ]
      );
    }
  }
  console.log(`[Seeder Complete]
  - Studies inserted : ${studiesInserted} (${skippedCount} already existed)
  - Documents inserted: ${documentsInserted}
  - Facts inserted   : ${factsInserted}
  - Issues inserted  : ${issuesInserted}
  - Sites inserted   : ${sitesInserted}
  - Actions inserted : ${actionsInserted}
  - No duplicate records created.`);
  return {
    studiesInserted,
    documentsInserted,
    factsInserted,
    issuesInserted,
    sitesInserted,
    actionsInserted,
    skippedCount
  };
}
var invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
var thisFilePath = fileURLToPath(import.meta.url);
var isSeedCli = Boolean(invokedPath) && invokedPath === thisFilePath && /(^|[/\\])seed\.(ts|js|mjs|cjs)$/.test(invokedPath);
if (isSeedCli) {
  (async () => {
    try {
      const health = await checkDatabaseHealth();
      if (!health.ok) {
        console.error(`[DB Error] ${health.message}`);
        process.exit(1);
      }
      console.log(`[DB Connected] ${health.message}`);
      await runSeeder();
      process.exit(0);
    } catch (err) {
      console.error("[Seeder Failed]", err);
      process.exit(1);
    }
  })();
}

// src/db/studyRepository.ts
async function getAllStudies() {
  const studiesRes = await query("SELECT * FROM studies ORDER BY created_at DESC");
  const studies = [];
  for (const row of studiesRes.rows) {
    const studyId = row.id;
    const [sitesRes, factsRes, issuesRes, docsRes] = await Promise.all([
      query("SELECT * FROM study_sites WHERE study_id = $1", [studyId]),
      query("SELECT * FROM study_facts WHERE study_id = $1", [studyId]),
      query("SELECT * FROM consistency_issues WHERE study_id = $1", [studyId]),
      query("SELECT * FROM icf_documents WHERE study_id = $1 ORDER BY audience, language", [studyId])
    ]);
    const participatingSites = sitesRes.rows.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      country: s.country,
      localCoordinator: s.local_coordinator,
      ethicsCommitteeApprovalDate: s.ethics_committee_approval_date,
      insurancePolicyId: s.insurance_policy_id
    }));
    const facts = factsRes.rows.map((f) => ({
      id: f.id,
      studyId: f.study_id,
      key: f.key,
      label: f.label,
      value: f.value,
      conflictValue: f.conflict_value,
      sourceDoc: f.source_doc,
      sourcePage: f.source_page,
      confidence: Number(f.confidence),
      status: f.status,
      affectedAudiences: f.affected_audiences || []
    }));
    const issues = issuesRes.rows.map((i) => ({
      id: i.id,
      studyId: i.study_id,
      title: i.title,
      description: i.description,
      factKey: i.fact_key,
      severity: i.severity,
      issueType: i.issue_type || void 0,
      affectedDocs: i.affected_docs || [],
      sourceEvidence: i.source_evidence,
      discrepancyNote: i.discrepancy_note,
      status: i.status,
      resolution: i.resolution || void 0
    }));
    const documents = docsRes.rows.map((d) => ({
      id: d.id,
      studyId: d.study_id,
      audience: d.audience,
      language: d.language,
      title: d.title,
      version: d.version,
      status: d.status,
      issueCount: d.issue_count,
      wordCount: d.word_count,
      lastUpdated: d.last_updated,
      updatedBy: d.updated_by,
      templateVersion: d.template_version,
      blocks: d.blocks || []
    }));
    studies.push({
      id: row.id,
      code: row.code,
      title: row.title,
      shortTitle: row.short_title,
      sponsor: row.sponsor,
      studyType: row.study_type,
      phase: row.phase,
      responsiblePI: row.responsible_pi,
      leadSite: row.lead_site,
      assignedCoordinator: row.assigned_coordinator || row.responsible_pi || "Unassigned",
      currentWorkflowStage: row.current_workflow_stage,
      currentStepIndex: row.current_step_index,
      templateVersion: row.template_version,
      customTemplate: row.custom_template || void 0,
      targetAudiences: row.target_audiences || ["adult", "parent", "adolescent", "child"],
      targetLanguages: row.target_languages || ["EN", "NL", "FR"],
      readyDocumentsCount: row.ready_documents_count,
      totalDocumentsCount: row.total_documents_count,
      completionPercentage: row.completion_percentage,
      cloudBucket: row.cloud_bucket || void 0,
      bucketFiles: row.bucket_files || void 0,
      participatingSites,
      facts,
      issues,
      documents,
      createdDate: row.created_date,
      lastUpdated: row.last_updated
    });
  }
  return studies;
}
async function updateStudyWorkflow(studyId, stage, stepIndex) {
  await query(
    `UPDATE studies
     SET current_workflow_stage = $1, current_step_index = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [stage, stepIndex, studyId]
  );
}
async function updateStudyDocumentStatus(studyId, docId, newStatus) {
  await query(
    `UPDATE icf_documents
     SET status = $1, last_updated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND study_id = $3`,
    [newStatus, docId, studyId]
  );
  const countRes = await query(
    `SELECT COUNT(*) as ready_count FROM icf_documents
     WHERE study_id = $1 AND status IN ('approved', 'exported')`,
    [studyId]
  );
  const totalRes = await query(
    `SELECT COUNT(*) as total_count FROM icf_documents WHERE study_id = $1`,
    [studyId]
  );
  const ready = Number(countRes.rows[0]?.ready_count || 0);
  const total = Number(totalRes.rows[0]?.total_count || 12);
  const percentage = total > 0 ? Math.round(ready / total * 100) : 0;
  await query(
    `UPDATE studies
     SET ready_documents_count = $1, completion_percentage = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [ready, percentage, studyId]
  );
}
async function updateStudyCustomTemplate(studyId, customTemplate) {
  await query(
    `UPDATE studies
     SET custom_template = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [JSON.stringify(customTemplate), studyId]
  );
}

// src/services/geminiServer.ts
import { GoogleGenAI } from "@google/genai";
var DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
function getGeminiModel() {
  return (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
}
function getGeminiApiKey() {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "").trim();
  if (!key || key === "MY_GEMINI_API_KEY") return "";
  return key;
}
function isGeminiConfigured() {
  return getGeminiApiKey().length > 5;
}
async function simplifyForAudience(text, targetAudience, targetLanguage) {
  if (!isGeminiConfigured()) {
    return {
      simplifiedText: `[Fallback standard ${targetAudience} text]: ${text}`,
      source: "rule_fallback"
    };
  }
  try {
    const client = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const audienceGuidelines = {
      child: "Age 8-11: Short sentences, 3rd grade reading level, supportive tone, no scary jargon, explain why tests happen.",
      adolescent: "Age 12-17: Respectful, direct, 7th grade reading level, clear autonomy explanations and privacy information.",
      parent: "Clear medical communication, Belgian Law of 7 May 2004 compliance, exact procedure breakdown."
    }[targetAudience];
    const prompt = `You are an expert paediatric clinical trial communicator for the Belgian Society of Paediatric Haematology and Oncology (BSPHO).
Rewrite the following clinical trial text for a ${targetAudience} audience in ${targetLanguage}.
Audience guidelines: ${audienceGuidelines}

Original text:
${text}

Output only the revised text:`;
    const modelName = getGeminiModel();
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt
    });
    return {
      simplifiedText: response.text?.trim() || text,
      source: "gemini",
      modelUsed: modelName
    };
  } catch (error) {
    console.warn("[Gemini] API call failed, using rule fallback:", error);
    return {
      simplifiedText: text,
      source: "rule_fallback"
    };
  }
}

// server.ts
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 8080;
var HOST = "0.0.0.0";
app.use(express.json());
var inMemoryStudies = JSON.parse(JSON.stringify(INITIAL_STUDIES));
app.get("/_healthz", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/api/health", async (_req, res) => {
  if (!isDatabaseConfigured()) {
    return res.json({
      database: "in-memory-ready",
      status: "ready",
      message: "Running with seeded in-memory state."
    });
  }
  const health = await checkDatabaseHealth();
  res.json({
    database: "postgresql",
    status: health.ok ? "connected" : "error",
    message: health.message,
    version: health.version
  });
});
app.get("/api/studies", async (_req, res) => {
  try {
    if (isDatabaseConfigured()) {
      const health = await checkDatabaseHealth();
      if (health.ok) {
        const studies = await getAllStudies();
        if (studies.length > 0) {
          return res.json({ source: "database", count: studies.length, studies });
        }
        return res.json({
          source: "database",
          count: 0,
          studies: [],
          message: "Database connected but studies table is empty. POST /api/seed to load seed data."
        });
      }
      console.warn("[API /api/studies] DB health check failed:", health.message);
    }
  } catch (err) {
    console.warn("[API /api/studies] DB read failed, falling back to seeded memory:", err.message);
  }
  return res.json({ source: "mock_memory", count: inMemoryStudies.length, studies: inMemoryStudies });
});
app.get("/api/action-items", async (_req, res) => {
  try {
    if (isDatabaseConfigured()) {
      const health = await checkDatabaseHealth();
      if (health.ok) {
        const result = await query(
          `SELECT id, study_id, study_name, title, description, type, priority,
                  target_audience, target_language, created_date
           FROM action_items
           ORDER BY created_at DESC`
        );
        const items = result.rows.map((row) => ({
          id: row.id,
          studyId: row.study_id,
          studyName: row.study_name,
          title: row.title,
          description: row.description,
          type: row.type,
          priority: row.priority,
          targetAudience: row.target_audience || void 0,
          targetLanguage: row.target_language || void 0,
          createdDate: row.created_date
        }));
        return res.json({ source: "database", count: items.length, actionItems: items });
      }
    }
  } catch (err) {
    console.warn("[API /api/action-items] DB read failed:", err.message);
  }
  return res.json({
    source: "mock_memory",
    count: MOCK_ACTION_ITEMS.length,
    actionItems: MOCK_ACTION_ITEMS
  });
});
function isSeedAuthorized(req) {
  const secret = (process.env.SEED_SECRET || "").trim();
  if (!secret) return true;
  const header = String(req.get("x-seed-token") || "");
  const query2 = typeof req.query.token === "string" ? req.query.token : "";
  return header === secret || query2 === secret;
}
app.get("/api/gemini/status", (_req, res) => {
  res.json({
    configured: isGeminiConfigured(),
    model: getGeminiModel()
  });
});
app.post("/api/gemini/simplify", async (req, res) => {
  try {
    const { text, targetAudience, targetLanguage } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    const audience = targetAudience === "child" || targetAudience === "adolescent" || targetAudience === "parent" ? targetAudience : "parent";
    const language = targetLanguage === "NL" || targetLanguage === "FR" ? targetLanguage : "EN";
    const result = await simplifyForAudience(text, audience, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Gemini request failed" });
  }
});
app.post("/api/seed", async (req, res) => {
  try {
    if (!isSeedAuthorized(req)) {
      return res.status(401).json({
        error: "Unauthorized. Provide X-Seed-Token matching SEED_SECRET."
      });
    }
    if (!isDatabaseConfigured()) {
      return res.status(200).json({
        success: true,
        source: "in-memory",
        message: "In-memory data already active with 3 multicentric clinical trials."
      });
    }
    const result = await runSeeder();
    res.json({ success: true, source: "postgresql", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/studies/:id/workflow", async (req, res) => {
  const { id } = req.params;
  const { stage, stepIndex } = req.body;
  try {
    if (isDatabaseConfigured()) {
      await updateStudyWorkflow(id, stage, stepIndex);
    }
  } catch (err) {
    console.warn("[API Workflow] DB update error, saving in memory:", err.message);
  }
  inMemoryStudies = inMemoryStudies.map(
    (s) => s.id === id ? { ...s, currentWorkflowStage: stage, currentStepIndex: stepIndex } : s
  );
  res.json({ success: true, id, stage, stepIndex });
});
app.put("/api/studies/:studyId/documents/:docId/status", async (req, res) => {
  const { studyId, docId } = req.params;
  const { status } = req.body;
  try {
    if (isDatabaseConfigured()) {
      await updateStudyDocumentStatus(studyId, docId, status);
    }
  } catch (err) {
    console.warn("[API Doc Status] DB update error, saving in memory:", err.message);
  }
  inMemoryStudies = inMemoryStudies.map((s) => {
    if (s.id !== studyId) return s;
    const updatedDocs = s.documents.map((d) => d.id === docId ? { ...d, status } : d);
    const ready = updatedDocs.filter((d) => d.status === "approved" || d.status === "exported").length;
    return {
      ...s,
      documents: updatedDocs,
      readyDocumentsCount: ready,
      completionPercentage: Math.round(ready / updatedDocs.length * 100)
    };
  });
  res.json({ success: true, studyId, docId, status });
});
app.put("/api/studies/:studyId/template", async (req, res) => {
  const { studyId } = req.params;
  const { customTemplate } = req.body;
  try {
    if (isDatabaseConfigured()) {
      await updateStudyCustomTemplate(studyId, customTemplate);
    }
  } catch (err) {
    console.warn("[API Template] DB update error, saving in memory:", err.message);
  }
  inMemoryStudies = inMemoryStudies.map(
    (s) => s.id === studyId ? { ...s, customTemplate } : s
  );
  res.json({ success: true, studyId, customTemplate });
});
app.use(express.static(path2.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path2.join(__dirname, "dist", "index.html"));
});
app.listen(PORT, HOST, async () => {
  console.log(`[ConsentFlow] Production server listening on http://${HOST}:${PORT}`);
  if (isDatabaseConfigured()) {
    try {
      const health = await checkDatabaseHealth();
      if (health.ok) {
        console.log(`[ConsentFlow] PostgreSQL connection confirmed. Checking seeder status...`);
        await initSchema();
        console.log("[ConsentFlow] Running idempotent seeder to sync studies, sites, facts, sources\u2026");
        const seedResult = await runSeeder();
        console.log(
          `[ConsentFlow] Seed sync complete \u2014 studies+${seedResult.studiesInserted}, docs+${seedResult.documentsInserted}, facts+${seedResult.factsInserted}, sites+${seedResult.sitesInserted}, issues+${seedResult.issuesInserted}`
        );
      }
    } catch (err) {
      console.warn("[ConsentFlow] Initial DB check deferred:", err.message);
    }
  } else {
    console.log("[ConsentFlow] Operating with seeded state layer (3 multicentric clinical trials ready).");
  }
});
