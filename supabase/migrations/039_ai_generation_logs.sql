-- ============================================================
-- 039_ai_generation_logs.sql — E da auditoria (observabilidade)
--
-- Nothing recorded each AI generation, so questions like "how much did
-- the agent cost this month?", "what's the handoff rate?", or "did
-- replies get worse after I changed the prompt?" were unanswerable.
-- One append-only row per generateReply call (draft / auto-reply /
-- playground), written fire-and-forget by the service role. The
-- providers return `usage` — previously discarded — now captured here.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('draft', 'auto_reply', 'playground')),
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  outcome text NOT NULL CHECK (outcome IN ('sent', 'draft', 'handoff', 'error')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_generation_logs_account_created_idx
  ON public.ai_generation_logs (account_id, created_at DESC);

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Members read their own account's logs (Intelligence panel). No client
-- INSERT/UPDATE/DELETE policy — rows are written only by the service role.
DROP POLICY IF EXISTS ai_generation_logs_select ON public.ai_generation_logs;
CREATE POLICY ai_generation_logs_select ON public.ai_generation_logs
  FOR SELECT USING (is_account_member(account_id));
