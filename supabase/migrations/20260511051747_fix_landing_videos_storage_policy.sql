/*
  # Fix: Restrict landing-videos SELECT policy to prevent directory listing

  The previous policy allowed any client to SELECT all rows in storage.objects
  for the landing-videos bucket, which enables listing all files in the bucket.
  Public buckets only need URL-based access — no SELECT policy is required for
  that. This migration replaces the broad policy with one scoped to known
  filenames, preventing unintended enumeration of bucket contents.
*/

-- Remove the broad "anyone can list everything" policy
DROP POLICY IF EXISTS "Public can view landing videos" ON storage.objects;

-- Allow public read-access only to specific known video files by name pattern.
-- This permits direct URL access while preventing directory listing.
CREATE POLICY "Public can access known landing video files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'landing-videos'
    AND name ~ '^[a-z]{2}-hero\.mp4$'
  );
