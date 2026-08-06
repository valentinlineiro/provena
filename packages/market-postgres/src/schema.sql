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
    active BOOLEAN NOT NULL DEFAULT TRUE,
    raw_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_source_external_id UNIQUE (source_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_postings_opportunity_id ON opportunity_postings(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_postings_active ON opportunity_postings(active);

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
