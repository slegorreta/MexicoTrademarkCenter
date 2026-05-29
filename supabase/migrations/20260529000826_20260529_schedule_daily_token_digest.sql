/*
  # Schedule daily-token-digest edge function

  Triggers the daily-token-digest edge function every day at 04:00 UTC,
  which corresponds to 10:00 PM Mexico City Standard Time (UTC-6).
  During Daylight Saving Time (UTC-5) this fires at 11:00 PM MX — acceptable
  for a nightly digest email.

  Uses pg_cron (pre-enabled on Supabase) and the net extension for HTTP calls.
*/

-- Enable pg_cron and pg_net if not already active
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any pre-existing schedule with the same name to avoid duplicates
SELECT cron.unschedule('daily-token-digest')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-token-digest'
);

-- Schedule: every day at 04:00 UTC (= 10:00 PM Mexico City CST)
SELECT cron.schedule(
  'daily-token-digest',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/daily-token-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_anon_key') || '"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);
