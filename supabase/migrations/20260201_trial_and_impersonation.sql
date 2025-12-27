-- ============================================================================
-- Migration: Trial access + admin impersonation
-- Date: 2026-02-01
-- Purpose: Add trial tracking to profiles and auditable admin impersonation
-- ============================================================================

-- ============================================================================
-- PROFILES: Trial tracking columns
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_trial_expired boolean NOT NULL DEFAULT false;

-- Default new users to trial unless explicitly upgraded/admin
ALTER TABLE public.profiles
  ALTER COLUMN plan SET DEFAULT 'trial';

-- Expand plan constraint to include trial/admin/paid without removing existing tiers
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'agency', 'elite', 'trial', 'paid', 'admin'));

-- Backfill legacy plans to trial (safe default)
UPDATE public.profiles
SET plan = 'trial'
WHERE plan IS NULL OR plan = 'free';

-- Backfill trial windows for existing trial users
UPDATE public.profiles
SET
  trial_started_at = COALESCE(trial_started_at, now()),
  trial_expires_at = COALESCE(trial_expires_at, now() + interval '7 days')
WHERE plan = 'trial';

-- ============================================================================
-- PROFILES: Update auto-create profile trigger defaults
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      role,
      is_admin,
      onboarding_completed,
      plan,
      full_name,
      trial_started_at,
      trial_expires_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'user',
        false,
        false,
        'trial',
        NEW.raw_user_meta_data->>'full_name',
        now(),
        now() + interval '7 days'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

    RETURN NEW;
END;
$$;

-- ============================================================================
-- ADMIN IMPERSONATION SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS impersonation_sessions_admin_idx
  ON public.impersonation_sessions(admin_user_id);

CREATE INDEX IF NOT EXISTS impersonation_sessions_target_idx
  ON public.impersonation_sessions(target_user_id);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can read/insert/update impersonation sessions
CREATE POLICY "Admins can view impersonation sessions"
  ON public.impersonation_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert impersonation sessions"
  ON public.impersonation_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update impersonation sessions"
  ON public.impersonation_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.impersonation_sessions TO authenticated;

-- ============================================================================
-- ROLLBACK PLAN
-- ============================================================================
-- 1) DROP TABLE public.impersonation_sessions;
-- 2) ALTER TABLE public.profiles DROP COLUMN trial_started_at;
-- 3) ALTER TABLE public.profiles DROP COLUMN trial_expires_at;
-- 4) ALTER TABLE public.profiles DROP COLUMN is_trial_expired;
-- 5) ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';
-- 6) Restore prior profiles_plan_check constraint as needed.
