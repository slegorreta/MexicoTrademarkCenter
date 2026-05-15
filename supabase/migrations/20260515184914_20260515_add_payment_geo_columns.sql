/*
  # Add Payment Geolocation Columns

  Adds GPS coordinate columns to capture the user's physical location
  at the moment they click Pay (only if they grant browser location permission).

  1. Modified Tables
    - `filing_events`
      - `geo_lat` (double precision, nullable) — GPS latitude
      - `geo_lng` (double precision, nullable) — GPS longitude

    - `applications`
      - `payment_geo_lat` (double precision, nullable) — GPS latitude at payment time
      - `payment_geo_lng` (double precision, nullable) — GPS longitude at payment time

  2. Notes
    - All columns are nullable — location is always optional and never blocks payment
    - Uses IF NOT EXISTS guards to be safe for re-runs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filing_events' AND column_name = 'geo_lat'
  ) THEN
    ALTER TABLE filing_events ADD COLUMN geo_lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filing_events' AND column_name = 'geo_lng'
  ) THEN
    ALTER TABLE filing_events ADD COLUMN geo_lng double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'payment_geo_lat'
  ) THEN
    ALTER TABLE applications ADD COLUMN payment_geo_lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'payment_geo_lng'
  ) THEN
    ALTER TABLE applications ADD COLUMN payment_geo_lng double precision;
  END IF;
END $$;
