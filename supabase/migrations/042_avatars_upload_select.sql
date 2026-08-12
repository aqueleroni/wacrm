-- ============================================================
-- 042_avatars_upload_select.sql
--
-- Migration 037 dropped broad public SELECT on storage.objects for
-- avatars (to stop bucket listing). Public URLs still work via
-- buckets.public = true.
--
-- Side effect: Storage uploads with `upsert: true` need SELECT +
-- INSERT + UPDATE. Without SELECT, avatar uploads return HTTP 400.
--
-- Restore a narrow SELECT: authenticated users may only see objects
-- inside their own `{auth.uid()}/…` folder — no cross-tenant listing.
-- ============================================================

DROP POLICY IF EXISTS "Users can read their own avatars" ON storage.objects;
CREATE POLICY "Users can read their own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Upsert / replace also evaluates WITH CHECK on UPDATE.
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
