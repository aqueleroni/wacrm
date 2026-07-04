-- ============================================================
-- 033_ai_memory_extract.sql — Supervised memory learning
--
-- memory_auto_extract: when true, cron analyzes idle conversations
-- and proposes memory rows with status=pending for admin approval.
-- ai_memory_extracted_at: last time a conversation was processed.
-- ============================================================

ALTER TABLE ai_configs
  ADD COLUMN IF NOT EXISTS memory_auto_extract boolean NOT NULL DEFAULT false;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS ai_memory_extracted_at timestamptz;

CREATE INDEX IF NOT EXISTS conversations_memory_extract_idx
  ON conversations (account_id, updated_at)
  WHERE ai_memory_extracted_at IS NULL;
