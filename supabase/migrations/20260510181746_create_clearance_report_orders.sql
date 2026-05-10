/*
  # Create clearance_report_orders table

  1. New Table
    - `clearance_report_orders`
      - `id` (uuid, primary key)
      - `mark_name` (text) — the trademark searched
      - `goods_services` (text) — goods/services description
      - `language` (text) — UI language code (en, es, zh, de, fr, hi, pt)
      - `clearance_result` (jsonb) — full verify-trademark response JSON
      - `email` (text) — email address to deliver the PDF report
      - `stripe_payment_intent_id` (text)
      - `amount_usd` (numeric) — original price before discount (4.99)
      - `coupon_code` (text, nullable)
      - `discount_percent` (integer, default 0)
      - `final_amount_usd` (numeric) — actual charged amount
      - `status` (text) — pending / paid / failed
      - `paid_at` (timestamptz, nullable)
      - `pdf_storage_path` (text, nullable) — Supabase Storage path after generation
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Anon users can INSERT (needed for unauthenticated free-tool visitors)
    - Service role handles all updates (PDF path, status)
    - No SELECT for anon (report data is private)
*/

CREATE TABLE IF NOT EXISTS clearance_report_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_name text NOT NULL DEFAULT '',
  goods_services text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  clearance_result jsonb NOT NULL DEFAULT '{}',
  email text NOT NULL DEFAULT '',
  stripe_payment_intent_id text NOT NULL DEFAULT '',
  amount_usd numeric(10,2) NOT NULL DEFAULT 4.99,
  coupon_code text,
  discount_percent integer NOT NULL DEFAULT 0,
  final_amount_usd numeric(10,2) NOT NULL DEFAULT 4.99,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  paid_at timestamptz,
  pdf_storage_path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clearance_report_orders ENABLE ROW LEVEL SECURITY;

-- Anon visitors can create a report order (before payment)
CREATE POLICY "Anon can insert report orders"
  ON clearance_report_orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can insert too (logged-in users using the free tool)
CREATE POLICY "Authenticated can insert report orders"
  ON clearance_report_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
