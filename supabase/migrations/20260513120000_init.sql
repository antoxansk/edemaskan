-- ══════════════════════════════════════════════════════════════
-- Edemaskan — Initial Migration
-- SPEC.md §2.2–2.7
-- ══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- Shared functions
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_url_token(length INTEGER DEFAULT 24)
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  result TEXT := '';
  i      INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, 1 + floor(random() * char_length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────
-- Table: methodologist_users  (SPEC §2.7)
-- Must exist before scan_sessions references it in RLS
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.methodologist_users (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  added_by   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.methodologist_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY methodologist_users_self_select
  ON public.methodologist_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- Table: scan_sessions  (SPEC §2.3)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Access tokens
  session_token TEXT NOT NULL UNIQUE,
  result_token  TEXT UNIQUE,

  -- Entry scenario & attribution
  entry_scenario TEXT NOT NULL CHECK (
    entry_scenario IN ('morning-face','eye-bags','face-oval','legs','rings')
  ),
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_content    TEXT,
  utm_term       TEXT,
  referer        TEXT,

  -- Legal consents
  consent_pdn       BOOLEAN NOT NULL DEFAULT FALSE,
  consent_scan      BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,

  -- Questionnaire answers (JSONB)
  questionnaire JSONB,

  -- AI result
  ai_result            JSONB,
  ai_model             TEXT,
  ai_call_started_at   TIMESTAMPTZ,
  ai_call_duration_ms  INTEGER,
  ai_input_tokens      INTEGER,
  ai_output_tokens     INTEGER,
  ai_cost_usd_microcents INTEGER,
  primary_cause_key    TEXT,
  red_flag             BOOLEAN NOT NULL DEFAULT FALSE,
  red_flag_reason      TEXT,

  -- Email gate
  name               TEXT,
  email              TEXT,
  email_submitted_at TIMESTAMPTZ,

  -- 48h timer
  special_price_expires_at TIMESTAMPTZ,

  -- GetCourse sync status
  getcourse_status TEXT NOT NULL DEFAULT 'not_required' CHECK (
    getcourse_status IN ('not_required','pending','synced','failed')
  ),
  getcourse_lead_id   TEXT,
  getcourse_synced_at TIMESTAMPTZ,

  -- Technical
  ip_address INET,
  user_agent TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Funnel stage (denormalised for analytics)
  funnel_stage TEXT NOT NULL DEFAULT 'started' CHECK (
    funnel_stage IN ('started','photos_uploaded','questionnaire_done','ai_analyzed','email_submitted','red_flagged')
  )
);

-- Indexes
CREATE INDEX idx_scan_sessions_created_at        ON public.scan_sessions (created_at DESC);
CREATE INDEX idx_scan_sessions_entry_scenario    ON public.scan_sessions (entry_scenario);
CREATE INDEX idx_scan_sessions_funnel_stage      ON public.scan_sessions (funnel_stage);
CREATE INDEX idx_scan_sessions_primary_cause_key ON public.scan_sessions (primary_cause_key)
  WHERE primary_cause_key IS NOT NULL;
CREATE INDEX idx_scan_sessions_email             ON public.scan_sessions (lower(email))
  WHERE email IS NOT NULL;
CREATE INDEX idx_scan_sessions_getcourse_status  ON public.scan_sessions (getcourse_status)
  WHERE getcourse_status IN ('pending','failed');
CREATE INDEX idx_scan_sessions_red_flag          ON public.scan_sessions (red_flag)
  WHERE red_flag = TRUE;

-- updated_at trigger
CREATE TRIGGER trg_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY scan_sessions_methodologist_select
  ON public.scan_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.methodologist_users mu
      WHERE mu.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Table: ai_errors  (SPEC §2.4)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.ai_errors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  attempt    INTEGER NOT NULL DEFAULT 1,
  error_code TEXT NOT NULL CHECK (error_code IN (
    'OPENROUTER_TIMEOUT','OPENROUTER_5XX','OPENROUTER_4XX',
    'OPENROUTER_INVALID_JSON','ZOD_VALIDATION_FAILED','UNKNOWN'
  )),
  error_message TEXT,
  raw_response  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_errors_session_id ON public.ai_errors (session_id);
CREATE INDEX idx_ai_errors_created_at ON public.ai_errors (created_at DESC);
CREATE INDEX idx_ai_errors_error_code ON public.ai_errors (error_code);

ALTER TABLE public.ai_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_errors_methodologist_select
  ON public.ai_errors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.methodologist_users mu
      WHERE mu.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Table: getcourse_sync_queue  (SPEC §2.5)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.getcourse_sync_queue (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,

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

CREATE INDEX idx_getcourse_queue_status_next_retry
  ON public.getcourse_sync_queue (status, next_retry_at)
  WHERE status IN ('pending','failed_temporary');

CREATE INDEX idx_getcourse_queue_session_id
  ON public.getcourse_sync_queue (session_id);

CREATE TRIGGER trg_getcourse_queue_updated_at
  BEFORE UPDATE ON public.getcourse_sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.getcourse_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY getcourse_queue_methodologist_select
  ON public.getcourse_sync_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.methodologist_users mu
      WHERE mu.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Table: rate_limit_buckets  (SPEC §2.6)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.rate_limit_buckets (
  bucket_key    TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_window_start
  ON public.rate_limit_buckets (window_start);

CREATE TRIGGER trg_rate_limit_updated_at
  BEFORE UPDATE ON public.rate_limit_buckets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role accesses this table
