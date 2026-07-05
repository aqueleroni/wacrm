-- ============================================================
-- 040_notifications_ai_handoff.sql — D da auditoria
--
-- When the AI hands a conversation off, it disables auto-reply and the
-- customer waits until someone happens to open the inbox. Widen the
-- notifications type CHECK so the auto-reply path can fan out an
-- 'ai_handoff' notification to the account's members (rows written by
-- the service role, same as the assignment trigger).
-- ============================================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('conversation_assigned', 'ai_handoff'));
