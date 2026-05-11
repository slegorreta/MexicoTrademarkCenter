/*
  # Increase landing-videos bucket file size limit

  The zh-hero.mp4 video is ~726 MB. The previous limit of 500 MB
  was blocking the upload. Raised to 1 GB to accommodate it.
*/
UPDATE storage.buckets
SET file_size_limit = 1073741824  -- 1 GB
WHERE id = 'landing-videos';
