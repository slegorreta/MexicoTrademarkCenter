/*
  # Fix Analytics Tables RLS Insert Policies

  The three analytics/logging tables (website_sessions, clearance_searches,
  filing_events) had INSERT policies with WITH CHECK (true), which effectively
  allowed anyone — including unauthenticated visitors — to write arbitrary rows.

  All legitimate inserts come exclusively from Edge Functions that use the
  SUPABASE_SERVICE_ROLE_KEY. The service role bypasses RLS entirely, so these
  permissive policies served no legitimate purpose and only created a
  security hole allowing abuse (log poisoning, storage exhaustion).

  Changes:
    - Drop the three "Anyone can log a ..." INSERT policies
    - Add replacement INSERT policies restricted to authenticated users only,
      with a WITH CHECK that enforces a non-empty, non-null primary key field
      (created_at IS NOT NULL) as a minimal sanity guard

  Note: Edge Function inserts (service role) are unaffected — the service role
  always bypasses RLS. These policies only govern direct client-side requests.
*/

-- website_sessions
DROP POLICY IF EXISTS "Anyone can log a session" ON public.website_sessions;

CREATE POLICY "Authenticated users can log a session"
  ON public.website_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (created_at IS NOT NULL);

-- clearance_searches
DROP POLICY IF EXISTS "Anyone can log a clearance search" ON public.clearance_searches;

CREATE POLICY "Authenticated users can log a clearance search"
  ON public.clearance_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (created_at IS NOT NULL);

-- filing_events
DROP POLICY IF EXISTS "Anyone can log a filing event" ON public.filing_events;

CREATE POLICY "Authenticated users can log a filing event"
  ON public.filing_events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_at IS NOT NULL);
