-- Templates are a WhatsApp Business Account resource, not a per-user
-- resource. Migration 017 made the rows visible to every member of an
-- account, but the legacy UNIQUE(user_id, name, language) still let two
-- admins create separate local rows for the same Meta template.
--
-- This migration deliberately stops if that legacy data exists. Picking
-- one duplicate automatically could discard the Meta ID, approval status,
-- or content from the other row.

DO $$
DECLARE
  duplicate_count integer;
  duplicate_sample text;
BEGIN
  SELECT count(*)
    INTO duplicate_count
  FROM (
    SELECT 1
    FROM public.message_templates
    GROUP BY account_id, name, COALESCE(language, 'en_US')
    HAVING count(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    SELECT string_agg(
      format('%s / %s / %s (%s rows)', account_id, name, language, row_count),
      E'\n  '
    )
      INTO duplicate_sample
    FROM (
      SELECT account_id,
             name,
             COALESCE(language, 'en_US') AS language,
             count(*) AS row_count
      FROM public.message_templates
      GROUP BY account_id, name, COALESCE(language, 'en_US')
      HAVING count(*) > 1
      ORDER BY account_id, name, COALESCE(language, 'en_US')
      LIMIT 10
    ) duplicates;

    RAISE EXCEPTION
      E'Cannot make message templates account-scoped: % duplicate account/name/language combination(s) found. Review and merge the rows manually, then run this migration again. Sample:\n  %',
      duplicate_count,
      duplicate_sample
      USING ERRCODE = '23505';
  END IF;
END $$;

-- Null was historically allowed despite the application treating it as
-- en_US. Normalize it before adding a conflict target PostgREST can use.
UPDATE public.message_templates
SET language = 'en_US'
WHERE language IS NULL;

ALTER TABLE public.message_templates
  ALTER COLUMN language SET DEFAULT 'en_US',
  ALTER COLUMN language SET NOT NULL;

DROP INDEX IF EXISTS public.message_templates_user_name_language_key;

CREATE UNIQUE INDEX message_templates_account_name_language_key
  ON public.message_templates (account_id, name, language);
