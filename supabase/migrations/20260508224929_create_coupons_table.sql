/*
  # Create coupons table

  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `code` (text, unique, case-insensitive via stored uppercase)
      - `discount_percent` (integer, 1–100)
      - `description` (text, optional human-readable label)
      - `max_uses` (integer, null = unlimited)
      - `uses_count` (integer, current redemption count)
      - `active` (boolean, can be toggled off to disable)
      - `expires_at` (timestamptz, null = never expires)
      - `created_at` (timestamptz)

  2. Seed
    - Insert the 'AYRTON' code with 99% discount (unlimited, never expires)

  3. Security
    - Enable RLS
    - Only service-role (edge functions) can read/update coupons — no client access
    - A separate validate function is exposed via edge function, not direct table access
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  description text DEFAULT '',
  max_uses integer DEFAULT NULL,
  uses_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- No public access — only service role (used by edge functions with service key)
-- Authenticated staff can read coupons for admin visibility
CREATE POLICY "Staff can view coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'docketing_staff', 'filing_staff')
    )
  );

-- Seed the initial coupon (code stored uppercase for case-insensitive matching)
INSERT INTO coupons (code, discount_percent, description, max_uses, active)
VALUES ('AYRTON', 99, 'Founder discount — 99% off', NULL, true)
ON CONFLICT (code) DO NOTHING;
