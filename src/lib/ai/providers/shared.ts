import { AiError, type ChatMessage } from '../types'

// ============================================================
// Bits shared by the OpenAI + Anthropic adapters.
// ============================================================

export interface ProviderArgs {
  apiKey: string
  model: string
  systemPrompt: string
  messages: ChatMessage[]
  timeoutMs: number
}

export type { ProviderResult, TokenUsage } from '../types'

/** Map a fetch rejection (timeout / DNS / offline) to a typed AiError. */
export function toNetworkError(err: unknown): AiError {
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    // Not retryable: the attempt already consumed the full time budget,
    // so a retry would double the customer's wait for a likely repeat.
    return new AiError('The AI provider took too long to respond.', {
      code: 'timeout',
      status: 504,
    })
  }
  const msg = err instanceof Error ? err.message : String(err)
  return new AiError(`Could not reach the AI provider: ${msg}`, {
    code: 'network_error',
    status: 502,
    retryable: true,
  })
}

/** Build a typed AiError from a non-2xx provider response, pulling the
 *  provider's own error message out of the JSON body when present. */
export async function providerHttpError(
  provider: string,
  res: Response,
): Promise<AiError> {
  let detail = ''
  try {
    const body = (await res.json()) as { error?: { message?: string } | string }
    detail =
      typeof body?.error === 'string'
        ? body.error
        : (body?.error?.message ?? '')
  } catch {
    // Non-JSON error body — fall back to the status line.
  }

  const { status } = res
  const code =
    status === 401 || status === 403
      ? 'invalid_key'
      : status === 429
        ? 'rate_limited'
        : 'provider_error'
  const base =
    code === 'invalid_key'
      ? `${provider} rejected the API key`
      : code === 'rate_limited'
        ? `${provider} rate limit reached`
        : `${provider} API error (${status})`

  // 429 and 5xx (incl. Anthropic's 529 "overloaded") are transient;
  // other 4xx (bad request, model not found) will fail identically on
  // retry, so don't.
  const retryAfterHeader = Number(res.headers?.get?.('retry-after'))
  return new AiError(detail ? `${base}: ${detail}` : base, {
    code,
    // Surface an auth failure as 401 so the settings "Test key" button
    // can show "invalid key"; everything else is an upstream 502.
    status: code === 'invalid_key' ? 401 : 502,
    retryable: status === 429 || status >= 500,
    retryAfterMs:
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : undefined,
  })
}

/**
 * Run a provider call with up to `retries` extra attempts on transient
 * failures (AiError.retryable: 429 / 5xx / network blip — never
 * invalid_key or malformed requests). Exponential backoff, honoring the
 * provider's `Retry-After` when it asks for longer, capped so a
 * serverless invocation never sleeps excessively. Mirrors what the
 * official SDKs do by default; without it one transient 429/529 kills
 * the draft or auto-reply outright.
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  const MAX_DELAY_MS = 5_000
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (!(err instanceof AiError) || !err.retryable || attempt >= retries) {
        throw err
      }
      const backoff = 500 * 2 ** attempt
      const delay = Math.min(Math.max(backoff, err.retryAfterMs ?? 0), MAX_DELAY_MS)
      await new Promise((resolve) => setTimeout(resolve, delay))
      attempt++
    }
  }
}

/**
 * Collapse consecutive same-role turns into one (joined with blank
 * lines). Anthropic requires strictly alternating roles; merging is
 * also harmless for OpenAI and keeps the transcript compact.
 */
export function mergeConsecutive(messages: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const m of messages) {
    const last = out[out.length - 1]
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`
    } else {
      out.push({ role: m.role, content: m.content })
    }
  }
  return out
}
