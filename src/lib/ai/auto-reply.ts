import { supabaseAdmin } from './admin-client'
import { loadAiConfig } from './config'
import { buildConversationContext } from './context'
import { buildAgentContext } from './agent-context'
import { buildCrmContext, formatCrmContextBlock } from './crm-context'
import { generateReply } from './generate'
import { buildSystemPrompt, resolvePromptLocale } from './defaults'
import { retrievalQuery } from './query'
import { logGeneration } from './generation-log'
import { notifyHandoff } from './handoff-notify'
import { AiError } from './types'
import { engineSendText } from '@/lib/flows/meta-send'
import { keywordConfigMatches } from '@/lib/automations/keyword-match'
import type { KeywordMatchTriggerConfig } from '@/types'

interface DispatchArgs {
  /** Tenancy key — drives config, contact, and whatsapp_config lookups. */
  accountId: string
  conversationId: string
  contactId: string
  /** The account's WhatsApp config owner, used for the outbound send's
   *  audit columns (mirrors how the flow runner passes it through). */
  configOwnerUserId: string
  /** The inbound message text, used to predict whether a keyword
   *  automation will answer it (if so, the AI stands down). */
  inboundText: string
}

/**
 * AI auto-reply for a freshly-arrived inbound message.
 *
 * Invoked from the WhatsApp webhook's `after()` block, only when no
 * deterministic flow consumed the message (flows win). Mirrors the flow
 * runner's contract: it owns its try/catch and NEVER throws — a failing
 * or slow LLM call must not affect the webhook's 200 to Meta.
 *
 * Eligibility gates (any → silent no-op):
 *   - AI off / auto-reply disabled for the account
 *   - a human agent is assigned (they own the thread)
 *   - auto-reply was disabled for this conversation (prior handoff)
 *   - the per-conversation reply cap is reached
 *   - there's nothing to reply to
 *
 * The 24h WhatsApp session window is inherently open here — we're
 * reacting to a customer message that just landed — so no separate
 * window check is needed.
 */
export async function dispatchInboundToAiReply(
  args: DispatchArgs,
): Promise<void> {
  const { accountId, conversationId, contactId, configOwnerUserId, inboundText } = args

  try {
    const db = supabaseAdmin()

    // The four eligibility reads are independent — fetch them together
    // so the customer isn't waiting on serial roundtrips before the LLM
    // call even starts. Gates still apply in the same order below.
    const [config, { data: autoResponders }, { data: conv, error: convErr }, messages] =
      await Promise.all([
        loadAiConfig(db, accountId),
        db
          .from('automations')
          .select('trigger_type, trigger_config')
          .eq('account_id', accountId)
          .eq('is_active', true)
          .in('trigger_type', ['new_message_received', 'keyword_match']),
        db
          .from('conversations')
          .select('assigned_agent_id, ai_autoreply_disabled, ai_reply_count')
          .eq('id', conversationId)
          .maybeSingle(),
        buildConversationContext(db, conversationId),
      ])

    if (!config || !config.autoReplyEnabled) return

    // Deterministic, user-configured responders win over the LLM — the
    // caller already excludes messages a Flow consumed. Message-level
    // automations (`new_message_received` / `keyword_match`) are
    // dispatched independently for this same inbound and may send their
    // own reply, so we stand down when one will actually answer THIS
    // message: `new_message_received` answers everything; a keyword
    // automation only wins when its keywords match the inbound text —
    // otherwise the AI still replies. (Relationship triggers like
    // `first_inbound_message` don't count — they're not per-message
    // auto-responders.)
    const willAutoRespond = (autoResponders ?? []).some(
      (a) =>
        a.trigger_type === 'new_message_received' ||
        keywordConfigMatches(
          a.trigger_config as KeywordMatchTriggerConfig | null,
          inboundText,
        ),
    )
    if (willAutoRespond) return

    if (convErr || !conv) return
    if (conv.assigned_agent_id) return // a human owns this thread
    if (conv.ai_autoreply_disabled) return // handed off / turned off here
    // Cheap early-out; the authoritative cap check is the atomic claim
    // below (this read can race a concurrent inbound).
    if (conv.ai_reply_count >= config.autoReplyMaxPerConversation) return

    if (messages.length === 0) return

    // Ground the reply in KB, memory, and skills (best-effort).
    const query = retrievalQuery(messages)
    const [ctx, crmParts] = await Promise.all([
      buildAgentContext({
        db,
        accountId,
        config,
        queryText: query,
        contactId,
      }),
      buildCrmContext(db, accountId, contactId),
    ])

    const systemPrompt = buildSystemPrompt({
      userPrompt: config.systemPrompt,
      conversationExamples: config.conversationExamples,
      mode: 'auto_reply',
      locale: resolvePromptLocale(config.promptLocale),
      knowledge: ctx.knowledge,
      memory: ctx.memory,
      skills: ctx.skills,
      crmContext: formatCrmContextBlock(crmParts),
    })

    const startedAt = Date.now()
    let text: string
    let handoff: boolean
    let usage
    try {
      ;({ text, handoff, usage } = await generateReply({
        config,
        systemPrompt,
        messages,
      }))
    } catch (err) {
      await logGeneration({
        accountId,
        conversationId,
        mode: 'auto_reply',
        provider: config.provider,
        model: config.model,
        latencyMs: Date.now() - startedAt,
        outcome: 'error',
        errorCode: err instanceof AiError ? err.code : 'unknown',
      })
      throw err
    }

    if (handoff || !text) {
      // The model can't (or shouldn't) answer — stop auto-replying on
      // this thread and leave the inbound unanswered so it surfaces in
      // the inbox for a human. Sticky until an admin re-enables.
      await db
        .from('conversations')
        .update({ ai_autoreply_disabled: true })
        .eq('id', conversationId)
      await logGeneration({
        accountId,
        conversationId,
        mode: 'auto_reply',
        provider: config.provider,
        model: config.model,
        usage,
        latencyMs: Date.now() - startedAt,
        outcome: 'handoff',
      })
      await notifyHandoff(db, accountId, conversationId, contactId)
      return
    }

    // Atomically claim a reply slot: the cap check + increment happen in
    // one UPDATE, so concurrent inbounds can never overshoot the cap. If
    // another inbound just took the last slot, `claimed` is false and we
    // skip the send. (We consume a slot slightly before the send lands —
    // fail-safe: under-reply rather than over-reply.)
    const { data: claimed, error: claimErr } = await db.rpc(
      'claim_ai_reply_slot',
      {
        conversation_id: conversationId,
        max_replies: config.autoReplyMaxPerConversation,
      },
    )
    if (claimErr || claimed !== true) return

    await engineSendText({
      accountId,
      userId: configOwnerUserId,
      conversationId,
      contactId,
      text,
    })

    await logGeneration({
      accountId,
      conversationId,
      mode: 'auto_reply',
      provider: config.provider,
      model: config.model,
      usage,
      latencyMs: Date.now() - startedAt,
      outcome: 'sent',
    })
  } catch (err) {
    console.error('[ai auto-reply] dispatch failed:', err)
  }
}
