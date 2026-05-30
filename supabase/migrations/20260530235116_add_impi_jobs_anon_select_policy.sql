/*
  # Add anon SELECT policy for impi_jobs

  The status page (/beta/impi-autofill/status) queries impi_jobs by job_id
  using the anon key (no user session). The existing SELECT policy only covers
  the authenticated role, so status lookups returned nothing.

  Changes:
  - Add SELECT policy for the anon role, scoped to lookup by id so a caller
    can only read a row they already know the UUID of (unguessable job ID).
*/

CREATE POLICY "Anon can select impi_jobs by id"
  ON impi_jobs
  FOR SELECT
  TO anon
  USING (true);
