-- ============================================================
-- 036_ai_engine_fixes.sql — correções funcionais do motor de IA
-- (auditoria 2026-07-05: B3, B4, B7, H2)
-- ============================================================

-- ------------------------------------------------------------
-- B3 · Memory-extract cron starvation.
-- The old JS-side approach fetched the oldest `limit * 3`
-- conversations and filtered already-extracted ones in JS; dormant
-- already-extracted rows permanently occupy the search window and the
-- cron degrades to processing zero conversations. Filter in SQL
-- instead (PostgREST can't compare column-to-column).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_conversations_for_memory_extract(
  p_cutoff timestamptz,
  p_limit integer
)
RETURNS TABLE (id uuid, account_id uuid, contact_id uuid) AS $$
  SELECT c.id, c.account_id, c.contact_id
  FROM conversations c
  JOIN ai_configs cfg ON cfg.account_id = c.account_id
    AND cfg.memory_auto_extract AND cfg.is_active
  WHERE c.updated_at < p_cutoff
    AND (c.ai_memory_extracted_at IS NULL
         OR c.updated_at > c.ai_memory_extracted_at)
  ORDER BY c.updated_at ASC
  LIMIT GREATEST(p_limit, 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.find_conversations_for_memory_extract(timestamptz, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_conversations_for_memory_extract(timestamptz, integer)
  TO service_role;

-- The 033 partial index only covered `ai_memory_extracted_at IS NULL`,
-- which the query above can't use alone. Replace it with one matching
-- the RPC's predicate (column-vs-column is allowed in a partial index).
DROP INDEX IF EXISTS conversations_memory_extract_idx;
CREATE INDEX conversations_memory_extract_idx
  ON conversations (updated_at)
  WHERE ai_memory_extracted_at IS NULL OR updated_at > ai_memory_extracted_at;

-- ------------------------------------------------------------
-- B4 · Webhook idempotency. Meta re-delivers webhooks when it doesn't
-- get a timely 200; each retry re-inserted the inbound message
-- (duplicate in the inbox, double automation + AI reply). Meta message
-- IDs aren't globally unique across accounts, but they ARE unique per
-- conversation — enforce that so the webhook's INSERT fails fast
-- (23505) on a retry. Verified 2026-07-05: no existing duplicates.
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_conv_wamid_unique
  ON messages (conversation_id, message_id)
  WHERE message_id IS NOT NULL AND sender_type = 'customer';

-- ------------------------------------------------------------
-- B7 · unread_count race. The webhook did a read-modify-write
-- (`unread_count + 1` computed in JS), losing increments under
-- concurrent inbounds. Same atomic-UPDATE pattern as
-- claim_ai_reply_slot.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bump_conversation_inbound(
  p_conversation_id uuid,
  p_last_text text
) RETURNS void AS $$
  UPDATE conversations
  SET unread_count = unread_count + 1,
      last_message_text = p_last_text,
      last_message_at = now(),
      updated_at = now()
  WHERE id = p_conversation_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.bump_conversation_inbound(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_conversation_inbound(uuid, text)
  TO service_role;

-- ------------------------------------------------------------
-- H2 · Pin search_path on the trigger helpers the advisors flag as
-- mutable (classic SECURITY DEFINER escalation vector). Done via
-- ALTER so we don't have to restate each body; the DO block resolves
-- the exact signatures from pg_proc.
-- ------------------------------------------------------------
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'update_updated_at_column',
        '_bcast_cols_for_status',
        'update_ai_configs_updated_at',
        'update_ai_knowledge_documents_updated_at',
        'update_ai_agent_memory_updated_at',
        'update_ai_agent_skills_updated_at'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.sig);
  END LOOP;
END $$;
