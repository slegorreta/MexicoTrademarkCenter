/*
  # Fix: Remove SECURITY DEFINER from admin_revenue_summary view

  The view was implicitly created with SECURITY DEFINER, meaning it runs with
  the privileges of the view owner rather than the calling user, bypassing RLS.

  This migration recreates it as SECURITY INVOKER so the caller's permissions
  and RLS policies are enforced. Admin-only access is enforced via the
  underlying tables' RLS policies.
*/

DROP VIEW IF EXISTS public.admin_revenue_summary;

CREATE VIEW public.admin_revenue_summary
  WITH (security_invoker = true)
AS
  SELECT
    'filing'::text AS source,
    payments.amount_usd,
    payments.created_at AS paid_at,
    'Trademark Filing'::text AS description
  FROM payments
  WHERE payments.status = 'paid'
UNION ALL
  SELECT
    'search_report'::text AS source,
    clearance_report_orders.final_amount_usd AS amount_usd,
    clearance_report_orders.paid_at,
    ('Search Report: ' || clearance_report_orders.mark_name) AS description
  FROM clearance_report_orders
  WHERE clearance_report_orders.status = 'paid';
