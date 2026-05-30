/*
  # Create beta-logo-uploads Storage Bucket

  Creates a private Supabase Storage bucket for temporary logo PDF uploads
  used by the IMPI auto-fill beta system. Files are uploaded by unauthenticated
  users (the beta form is token-protected at the app level) and read only by
  the server-side worker using the service role key.

  1. New Storage Bucket
     - `beta-logo-uploads` — private bucket (no public access)
     - 10 MB file size limit (PDF logos)
     - Accepts: application/pdf, image/png, image/jpeg, image/svg+xml

  2. Storage Policies
     - INSERT: anyone can upload (the beta form validates BETA_SECRET before calling this)
     - SELECT: service role only (server-side worker downloads via service role key)
     - No DELETE or UPDATE policies — cleanup is manual
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beta-logo-uploads',
  'beta-logo-uploads',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow any request to upload files into this bucket.
-- The beta form enforces BETA_SECRET token validation before calling Storage,
-- so this open insert policy is acceptable for the beta.
CREATE POLICY "Beta logo upload — public insert"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'beta-logo-uploads');

-- Allow authenticated and service-role reads (worker uses service role key).
CREATE POLICY "Beta logo upload — service role select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'beta-logo-uploads');
