-- ============================================================
-- 035_ai_rpc_hardening.sql — Trava as RPCs de IA e funções internas
--
-- Corrige achados CRÍTICOS da auditoria (05/07/2026):
--
--   S1/S2 — claim_ai_reply_slot foi criada SECURITY DEFINER na
--           migration 029 SEM o REVOKE/GRANT que a 030 aplica. No
--           banco ao vivo ela estava executável por PUBLIC + anon +
--           authenticated, permitindo que qualquer um (até sem login)
--           incrementasse ai_reply_count de qualquer conversa e
--           silenciasse o auto-reply da conta (DoS direcionado).
--
--   S3   — match_ai_knowledge_fts / _semantic / match_ai_agent_memory_fts
--           tinham REVOKE FROM PUBLIC nas migrations, mas os default
--           privileges do Supabase re-concederam EXECUTE ao `anon`.
--           Como são SECURITY DEFINER (ignoram RLS) e só filtram pelo
--           account_id PASSADO pelo chamador, qualquer visitante podia
--           ler a base de conhecimento e a memória de qualquer conta.
--           Defesa em profundidade: além de revogar anon, a própria
--           função agora exige filiação (auth.uid() NULL = service_role,
--           passa; usuário logado só passa se for membro da conta).
--
--   S4   — Funções internas de engine e triggers estavam executáveis
--           por anon via REST (_bcast_bump, record_webhook_failure,
--           recompute_broadcast_counts, merge_duplicate_contacts, e as
--           funções de trigger que nunca deveriam ser chamáveis via RPC).
--
-- NÃO mexemos em is_account_member / peek_invitation / redeem_invitation
-- / set_member_role / remove_account_member / transfer_account_ownership
-- / touch_presence: todas validam auth.uid() internamente e o fluxo de
-- convite público depende do acesso anônimo — revogar quebraria login.
--
-- Idempotente — seguro rodar múltiplas vezes.
-- ============================================================

-- ---- S1 / S2: claim_ai_reply_slot -------------------------
-- Só o bot (service_role, via webhook sem auth.uid()) precisa chamar.
REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_reply_slot(uuid, integer) TO service_role;

-- ---- S3: match_* com guard de filiação --------------------
CREATE OR REPLACE FUNCTION public.match_ai_knowledge_fts(
  p_account_id  uuid,
  p_query       text,
  p_match_count integer
)
RETURNS TABLE (id uuid, content text, rank real) AS $$
  SELECT c.id,
         c.content,
         ts_rank(c.fts, plainto_tsquery('simple', p_query)) AS rank
  FROM ai_knowledge_chunks c
  WHERE c.account_id = p_account_id
    AND (auth.uid() IS NULL OR is_account_member(p_account_id))
    AND c.fts @@ plainto_tsquery('simple', p_query)
  ORDER BY rank DESC
  LIMIT GREATEST(p_match_count, 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.match_ai_knowledge_semantic(
  p_account_id      uuid,
  p_query_embedding text,
  p_match_count     integer
)
RETURNS TABLE (id uuid, content text, distance real) AS $$
  SELECT c.id,
         c.content,
         (c.embedding <=> p_query_embedding::vector(1536)) AS distance
  FROM ai_knowledge_chunks c
  WHERE c.account_id = p_account_id
    AND (auth.uid() IS NULL OR is_account_member(p_account_id))
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query_embedding::vector(1536)
  LIMIT GREATEST(p_match_count, 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

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
    AND (auth.uid() IS NULL OR is_account_member(p_account_id))
    AND m.status = 'approved'
    AND (m.contact_id IS NULL OR m.contact_id = p_contact_id)
    AND m.fts @@ plainto_tsquery('simple', p_query)
  ORDER BY rank DESC
  LIMIT GREATEST(p_match_count, 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Revoga o EXECUTE do anon (que os default privileges re-concederam) e
-- reaplica o grant correto: draft roda como authenticated, bot como
-- service_role.
REVOKE ALL ON FUNCTION public.match_ai_knowledge_fts(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_ai_knowledge_fts(uuid, text, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.match_ai_knowledge_semantic(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_ai_knowledge_semantic(uuid, text, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.match_ai_agent_memory_fts(uuid, text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_ai_agent_memory_fts(uuid, text, uuid, integer) TO authenticated, service_role;

-- ---- S4: funções internas de engine + triggers ------------
-- record_webhook_failure: chamada só pelo dispatcher via service_role.
REVOKE ALL ON FUNCTION public.record_webhook_failure(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_webhook_failure(uuid, integer) TO service_role;

-- _bcast_bump: interna dos contadores de broadcast.
REVOKE ALL ON FUNCTION public._bcast_bump(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._bcast_bump(uuid, text, integer) TO service_role;

-- recompute_broadcast_counts / merge_duplicate_contacts: manutenção;
-- não expor a anon.
REVOKE ALL ON FUNCTION public.recompute_broadcast_counts(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.merge_duplicate_contacts() FROM PUBLIC, anon;

-- Funções de trigger: nunca devem ser chamáveis via RPC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.broadcast_recipient_aggregate_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_conversation_assigned() FROM PUBLIC, anon, authenticated;
