-- ============================================================
-- 037_storage_listing_hardening.sql — S5 da auditoria 2026-07-05
--
-- The four public buckets each carried a broad SELECT policy on
-- storage.objects, which lets ANY client (including anon) LIST every
-- object in the bucket via the storage API — for `chat-media` that
-- means enumerating and downloading all tenants' WhatsApp photos,
-- audio, and documents.
--
-- Public-URL access (`/storage/v1/object/public/<bucket>/<path>`)
-- does NOT go through these policies — it only requires
-- `buckets.public = true`, which stays. So dropping the policies
-- removes enumeration while every already-shared URL (and Meta's
-- fetch of outbound media at send time) keeps working. The app never
-- calls `storage.list()`/`download()` on these buckets (verified),
-- only `getPublicUrl()`.
--
-- Follow-up (not done here): move `chat-media` to a private bucket +
-- signed URLs. That requires touching every send path that hands Meta
-- a URL (composer, flows, automations) — tracked in the audit doc.
-- ============================================================

DROP POLICY IF EXISTS "Chat media is publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Flow media is publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Account branding is publicly readable" ON storage.objects;
