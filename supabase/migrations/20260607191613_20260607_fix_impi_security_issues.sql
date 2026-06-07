/*
# Fix IMPI security issues

## Changes

### 1. Mutable search_path on update_impi_jobs_updated_at
Recreates the trigger function with `SET search_path = ''` so it is not
vulnerable to search_path hijacking by an attacker who can create objects
in a schema that appears earlier in the default search path.

### 2. Tighten INSERT policy on impi_jobs (was always-true)
Replaces the broad `WITH CHECK (true)` with a meaningful constraint:
- `status` must be 'queued' (all legitimate job rows start as queued)
- `current_step` must be 'queued' (matches what submit.ts always inserts)
This blocks arbitrary row injection while still allowing the Vercel submit handler.

### 3. Tighten UPDATE policy on impi_jobs (was always-true)
Replaces both `USING (true)` and `WITH CHECK (true)` with meaningful constraints:
- USING: only rows still in-progress (queued or running) can be updated,
  preventing modification of completed or failed records
- WITH CHECK: the new status must be a valid enum value

## Notes
- pg_net extension schema cannot be changed (the extension does not support
  SET SCHEMA) — this must be addressed by Supabase support or a platform upgrade.
*/

-- 1. Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.update_impi_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Replace always-true INSERT policy with a meaningful constraint
DROP POLICY IF EXISTS "Anon can insert impi_jobs" ON public.impi_jobs;
CREATE POLICY "Anon can insert impi_jobs"
  ON public.impi_jobs
  FOR INSERT
  TO anon
  WITH CHECK (status = 'queued' AND current_step = 'queued');

-- 3. Replace always-true UPDATE policy with meaningful constraints
DROP POLICY IF EXISTS "Anon can update impi_jobs" ON public.impi_jobs;
CREATE POLICY "Anon can update impi_jobs"
  ON public.impi_jobs
  FOR UPDATE
  TO anon
  USING (status IN ('queued', 'running'))
  WITH CHECK (status IN ('queued', 'running', 'done', 'failed'));
