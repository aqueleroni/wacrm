-- ============================================================
-- 041_ai_configs_prompt_locale.sql — L da auditoria
--
-- The prompt scaffold language was a single global env var
-- (AI_PROMPT_LOCALE), so every tenant on a shared deploy shared one
-- language. Move it to a per-account column with the env as fallback.
-- NULL = "use the deploy default".
--
-- The column must be added to the authenticated SELECT grant explicitly
-- because migration 038 replaced the table-wide grant with a
-- column-list grant.
-- ============================================================

ALTER TABLE public.ai_configs
  ADD COLUMN IF NOT EXISTS prompt_locale text
  CHECK (prompt_locale IN ('pt-BR', 'en'));

GRANT SELECT (prompt_locale) ON public.ai_configs TO authenticated;
