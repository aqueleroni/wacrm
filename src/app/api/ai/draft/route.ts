import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { loadAiConfig } from '@/lib/ai/config'
import { supabaseAdmin } from '@/lib/ai/admin-client'
import { buildConversationContext } from '@/lib/ai/context'
import { buildAgentContext } from '@/lib/ai/agent-context'
import { buildCrmContext, formatCrmContextBlock } from '@/lib/ai/crm-context'
import { generateReply } from '@/lib/ai/generate'
import { buildSystemPrompt, resolvePromptLocale } from '@/lib/ai/defaults'
import { retrievalQuery } from '@/lib/ai/query'
import { logGeneration } from '@/lib/ai/generation-log'
import { logAiUsage } from '@/lib/ai/usage'
import { AiError } from '@/lib/ai/types'

/**
 * POST /api/ai/draft  (agent+)
 *
 * Body: { conversation_id }
 * Returns: { draft } — a suggested reply for the agent to edit + send.
 *
 * Uses the account's configured provider/key (BYO). Read-only: it never
 * sends or stores anything, just hands text back to the composer.
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('agent')

    const userLimit = checkRateLimit(`ai-draft:${userId}`, RATE_LIMITS.aiDraft)
    if (!userLimit.success) return rateLimitResponse(userLimit)
    // Also cap the whole team's draws on the shared BYO provider key.
    const accountLimit = checkRateLimit(
      `ai-draft-acct:${accountId}`,
      RATE_LIMITS.aiDraftAccount,
    )
    if (!accountLimit.success) return rateLimitResponse(accountLimit)

    const body = await request.json().catch(() => null)
    const conversationId =
      body && typeof body.conversation_id === 'string' ? body.conversation_id : ''
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 },
      )
    }

    // RLS scopes the SSR client to the caller's account, so a missing
    // row means "not yours / not found" either way.
    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('id, contact_id')
      .eq('id', conversationId)
      .maybeSingle()
    if (convErr) {
      console.error('[ai/draft] conversation lookup error:', convErr)
      return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 })
    }
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // The provider key column is no longer SELECT-able by the
    // authenticated role (migration 038 — B5), so read the config with
    // the service-role client, scoped to the session's own accountId.
    const config = await loadAiConfig(supabaseAdmin(), accountId).catch((err) => {
      // Decrypt failure — surface distinctly from "not configured".
      console.error('[ai/draft] loadAiConfig error:', err)
      throw new AiError('Stored API key could not be decrypted.', {
        code: 'key_decrypt_failed',
        status: 400,
      })
    })
    if (!config) {
      return NextResponse.json(
        {
          error: 'AI assistant is not set up. Enable it in Settings → AI Assistant.',
          code: 'ai_not_configured',
        },
        { status: 400 },
      )
    }

    const messages = await buildConversationContext(supabase, conversationId)
    // Nothing to draft from — a brand-new thread with no customer text
    // would otherwise produce a nonsensical reply-to-nothing.
    if (messages.length === 0) {
      return NextResponse.json(
        {
          error: 'No messages to draft from yet.',
          code: 'no_messages',
        },
        { status: 400 },
      )
    }

    const query = retrievalQuery(messages)
    const [ctx, crmParts] = await Promise.all([
      buildAgentContext({
        db: supabase,
        accountId,
        config,
        queryText: query,
        contactId: conversation.contact_id,
      }),
      buildCrmContext(supabase, accountId, conversation.contact_id),
    ])

    const systemPrompt = buildSystemPrompt({
      userPrompt: config.systemPrompt,
      conversationExamples: config.conversationExamples,
      mode: 'draft',
      locale: resolvePromptLocale(config.promptLocale),
      knowledge: ctx.knowledge,
      memory: ctx.memory,
      skills: ctx.skills,
      crmContext: formatCrmContextBlock(crmParts),
    })

    const startedAt = Date.now()
    let text: string
    let usage
    try {
      ;({ text, usage } = await generateReply({ config, systemPrompt, messages }))
    } catch (genErr) {
      await logGeneration({
        accountId,
        conversationId,
        mode: 'draft',
        provider: config.provider,
        model: config.model,
        latencyMs: Date.now() - startedAt,
        outcome: 'error',
        errorCode: genErr instanceof AiError ? genErr.code : 'unknown',
      })
      throw genErr
    }

    await logGeneration({
      accountId,
      conversationId,
      mode: 'draft',
      provider: config.provider,
      model: config.model,
      usage,
      latencyMs: Date.now() - startedAt,
      outcome: 'draft',
    })

    // Record spend on the account's BYO key without delaying the draft.
    try {
      void logAiUsage(supabaseAdmin(), {
        accountId,
        conversationId,
        mode: 'draft',
        provider: config.provider,
        model: config.model,
        usage,
      })
    } catch (logErr) {
      console.error('[ai/draft] usage log skipped:', logErr)
    }

    return NextResponse.json({ draft: text })
  } catch (err) {
    if (err instanceof AiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return toErrorResponse(err)
  }
}
