/*
  # Fix security issues

  1. increment_coupon_uses — fix mutable search_path, revoke public execute
  2. email_log — drop always-true INSERT policy (service_role bypasses RLS)
  3. trademark_idea_sessions — replace always-true INSERT with non-null token check
*/

-- ─── 1. Fix increment_coupon_uses ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_coupon_uses(coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.coupons
  SET uses_count = uses_count + 1
  WHERE id = coupon_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(uuid) FROM authenticated;

-- ─── 2. Fix email_log INSERT policy ──────────────────────────────────────────

DROP POLICY IF EXISTS "System can insert email logs" ON public.email_log;

-- ─── 3. Fix trademark_idea_sessions INSERT policy ────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert a session" ON public.trademark_idea_sessions;

CREATE POLICY "Anyone can insert session with token"
  ON public.trademark_idea_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_token IS NOT NULL);
