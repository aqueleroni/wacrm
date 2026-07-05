-- ============================================================
-- 038_ai_configs_key_column_privileges.sql — B5 da auditoria
--
-- The ai_configs SELECT policy grants every member row access to ALL
-- columns, so a viewer with supabase-js could read `api_key` /
-- `embeddings_api_key` ciphertext directly (the API routes strip it,
-- but the row-level grant didn't). It's only AES-256-GCM ciphertext —
-- useless without ENCRYPTION_KEY — but defense-in-depth: revoke SELECT
-- on the two key columns from `authenticated`, keeping every other
-- column readable.
--
-- Server code that needs the plaintext key (draft, playground,
-- auto-reply, memory-extract, config/test/knowledge routes) now reads
-- these columns through the service-role client, scoped to the
-- session-resolved accountId (migration 038 companion code change).
-- service_role bypasses this REVOKE, so those paths keep working.
-- ============================================================

REVOKE SELECT ON public.ai_configs FROM authenticated;

GRANT SELECT (
  id, account_id, created_by, provider, model, system_prompt,
  is_active, auto_reply_enabled, auto_reply_max_per_conversation,
  memory_auto_extract, conversation_examples, created_at, updated_at
) ON public.ai_configs TO authenticated;
