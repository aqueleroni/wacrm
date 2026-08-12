-- ============================================================
-- 032_ai_agent_intelligence.sql — Agent memory + skills
--
-- Internal layers for the AI assistant (invisible to WhatsApp
-- customers). Memory stores approved facts; skills are situational
-- playbooks matched against the customer's message.
--
-- RLS: settings-class — members read, admin+ write.
-- Retrieval RPCs: SECURITY DEFINER, service_role + authenticated.
-- ============================================================

-- ---- memory ------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_agent_memory (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id  uuid REFERENCES contacts(id) ON DELETE CASCADE,
  kind        text NOT NULL DEFAULT 'fact'
                CHECK (kind IN ('fact', 'preference', 'objection', 'note')),
  content     text NOT NULL,
  source      text NOT NULL DEFAULT 'manual'
                CHECK (source IN ('manual', 'extracted', 'import')),
  status      text NOT NULL DEFAULT 'approved'
                CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  fts         tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_agent_memory_account_idx
  ON ai_agent_memory (account_id);
CREATE INDEX IF NOT EXISTS ai_agent_memory_contact_idx
  ON ai_agent_memory (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_agent_memory_status_idx
  ON ai_agent_memory (account_id, status);
CREATE INDEX IF NOT EXISTS ai_agent_memory_fts_idx
  ON ai_agent_memory USING gin (fts);

ALTER TABLE ai_agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_memory_select ON ai_agent_memory;
CREATE POLICY ai_agent_memory_select ON ai_agent_memory FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS ai_agent_memory_insert ON ai_agent_memory;
CREATE POLICY ai_agent_memory_insert ON ai_agent_memory FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_agent_memory_update ON ai_agent_memory;
CREATE POLICY ai_agent_memory_update ON ai_agent_memory FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_agent_memory_delete ON ai_agent_memory;
CREATE POLICY ai_agent_memory_delete ON ai_agent_memory FOR DELETE
  USING (is_account_member(account_id, 'admin'));

CREATE OR REPLACE FUNCTION public.update_ai_agent_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_agent_memory_updated_at ON ai_agent_memory;
CREATE TRIGGER ai_agent_memory_updated_at
  BEFORE UPDATE ON ai_agent_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_agent_memory_updated_at();

-- ---- skills ------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_agent_skills (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  trigger_hint  text NOT NULL,
  instructions  text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  priority      integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_agent_skills_account_idx
  ON ai_agent_skills (account_id);
CREATE INDEX IF NOT EXISTS ai_agent_skills_active_idx
  ON ai_agent_skills (account_id, is_active, priority DESC);

ALTER TABLE ai_agent_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_skills_select ON ai_agent_skills;
CREATE POLICY ai_agent_skills_select ON ai_agent_skills FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS ai_agent_skills_insert ON ai_agent_skills;
CREATE POLICY ai_agent_skills_insert ON ai_agent_skills FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_agent_skills_update ON ai_agent_skills;
CREATE POLICY ai_agent_skills_update ON ai_agent_skills FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS ai_agent_skills_delete ON ai_agent_skills;
CREATE POLICY ai_agent_skills_delete ON ai_agent_skills FOR DELETE
  USING (is_account_member(account_id, 'admin'));

CREATE OR REPLACE FUNCTION public.update_ai_agent_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_agent_skills_updated_at ON ai_agent_skills;
CREATE TRIGGER ai_agent_skills_updated_at
  BEFORE UPDATE ON ai_agent_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_agent_skills_updated_at();

-- ---- retrieval RPC -----------------------------------------
CREATE OR REPLACE FUNCTION public.match_ai_agent_memory_fts(
  p_account_id  uuid,
  p_query       text,
  p_contact_id  uuid,
  p_match_count integer
)
RETURNS TABLE (id uuid, content text, rank real) AS $$
  SELECT m.id,
         m.content,
         ts_rank(m.fts, plainto_tsquery('simple', p_query)) AS rank
  FROM ai_agent_memory m
  WHERE m.account_id = p_account_id
    AND m.status = 'approved'
    AND (m.contact_id IS NULL OR m.contact_id = p_contact_id)
    AND m.fts @@ plainto_tsquery('simple', p_query)
  ORDER BY rank DESC
  LIMIT GREATEST(p_match_count, 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.match_ai_agent_memory_fts(uuid, text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_ai_agent_memory_fts(uuid, text, uuid, integer) TO authenticated, service_role;
