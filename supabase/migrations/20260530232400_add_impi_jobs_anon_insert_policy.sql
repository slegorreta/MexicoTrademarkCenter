/*
  # Add anon INSERT policy for impi_jobs

  The Vercel API function (submit.ts) creates job rows server-side without a
  user session, so it runs as the anon role. Previously there was no INSERT
  policy, so all writes were blocked by RLS.

  Changes:
  - Add INSERT policy allowing the anon role to create impi_jobs rows.
    The worker then updates those rows (also as anon), so an UPDATE policy
    is added too.
  - SELECT policy already exists for authenticated users (unchanged).

  Security notes:
  - INSERT is intentionally open to anon because job creation comes from our
    own Vercel backend, not from end-users directly. The beta endpoint is
    already protected by an x-beta-token header check in the function itself.
  - UPDATE is restricted to rows the anon role created (no ownership column),
    so we allow update on any row — acceptable because only our backend
    calls the worker endpoint.
*/

CREATE POLICY "Anon can insert impi_jobs"
  ON impi_jobs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update impi_jobs"
  ON impi_jobs
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
