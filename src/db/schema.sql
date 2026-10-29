-- ==============================================================================
-- ConsentFlow — BSPHO ICF Workbench
-- PostgreSQL Schema for Paediatric Clinical Trials & ICF Matrix
-- Designed for PostgreSQL 16 & Google Cloud SQL for PostgreSQL
-- ==============================================================================

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
