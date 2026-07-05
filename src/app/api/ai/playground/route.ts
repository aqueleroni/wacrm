import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { loadAiConfig } from '@/lib/ai/config'
import { supabaseAdmin } from '@/lib/ai/admin-client'
import { buildAgentContext } from '@/lib/ai/agent-context'
import { buildCrmContext, formatCrmContextBlock } from '@/lib/ai/crm-context'
import { generateReply } from '@/lib/ai/generate'
import { buildSystemPrompt, resolvePromptLocale } from '@/lib/ai/defaults'
import { retrievalQuery } from '@/lib/ai/query'
import { logGeneration } from '@/lib/ai/generation-log'
import { AiError, type ChatMessage } from '@/lib/ai/types'

// Keep the tested transcript bounded, mirroring the live context window.
const MAX_TURNS = 20

/**
 * POST /api/ai/playground  (agent+)
 *
 * Test-chat with the account's agent WITHOUT touching WhatsApp. Runs the
 * exact same path the auto-reply bot uses — knowledge-base retrieval +
 * `auto_reply` system prompt + the configured provider — so what you see
 * here is what a real customer would get. Reads the config even when the
 * master switch is off (requireActive:false) so you can try it before
 * going live. Stateless: the client sends the running transcript each turn.
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('agent')

    const limit = checkRateLimit(`ai-playground:${userId}`, RATE_LIMITS.aiDraft)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json().catch(() => null)
    const rawMessages = Array.isArray(body?.messages) ? body.messages : null
    if (!rawMessages) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 })
    }

    const messages: ChatMessage[] = rawMessages
      .filter(
        (m: unknown): m is ChatMessage =>
          !!m &&
          typeof m === 'object' &&
          ((m as ChatMessage).role === 'user' ||
            (m as ChatMessage).role === 'assistant') &&
          typeof (m as ChatMessage).content === 'string' &&
          (m as ChatMessage).content.trim().length > 0,
      )
      .slice(-MAX_TURNS)

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Send a message to test the agent.' },
        { status: 400 },
      )
    }

    // Service-role read: the provider key column is not SELECT-able by
    // the authenticated role after migration 038 (B5). Scoped to the
    // session's own accountId.
    const config = await loadAiConfig(supabaseAdmin(), accountId, {
      requireActive: false,
    }).catch((err) => {
      console.error('[ai/playground] loadAiConfig error:', err)
      throw new AiError('Stored API key could not be decrypted.', {
        code: 'key_decrypt_failed',
        status: 400,
      })
    })
    if (!config) {
      return NextResponse.json(
        {
          error: 'No agent configured yet. Add your provider key in Setup.',
          code: 'ai_not_configured',
        },
        { status: 400 },
      )
    }

    const contactId =
      typeof body?.contact_id === 'string' ? body.contact_id : null

    const query = retrievalQuery(messages)
    const [ctx, crmParts] = await Promise.all([
      buildAgentContext({
        db: supabase,
        accountId,
        config,
        queryText: query,
        contactId,
      }),
      buildCrmContext(supabase, accountId, contactId),
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
      ;({ text, handoff, usage } = await generateReply({ config, systemPrompt, messages }))
    } catch (genErr) {
      await logGeneration({
        accountId,
        mode: 'playground',
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
      mode: 'playground',
      provider: config.provider,
      model: config.model,
      usage,
      latencyMs: Date.now() - startedAt,
      outcome: handoff ? 'handoff' : 'draft',
    })
    return NextResponse.json({ reply: text, handoff })
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
