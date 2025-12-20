-- =====================================================
-- RLS policies for growth features tables
--
-- Goals:
-- - Keep deals pooled + read-only to clients (handled elsewhere)
-- - Lock user-owned settings/blocks/tickets to the authenticated owner
-- - Keep templates publicly readable, writeable only via service_role
-- - Keep alert events/deliveries readable by owner, writeable only via service_role
-- =====================================================

DO $$
BEGIN
  -- user_notification_settings
  IF to_regclass('public.user_notification_settings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Notification settings: read own" ON public.user_notification_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Notification settings: insert own" ON public.user_notification_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Notification settings: update own" ON public.user_notification_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Notification settings: delete own" ON public.user_notification_settings';

    EXECUTE $q$
      CREATE POLICY "Notification settings: read own"
      ON public.user_notification_settings
      FOR SELECT
      USING (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Notification settings: insert own"
      ON public.user_notification_settings
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Notification settings: update own"
      ON public.user_notification_settings
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Notification settings: delete own"
      ON public.user_notification_settings
      FOR DELETE
      USING (auth.uid() = user_id)
    $q$;
  END IF;

  -- alert_events
  IF to_regclass('public.alert_events') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Alert events: read own" ON public.alert_events';
    EXECUTE 'DROP POLICY IF EXISTS "Alert events: block client writes" ON public.alert_events';

    EXECUTE $q$
      CREATE POLICY "Alert events: read own"
      ON public.alert_events
      FOR SELECT
      USING (auth.uid() = user_id)
    $q$;

    -- Block all client writes; service_role bypasses RLS.
    EXECUTE $q$
      CREATE POLICY "Alert events: block client writes"
      ON public.alert_events
      FOR ALL
      USING (false)
      WITH CHECK (false)
    $q$;
  END IF;

  -- alert_deliveries
  IF to_regclass('public.alert_deliveries') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.alert_deliveries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Alert deliveries: read own" ON public.alert_deliveries';
    EXECUTE 'DROP POLICY IF EXISTS "Alert deliveries: block client writes" ON public.alert_deliveries';

    EXECUTE $q$
      CREATE POLICY "Alert deliveries: read own"
      ON public.alert_deliveries
      FOR SELECT
      USING (auth.uid() = user_id)
    $q$;

    -- Block all client writes; service_role bypasses RLS.
    EXECUTE $q$
      CREATE POLICY "Alert deliveries: block client writes"
      ON public.alert_deliveries
      FOR ALL
      USING (false)
      WITH CHECK (false)
    $q$;
  END IF;

  -- search_templates (public read-only)
  IF to_regclass('public.search_templates') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.search_templates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Search templates: public read" ON public.search_templates';
    EXECUTE 'DROP POLICY IF EXISTS "Search templates: block client writes" ON public.search_templates';

    EXECUTE $q$
      CREATE POLICY "Search templates: public read"
      ON public.search_templates
      FOR SELECT
      USING (true)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Search templates: block client writes"
      ON public.search_templates
      FOR ALL
      USING (false)
      WITH CHECK (false)
    $q$;
  END IF;

  -- template_installs (owner insert/read)
  IF to_regclass('public.template_installs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.template_installs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Template installs: read own" ON public.template_installs';
    EXECUTE 'DROP POLICY IF EXISTS "Template installs: insert own" ON public.template_installs';
    EXECUTE 'DROP POLICY IF EXISTS "Template installs: block other writes" ON public.template_installs';
    EXECUTE 'DROP POLICY IF EXISTS "Template installs: block other deletes" ON public.template_installs';

    EXECUTE $q$
      CREATE POLICY "Template installs: read own"
      ON public.template_installs
      FOR SELECT
      USING (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Template installs: insert own"
      ON public.template_installs
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $q$;

    -- Block UPDATE/DELETE from clients.
    EXECUTE $q$
      CREATE POLICY "Template installs: block other writes"
      ON public.template_installs
      FOR UPDATE
      USING (false)
      WITH CHECK (false)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Template installs: block other deletes"
      ON public.template_installs
      FOR DELETE
      USING (false)
    $q$;
  END IF;

  -- user_blocks (owner-only CRUD)
  IF to_regclass('public.user_blocks') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "User blocks: read own" ON public.user_blocks';
    EXECUTE 'DROP POLICY IF EXISTS "User blocks: insert own" ON public.user_blocks';
    EXECUTE 'DROP POLICY IF EXISTS "User blocks: update own" ON public.user_blocks';
    EXECUTE 'DROP POLICY IF EXISTS "User blocks: delete own" ON public.user_blocks';

    EXECUTE $q$
      CREATE POLICY "User blocks: read own"
      ON public.user_blocks
      FOR SELECT
      USING (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "User blocks: insert own"
      ON public.user_blocks
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "User blocks: update own"
      ON public.user_blocks
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "User blocks: delete own"
      ON public.user_blocks
      FOR DELETE
      USING (auth.uid() = user_id)
    $q$;
  END IF;

  -- support_tickets (owner insert/read, no updates/deletes by clients)
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Support tickets: read own" ON public.support_tickets';
    EXECUTE 'DROP POLICY IF EXISTS "Support tickets: insert own" ON public.support_tickets';
    EXECUTE 'DROP POLICY IF EXISTS "Support tickets: block client writes" ON public.support_tickets';
    EXECUTE 'DROP POLICY IF EXISTS "Support tickets: block client deletes" ON public.support_tickets';

    EXECUTE $q$
      CREATE POLICY "Support tickets: read own"
      ON public.support_tickets
      FOR SELECT
      USING (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Support tickets: insert own"
      ON public.support_tickets
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Support tickets: block client writes"
      ON public.support_tickets
      FOR UPDATE
      USING (false)
      WITH CHECK (false)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Support tickets: block client deletes"
      ON public.support_tickets
      FOR DELETE
      USING (false)
    $q$;
  END IF;
END $$;
