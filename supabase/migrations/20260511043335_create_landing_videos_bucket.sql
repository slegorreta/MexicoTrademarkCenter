/*
  # Create landing-videos storage bucket

  ## Changes
  - Creates a public storage bucket named "landing-videos" for hosting hero section videos
  - Enables public read access so videos can be served directly from the CDN URL
  - Only authenticated users with admin/super_admin role can upload
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-videos',
  'landing-videos',
  true,
  524288000,
  ARRAY['video/mp4','video/webm','video/ogg','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read (anyone can view)
CREATE POLICY "Public can view landing videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'landing-videos');

-- Allow super_admin and admin to upload/manage
CREATE POLICY "Admins can upload landing videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'landing-videos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update landing videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'landing-videos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete landing videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'landing-videos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );
