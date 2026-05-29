/*
  # Fix daily-token-digest cron — use literal URL and anon key

  Replaces the previous cron job that relied on current_setting()
  (which is not set) with one using the project's literal URL and anon key.
  The daily-token-digest function is public (verify_jwt=false) so the
  anon key is sufficient to invoke it.
*/

-- Remove the broken schedule
SELECT cron.unschedule('daily-token-digest');

-- Re-schedule with literal values (10 PM Mexico City = 04:00 UTC standard time)
SELECT cron.schedule(
  'daily-token-digest',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://xrqbwozlvnrfbckbfbsc.supabase.co/functions/v1/daily-token-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycWJ3b3psdm5yZmJja2JmYnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Nzg5NDMsImV4cCI6MjA5MzE1NDk0M30.Z-6QYYesPKBqK4-0dea0KMEFCn35A98TbAu_f_wYaPs"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
