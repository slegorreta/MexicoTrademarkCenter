/*
  # Create Admin Revenue Summary View

  1. New View
    - `admin_revenue_summary` — unions confirmed revenue from both trademark filings
      (payments table) and clearance search reports (clearance_report_orders table)
      into a single queryable view for admin reporting purposes.

  2. Columns
    - source: 'filing' | 'search_report'
    - amount_usd: the confirmed payment amount
    - paid_at: when payment was confirmed
    - description: human-readable label for the transaction

  3. No data is modified; this is a read-only view.
*/

CREATE OR REPLACE VIEW admin_revenue_summary AS
  SELECT
    'filing'::text AS source,
    amount_usd,
    created_at AS paid_at,
    'Trademark Filing'::text AS description
  FROM payments
  WHERE status = 'paid'
  UNION ALL
  SELECT
    'search_report'::text AS source,
    final_amount_usd AS amount_usd,
    paid_at,
    ('Search Report: ' || mark_name)::text AS description
  FROM clearance_report_orders
  WHERE status = 'paid';
