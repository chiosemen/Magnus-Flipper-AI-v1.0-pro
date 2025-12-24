-- =============================================================================
-- MAGNUS OPERATOR AGENT TABLES
-- Telemetry, Control, RAG Knowledge Base, and Change Requests
-- Migration Date: 2026-01-08
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- 1. SCRAPE ANOMALIES TABLE
-- Extends Phase 1 console logging to persistent storage
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scrape_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  type text NOT NULL CHECK (type IN ('ZERO_RESULTS','PARSING_NOISE','BOT_BLOCK','TIMEOUT','ERROR_SPIKE','SOURCE_DEGRADED')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),

  marketplace text NOT NULL,
  source text NOT NULL CHECK (source IN ('apify','diy')),
  query text,

  duration_ms int,
  error_count int DEFAULT 0,

  run_id text NULL, -- References scrape_runs(id) - note: existing table uses TEXT id
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for scrape_anomalies
CREATE INDEX IF NOT EXISTS idx_scrape_anomalies_recent 
  ON public.scrape_anomalies (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_anomalies_marketplace 
  ON public.scrape_anomalies (marketplace, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_anomalies_type 
  ON public.scrape_anomalies (type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_anomalies_severity 
  ON public.scrape_anomalies (severity, created_at DESC);

-- =============================================================================
-- 2. RESOLVER DECISIONS TABLE
-- Tracks "why source X won" for explainability
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.resolver_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  run_id text NULL, -- References scrape_runs(id) - note: existing table uses TEXT id
  marketplace text NOT NULL,
  query text,

  apify_items int NOT NULL DEFAULT 0,
  diy_items int NOT NULL DEFAULT 0,

  chosen_source text NOT NULL CHECK (chosen_source IN ('apify','diy','none')),
  reason text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for resolver_decisions
CREATE INDEX IF NOT EXISTS idx_resolver_decisions_recent 
  ON public.resolver_decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolver_decisions_marketplace 
  ON public.resolver_decisions (marketplace, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolver_decisions_run_id 
  ON public.resolver_decisions (run_id) WHERE run_id IS NOT NULL;

-- =============================================================================
-- 3. MARKETPLACE CONTROL TABLE
-- Operator-managed configuration (no code changes needed)
-- Note: marketplace_controls already exists from 20260007, but this extends it
-- =============================================================================
-- Check if marketplace_control (singular) exists, if not create it
-- The existing table is marketplace_controls (plural), so we'll create marketplace_control
CREATE TABLE IF NOT EXISTS public.marketplace_control (
  marketplace text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,

  prefer_source text NOT NULL DEFAULT 'apify' CHECK (prefer_source IN ('apify','diy')),
  apify_enabled boolean NOT NULL DEFAULT true,
  diy_enabled boolean NOT NULL DEFAULT true,

  max_items int NOT NULL DEFAULT 50,
  budget_cents int NOT NULL DEFAULT 0,

  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NULL,
  notes text NULL
);

-- Index for marketplace_control
CREATE INDEX IF NOT EXISTS idx_marketplace_control_marketplace 
  ON public.marketplace_control (marketplace);

-- =============================================================================
-- 4. OPERATOR CHANGE REQUESTS TABLE
-- Proposals only (human approval required)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.operator_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','applied')),
  requested_by text NOT NULL DEFAULT 'operator-agent',
  approved_by text NULL,
  approved_at timestamptz NULL,

  marketplace text NULL,
  change_type text NOT NULL CHECK (change_type IN ('toggle_marketplace','toggle_source','adjust_budget','adjust_limits','note_only')),
  change_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  rationale text NOT NULL,
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high')),
  rollback_payload jsonb NULL,
  
  -- Enhanced change request quality fields
  hypothesis text NOT NULL,
  expected_effect text NOT NULL,
  validation_metric text NOT NULL,
  rollback_plan text NOT NULL
);

-- Indexes for operator_change_requests
CREATE INDEX IF NOT EXISTS idx_change_requests_recent 
  ON public.operator_change_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_requests_status 
  ON public.operator_change_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_requests_marketplace 
  ON public.operator_change_requests (marketplace) WHERE marketplace IS NOT NULL;

-- =============================================================================
-- 5. OPERATOR KB DOCUMENTS TABLE
-- Source documents (runbooks, phase reports)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.operator_kb_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  title text NOT NULL,
  source text NOT NULL, -- e.g. repo:/docs/runbooks/..., repo:/PHASE_1_IMPLEMENTATION_SUMMARY.md
  version text NULL,
  tags text[] NOT NULL DEFAULT '{}',

  content text NOT NULL,
  confidence_level text NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('low','medium','high')),
  supersedes uuid REFERENCES public.operator_kb_documents(id) NULL
);

-- Indexes for operator_kb_documents
CREATE INDEX IF NOT EXISTS idx_kb_documents_source 
  ON public.operator_kb_documents (source);
CREATE INDEX IF NOT EXISTS idx_kb_documents_tags 
  ON public.operator_kb_documents USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_kb_documents_created_at 
  ON public.operator_kb_documents (created_at DESC);

-- =============================================================================
-- 6. OPERATOR KB CHUNKS TABLE
-- Embeddings for semantic search (pgvector)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.operator_kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.operator_kb_documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,

  -- vector(1536) for OpenAI text-embedding-3-small
  embedding vector(1536),

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for operator_kb_chunks
CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc 
  ON public.operator_kb_chunks (document_id, chunk_index);

-- Vector similarity search index (ivfflat for approximate nearest neighbor)
-- Note: This requires the vector extension (enabled above)
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding 
  ON public.operator_kb_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- =============================================================================
-- 7. HELPER FUNCTION: is_admin()
-- Checks if current user is admin via profiles table
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() 
      AND is_admin = true 
      AND role = 'admin'
  );
