-- ══════════════════════════════════════════════════════════════
-- Edemaskan — Timeweb Cloud PostgreSQL Init
-- Run once in Timeweb Database Console
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- Shared trigger function
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────
-- Table: scan_sessions
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_token TEXT NOT NULL UNIQUE,
  result_token  TEXT UNIQUE,

  entry_scenario TEXT NOT NULL CHECK (
    entry_scenario IN ('morning-face','eye-bags','face-oval','legs','rings')
  ),
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_content    TEXT,
  utm_term       TEXT,
  referer        TEXT,

  consent_pdn       BOOLEAN NOT NULL DEFAULT FALSE,
  consent_scan      BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,

  questionnaire JSONB,

  ai_result               JSONB,
  ai_model                TEXT,
  ai_call_started_at      TIMESTAMPTZ,
  ai_call_duration_ms     INTEGER,
  ai_input_tokens         INTEGER,
  ai_output_tokens        INTEGER,
  ai_cost_usd_microcents  INTEGER,
  primary_cause_key       TEXT,
  red_flag                BOOLEAN NOT NULL DEFAULT FALSE,
  red_flag_reason         TEXT,

  name               TEXT,
  email              TEXT,
  email_submitted_at TIMESTAMPTZ,

  special_price_expires_at TIMESTAMPTZ,

  getcourse_status TEXT NOT NULL DEFAULT 'not_required' CHECK (
    getcourse_status IN ('not_required','pending','synced','failed')
  ),
  getcourse_lead_id   TEXT,
  getcourse_synced_at TIMESTAMPTZ,

  ip_address INET,
  user_agent TEXT,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  funnel_stage TEXT NOT NULL DEFAULT 'started' CHECK (
    funnel_stage IN ('started','photos_uploaded','questionnaire_done','ai_analyzed','email_submitted','red_flagged')
  )
);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_created_at        ON scan_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_entry_scenario    ON scan_sessions (entry_scenario);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_funnel_stage      ON scan_sessions (funnel_stage);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_primary_cause_key ON scan_sessions (primary_cause_key) WHERE primary_cause_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scan_sessions_email             ON scan_sessions (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scan_sessions_getcourse_status  ON scan_sessions (getcourse_status) WHERE getcourse_status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS idx_scan_sessions_red_flag          ON scan_sessions (red_flag) WHERE red_flag = TRUE;

CREATE OR REPLACE TRIGGER trg_scan_sessions_updated_at
  BEFORE UPDATE ON scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- Table: ai_errors
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_errors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES scan_sessions(id) ON DELETE CASCADE,
  attempt    INTEGER NOT NULL DEFAULT 1,
  error_code TEXT NOT NULL CHECK (error_code IN (
    'OPENROUTER_TIMEOUT','OPENROUTER_5XX','OPENROUTER_4XX',
    'OPENROUTER_INVALID_JSON','ZOD_VALIDATION_FAILED','UNKNOWN'
  )),
  error_message TEXT,
  raw_response  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_errors_session_id ON ai_errors (session_id);
CREATE INDEX IF NOT EXISTS idx_ai_errors_created_at ON ai_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_errors_error_code ON ai_errors (error_code);

-- ──────────────────────────────────────────────────────────────
-- Table: getcourse_sync_queue
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS getcourse_sync_queue (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','in_progress','synced','failed_temporary','failed_permanent')
  ),

  attempts          INTEGER NOT NULL DEFAULT 0,
  max_attempts      INTEGER NOT NULL DEFAULT 5,
  next_retry_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  payload           JSONB NOT NULL,

  last_error        TEXT,
  last_attempted_at TIMESTAMPTZ,
  synced_at         TIMESTAMPTZ,
  getcourse_lead_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_getcourse_queue_status_next_retry
  ON getcourse_sync_queue (status, next_retry_at)
  WHERE status IN ('pending','failed_temporary');

CREATE INDEX IF NOT EXISTS idx_getcourse_queue_session_id
  ON getcourse_sync_queue (session_id);

CREATE OR REPLACE TRIGGER trg_getcourse_queue_updated_at
  BEFORE UPDATE ON getcourse_sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- Table: rate_limit_buckets
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key    TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start
  ON rate_limit_buckets (window_start);

CREATE OR REPLACE TRIGGER trg_rate_limit_updated_at
  BEFORE UPDATE ON rate_limit_buckets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
