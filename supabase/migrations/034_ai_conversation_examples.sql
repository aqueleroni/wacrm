-- ============================================================
-- 034_ai_conversation_examples.sql — Few-shot examples for persona
-- Optional markdown/text block shown in Configuração → Comportamento.
-- ============================================================

ALTER TABLE ai_configs
  ADD COLUMN IF NOT EXISTS conversation_examples text;