$$;

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.scrape_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolver_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_kb_chunks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies for scrape_anomalies
-- Admin read, service role write (workers/operator agent)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'scrape_anomalies'
      AND policyname = 'Admin read anomalies'
  ) THEN
    CREATE POLICY "Admin read anomalies"
      ON public.scrape_anomalies
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'scrape_anomalies'
      AND policyname = 'No client writes anomalies'
  ) THEN
    CREATE POLICY "No client writes anomalies"
      ON public.scrape_anomalies
      FOR INSERT
      TO authenticated
      WITH CHECK (false);
  END IF;
END
$$;

-- =============================================================================
-- RLS Policies for resolver_decisions
-- Admin read, service role write
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resolver_decisions'
      AND policyname = 'Admin read decisions'
  ) THEN
    CREATE POLICY "Admin read decisions"
      ON public.resolver_decisions
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resolver_decisions'
      AND policyname = 'No client writes decisions'
  ) THEN
    CREATE POLICY "No client writes decisions"
      ON public.resolver_decisions
      FOR INSERT
      TO authenticated
      WITH CHECK (false);
  END IF;
END
$$;

-- =============================================================================
-- RLS Policies for marketplace_control
-- Admin read/write, service role full access
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketplace_control'
      AND policyname = 'Admin read marketplace_control'
  ) THEN
    CREATE POLICY "Admin read marketplace_control"
      ON public.marketplace_control
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketplace_control'
      AND policyname = 'Admin update marketplace_control'
  ) THEN
    CREATE POLICY "Admin update marketplace_control"
      ON public.marketplace_control
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END
$$;

-- =============================================================================
-- RLS Policies for operator_change_requests
-- Admin read/approve, service role proposes
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_change_requests'
      AND policyname = 'Admin read changes'
  ) THEN
    CREATE POLICY "Admin read changes"
      ON public.operator_change_requests
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_change_requests'
      AND policyname = 'Admin approve changes'
  ) THEN
    CREATE POLICY "Admin approve changes"
      ON public.operator_change_requests
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_change_requests'
      AND policyname = 'No client inserts changes'
  ) THEN
    CREATE POLICY "No client inserts changes"
      ON public.operator_change_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (false);
  END IF;
END
$$;

-- =============================================================================
-- RLS Policies for operator_kb_documents
-- Admin read, service role write
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_kb_documents'
      AND policyname = 'Admin read kb documents'
  ) THEN
    CREATE POLICY "Admin read kb documents"
      ON public.operator_kb_documents
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_kb_documents'
      AND policyname = 'No client writes kb documents'
  ) THEN
    CREATE POLICY "No client writes kb documents"
      ON public.operator_kb_documents
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END
$$;

-- =============================================================================
-- RLS Policies for operator_kb_chunks
-- Admin read, service role write
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_kb_chunks'
      AND policyname = 'Admin read kb chunks'
  ) THEN
    CREATE POLICY "Admin read kb chunks"
      ON public.operator_kb_chunks
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_kb_chunks'
      AND policyname = 'No client writes kb chunks'
  ) THEN
    CREATE POLICY "No client writes kb chunks"
      ON public.operator_kb_chunks
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END
$$;

-- =============================================================================
-- 9. VECTOR SEARCH FUNCTION
-- RPC function for semantic search over KB chunks
-- =============================================================================
CREATE OR REPLACE FUNCTION public.search_kb_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_chunks.id,
    kb_chunks.document_id,
    kb_chunks.chunk_index,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) AS similarity,
    kb_chunks.metadata
  FROM public.operator_kb_chunks kb_chunks
  WHERE 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- 10. COMMENTS
-- =============================================================================
COMMENT ON TABLE public.scrape_anomalies IS 'Stores scraping anomalies detected by Phase 1 pooling system';
COMMENT ON TABLE public.resolver_decisions IS 'Tracks resolver decisions (why source X won) for explainability';
COMMENT ON TABLE public.marketplace_control IS 'Operator-managed marketplace configuration (enable/disable, source preferences)';
COMMENT ON TABLE public.operator_change_requests IS 'Operator agent change proposals (requires human approval)';
COMMENT ON TABLE public.operator_kb_documents IS 'Knowledge base documents (runbooks, phase reports)';
COMMENT ON TABLE public.operator_kb_chunks IS 'Chunked knowledge base content with embeddings for semantic search';

COMMENT ON FUNCTION public.is_admin() IS 'Checks if current authenticated user is admin via profiles table';
COMMENT ON FUNCTION public.search_kb_chunks(vector, int, float) IS 'Semantic search over knowledge base chunks using vector similarity';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Magnus Operator Agent tables created';
  RAISE NOTICE '✅ RLS policies enabled (admin-only access)';
  RAISE NOTICE '✅ Vector search function ready';
  RAISE NOTICE '📊 Ready for Operator Agent implementation';
END $$;

