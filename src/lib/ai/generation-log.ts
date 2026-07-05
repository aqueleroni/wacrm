import { supabaseAdmin } from './admin-client'
import type { TokenUsage } from './types'

export type GenerationMode = 'draft' | 'auto_reply' | 'playground'
export type GenerationOutcome = 'sent' | 'draft' | 'handoff' | 'error'

export interface GenerationLogInput {
  accountId: string
  conversationId?: string | null
  mode: GenerationMode
  provider: string
  model: string
  usage?: TokenUsage | null
  latencyMs: number
  outcome: GenerationOutcome
  errorCode?: string | null
}

/**
 * Append one row to `ai_generation_logs`. Best-effort observability:
 * written by the service role (works from the auth-less webhook too) and
 * NEVER throws — a logging failure must not affect the reply path.
 * Callers await it (a single cheap insert) so it reliably flushes even
 * in serverless, where a detached promise can be frozen after the
 * response returns.
 */
export async function logGeneration(input: GenerationLogInput): Promise<void> {
  try {
    await supabaseAdmin()
      .from('ai_generation_logs')
      .insert({
        account_id: input.accountId,
        conversation_id: input.conversationId ?? null,
        mode: input.mode,
        provider: input.provider,
        model: input.model,
        input_tokens: input.usage?.inputTokens ?? null,
        output_tokens: input.usage?.outputTokens ?? null,
        latency_ms: input.latencyMs,
        outcome: input.outcome,
        error_code: input.errorCode ?? null,
      })
  } catch (err) {
    console.error('[ai generation-log] insert failed:', err)
  }
}
