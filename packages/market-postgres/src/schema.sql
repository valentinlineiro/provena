-- O2.4: Market Catalog PostgreSQL Schema

CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_domain TEXT,
    title TEXT NOT NULL,
    normalized_title TEXT NOT NULL,
    role_family TEXT,
    role_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_role_family ON opportunities(role_family);
CREATE INDEX IF NOT EXISTS idx_opportunities_role_level ON opportunities(role_level);
CREATE INDEX IF NOT EXISTS idx_opportunities_normalized_title ON opportunities(normalized_title);

CREATE TABLE IF NOT EXISTS opportunity_postings (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    external_id TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT,
    published_at TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    consecutive_absent_runs INT NOT NULL DEFAULT 0,
    raw_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_source_external_id UNIQUE (source_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_postings_opportunity_id ON opportunity_postings(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_postings_status_seen ON opportunity_postings(status, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS opportunity_posting_history (
    id BIGSERIAL PRIMARY KEY,
    posting_id TEXT NOT NULL REFERENCES opportunity_postings(id) ON DELETE CASCADE,
    ingestion_run_id TEXT NOT NULL,
    seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunity_assessments (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL DEFAULT 'valentin',
    profile_version TEXT NOT NULL DEFAULT '1.0.0',
    protocol_version INT NOT NULL DEFAULT 1,
    market_knowledge_version INT NOT NULL DEFAULT 0,
    recommendation TEXT NOT NULL,
    decision_tier SMALLINT NOT NULL,
    professional_fit REAL NOT NULL,
    personal_fit REAL NOT NULL,
    confidence REAL NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (
        opportunity_id,
        profile_id,
        profile_version,
        protocol_version,
        market_knowledge_version
    )
);

CREATE TABLE IF NOT EXISTS assessment_evidences (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id TEXT NOT NULL,
    profile_id TEXT NOT NULL DEFAULT 'valentin',
    capability_id TEXT NOT NULL,
    weight REAL NOT NULL,
    matched_text TEXT NOT NULL,
    source_taxon TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW current_opportunity_assessments AS
SELECT DISTINCT ON (opportunity_id, profile_id)
    opportunity_id,
    profile_id,
    profile_version,
    protocol_version,
    market_knowledge_version,
    recommendation,
    decision_tier,
    professional_fit,
    personal_fit,
    confidence,
    evaluated_at
FROM opportunity_assessments
ORDER BY opportunity_id, profile_id, evaluated_at DESC;

CREATE TABLE IF NOT EXISTS user_opportunity_decisions (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'valentin',
    user_decision TEXT NOT NULL DEFAULT 'new',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, user_id)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    fetched_count INT NOT NULL,
    added_count INT NOT NULL,
    updated_count INT NOT NULL,
    deactivated_count INT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_models (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    market_knowledge_version TEXT NOT NULL,
    recognition_order INT NOT NULL,
    market_model_json JSONB NOT NULL,
    recognition_coverage DOUBLE PRECISION NOT NULL,
    recognized_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, market_knowledge_version)
);

CREATE INDEX IF NOT EXISTS idx_market_models_current ON market_models(opportunity_id, recognition_order DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_keyset ON opportunity_assessments(decision_tier DESC, professional_fit DESC, confidence DESC, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_decisions_tab ON user_opportunity_decisions(user_id, user_decision);

CREATE TABLE IF NOT EXISTS observation_sources (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL DEFAULT 'valentin',
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Watching',
    jobs_observed INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_observation_sources_profile ON observation_sources(profile_id);
