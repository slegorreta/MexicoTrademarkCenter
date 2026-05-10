/*
  # Fix RLS policies on clearance_report_orders

  ## Problem
  The INSERT policies for both anon and authenticated roles used `WITH CHECK (true)`,
  which allows unrestricted inserts — effectively bypassing RLS.

  ## Solution
  All writes to this table are performed exclusively by edge functions using the
  service_role key (which bypasses RLS by design). There is no legitimate use case
  for direct client-side inserts, so both permissive INSERT policies are dropped.

  This leaves the table locked down: only service_role can write, and no direct
  client inserts are possible.
*/

DROP POLICY IF EXISTS "Anon can insert report orders" ON public.clearance_report_orders;
DROP POLICY IF EXISTS "Authenticated can insert report orders" ON public.clearance_report_orders;
