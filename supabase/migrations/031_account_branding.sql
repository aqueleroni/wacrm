-- ============================================================
-- 031_account_branding.sql
--
-- Account-level white-label branding: display name, logo URL,
-- custom primary accent color. Admin+ can update via accounts RLS.
--
-- Logo files live in the `account-branding` bucket:
--   account-branding/account-<account_id>/logo-<timestamp>.<ext>
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_primary_color TEXT;

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_brand_name_len;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_brand_name_len
  CHECK (brand_name IS NULL OR char_length(trim(brand_name)) BETWEEN 1 AND 60);

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_brand_primary_color_format;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_brand_primary_color_format
  CHECK (
    brand_primary_color IS NULL
    OR brand_primary_color ~ '^#[0-9A-Fa-f]{6}$'
  );

-- ============================================================
-- account-branding storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'account-branding',
  'account-branding',
  TRUE,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Account branding is publicly readable" ON storage.objects;
CREATE POLICY "Account branding is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'account-branding');

DROP POLICY IF EXISTS "Admins can upload account branding" ON storage.objects;
CREATE POLICY "Admins can upload account branding"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND is_account_member(p.account_id, 'admin')
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Admins can update account branding" ON storage.objects;
CREATE POLICY "Admins can update account branding"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND is_account_member(p.account_id, 'admin')
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Admins can delete account branding" ON storage.objects;
CREATE POLICY "Admins can delete account branding"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'account-branding'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND is_account_member(p.account_id, 'admin')
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );
