-- XPGAMPP PostgreSQL 17.4 Default Seed Schema (pg_analytics)
CREATE TABLE IF NOT EXISTS service_telemetry (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(64) NOT NULL,
  engine_version VARCHAR(32) NOT NULL,
  avg_latency_ms NUMERIC(8,2) NOT NULL,
  Memory_mb INTEGER NOT NULL,
  active_connections INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_audit_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(128) NOT NULL,
  http_method VARCHAR(12) NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms NUMERIC(8,2) NOT NULL,
  client_ip VARCHAR(45) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pg_extensions_registry (
  id SERIAL PRIMARY KEY,
  extname VARCHAR(64) NOT NULL UNIQUE,
  extversion VARCHAR(24) NOT NULL,
  installed BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL
);
