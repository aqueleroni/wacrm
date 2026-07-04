import type { AiProvider } from './types'
import { getDefaultModel } from './models'
import { getScaffold, promptLocale, type PromptLocale } from './prompt-scaffold'

// ============================================================
// Tunables + prompt scaffold for the AI reply assistant.
// ============================================================

/**
 * Sentinel the model is instructed to emit (in auto-reply mode) when it
 * can't confidently help and a human should take over. Parsed and
 * stripped by `generateReply`.
 */
export const HANDOFF_SENTINEL = '[[HANDOFF]]'

export { promptLocale }
export type { PromptLocale }

/** Default model per provider — mirrors the recommended pick in `models.ts`. */
export const AI_PROVIDER_DEFAULT_MODEL: Record<AiProvider, string> = {
  openai: getDefaultModel('openai'),
  anthropic: getDefaultModel('anthropic'),
}

/** Cap on generated reply length — keeps WhatsApp replies short and
 *  bounds token spend on the caller's own key. */
export const MAX_OUTPUT_TOKENS = 1024

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000
const DEFAULT_CONTEXT_MESSAGE_LIMIT = 20

/** Per-call provider timeout. Override with `AI_REQUEST_TIMEOUT_MS`. */
export function aiRequestTimeoutMs(): number {
  const raw = Number(process.env.AI_REQUEST_TIMEOUT_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_REQUEST_TIMEOUT_MS
}

/** How many recent text messages to feed the model. Override with
 *  `AI_CONTEXT_MESSAGE_LIMIT`. */
export function aiContextMessageLimit(): number {
  const raw = Number(process.env.AI_CONTEXT_MESSAGE_LIMIT)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_CONTEXT_MESSAGE_LIMIT
}

/**
 * Build the system prompt shared by draft + auto-reply.
 * Persona (userPrompt) leads when present; scaffold is locale-aware (pt-BR default).
 */
export function buildSystemPrompt(args: {
  userPrompt: string | null
  mode: 'draft' | 'auto_reply'
  conversationExamples?: string | null
  locale?: PromptLocale
  knowledge?: string[]
  memory?: string[]
  skills?: { name: string; instructions: string }[]
  /** CRM block — contact profile, tags, deals (Etapa 3). */
  crmContext?: string | null
}): string {
  const {
    userPrompt,
    mode,
    conversationExamples,
    locale = promptLocale(),
    knowledge,
    memory,
    skills,
    crmContext,
  } = args
  const s = getScaffold(locale)
  const parts: string[] = []

  if (userPrompt?.trim()) {
    parts.push(`${s.personaHeading}\n${userPrompt.trim()}`)
  }

  parts.push(s.role, s.guidelines, s.safety)

  if (conversationExamples?.trim()) {
    parts.push(`${s.examplesHeading}\n\n${conversationExamples.trim()}`)
  }

  if (crmContext?.trim()) {
    parts.push(crmContext.trim())
  }

  if (mode === 'auto_reply') {
    parts.push(s.autoReplyHandoff(HANDOFF_SENTINEL))
  }

  if (knowledge && knowledge.length > 0) {
    const fallback =
      mode === 'auto_reply'
        ? s.knowledgeFallbackAuto(HANDOFF_SENTINEL)
        : s.knowledgeFallbackDraft
    parts.push(
      `${s.knowledgeHeading} ${fallback}.\n\n${knowledge
        .map((k, i) => `[${i + 1}] ${k}`)
        .join('\n\n---\n\n')}`,
    )
  }

  if (memory && memory.length > 0) {
    parts.push(
      `${s.memoryHeading}\n\n${memory.map((m, i) => `[${i + 1}] ${m}`).join('\n')}`,
    )
  }

  if (skills && skills.length > 0) {
    parts.push(
      `${s.skillsHeading}\n\n${skills
        .map((sk, i) => `[Skill ${i + 1}: ${sk.name}]\n${sk.instructions.trim()}`)
        .join('\n\n---\n\n')}`,
    )
  }

  return parts.join('\n\n')
}
