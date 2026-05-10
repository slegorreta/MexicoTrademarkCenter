/*
  # Add user_id to clearance_report_orders

  ## Summary
  Links clearance report orders to authenticated user accounts, enabling the
  Search Reports section in the client dashboard.

  ## Changes
  - `clearance_report_orders`
    - New column: `user_id` (uuid, nullable FK → auth.users) — null for anonymous purchases
    - New column: `email_sent_at` (timestamptz) — tracks when receipt email was delivered
  - Index on `user_id` for efficient dashboard queries
  - New RLS SELECT policy: authenticated users can read their own orders by user_id
*/

-- Add user_id column (nullable so existing anonymous orders are unaffected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clearance_report_orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clearance_report_orders
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add email_sent_at column for delivery tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clearance_report_orders' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE clearance_report_orders
      ADD COLUMN email_sent_at timestamptz;
  END IF;
END $$;

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_clearance_report_orders_user_id
  ON clearance_report_orders(user_id);

-- RLS: authenticated users can read their own orders (by user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clearance_report_orders'
      AND policyname = 'Users can view own clearance report orders'
  ) THEN
    CREATE POLICY "Users can view own clearance report orders"
      ON clearance_report_orders FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
