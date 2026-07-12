// ============================================================
// Shared types for the AI reply assistant (bring-your-own-key).
//
// One small provider-agnostic surface so the inbox draft route and the
// inbound auto-reply bot both talk to `generateReply` without caring
// whether the account is on OpenAI or Anthropic.
// ============================================================

export type AiProvider = 'openai' | 'anthropic'

/**
 * Account AI setup, decrypted and ready to use. Produced by
 * `loadAiConfig` — `apiKey` is the plaintext BYO provider key
 * (stored AES-256-GCM-encrypted at rest).
 */
export interface AiConfig {
  provider: AiProvider
  model: string
  apiKey: string
  systemPrompt: string | null
  isActive: boolean
  autoReplyEnabled: boolean
  autoReplyMaxPerConversation: number
  /** Where auto-reply hands a conversation off when the model bails: an
   *  agent's `auth.users.id`, or null to leave it unassigned (drop into
   *  the shared queue). */
  handoffAgentId: string | null
  /** Optional OpenAI-compatible key for embeddings. When set, the
   *  knowledge base is embedded and semantic retrieval turns on; when
   *  null, retrieval falls back to lexical full-text search. */
  embeddingsApiKey: string | null
  /** Optional few-shot examples (tone/format) appended after persona. */
  conversationExamples: string | null
  /** Per-account prompt-scaffold language; null falls back to the
   *  deploy default (AI_PROMPT_LOCALE). */
  promptLocale: 'pt-BR' | 'en' | null
}

/** A single conversation turn in the shape both providers accept. */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Token counts for one provider call, normalized across OpenAI
 * (`prompt`/`completion`) and Anthropic (`input`/`output`). Null when
 * the provider didn't return usage. Logged to `ai_usage_log` and
 * mapped into `ai_generation_logs`.
 */
export interface AiUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/** @deprecated Prefer AiUsage — kept as an alias for generation-log callers. */
export type TokenUsage = {
  inputTokens: number | null
  outputTokens: number | null
}

export function toTokenUsage(usage: AiUsage | null | undefined): TokenUsage | null {
  if (!usage) return null
  return {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
  }
}

/** Raw text + usage a provider adapter returns before handoff parsing. */
export interface ProviderResult {
  text: string
  usage: AiUsage | null
}

/** Outcome of a generation call. */
export interface GenerateResult {
  /** The reply text, with any handoff sentinel stripped. */
  text: string
  /** True when the model asked to hand off to a human (auto-reply mode). */
  handoff: boolean
  /** Provider token usage for this call, or null when unavailable. */
  usage: AiUsage | null
}

/**
 * Typed error for every AI failure mode. `status` maps cleanly to an
 * HTTP response in the draft route; `code` lets the UI/tests branch
 * (invalid_key vs rate_limited vs timeout, etc.).
 */
export class AiError extends Error {
  readonly code: string
  readonly status: number
  /** True when the failure is transient (429 / provider 5xx / network
   *  blip) and the same request is worth retrying. Never true for
   *  invalid_key or malformed-request failures. */
  readonly retryable: boolean
  /** Provider-suggested wait before retrying (from `Retry-After`). */
  readonly retryAfterMs?: number
  constructor(
    message: string,
    opts: {
      code?: string
      status?: number
      retryable?: boolean
      retryAfterMs?: number
    } = {},
  ) {
    super(message)
    this.name = 'AiError'
    this.code = opts.code ?? 'ai_error'
    this.status = opts.status ?? 502
    this.retryable = opts.retryable ?? false
    this.retryAfterMs = opts.retryAfterMs
  }
}
