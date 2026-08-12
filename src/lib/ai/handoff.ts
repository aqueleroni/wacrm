import type { ChatMessage } from './types'

/** Longest the quoted customer message runs before we ellipsize it —
 *  keeps the internal note to a glanceable one-liner. */
const MAX_QUOTE_LEN = 160

/**
 * Build the short internal note the auto-reply bot leaves on a
 * conversation when it hands off to a human. Deterministic — composed
 * from context we already have (no extra LLM call / token spend), so it
 * can't fail or add latency to the handoff.
 *
 * Reads as, e.g.:
 *   "🤖 AI agent handed off after 2 replies. Last customer message:
 *    “can I speak to a manager about my refund?”"
 *
 * Or when the per-conversation reply cap is hit:
 *   "🤖 AI agent reached the reply limit (3) and handed off to a human…"
 *
 * `replyCount` is the bot's auto-reply tally for the thread (0 when it
 * bailed on the very first inbound without answering).
 */
export function buildHandoffSummary(args: {
  messages: ChatMessage[]
  replyCount: number
  /** Why the bot handed off — defaults to model-initiated. */
  reason?: 'model' | 'max_replies'
}): string {
  const { messages, replyCount, reason = 'model' } = args

  const lastCustomer = [...messages]
    .reverse()
    .find((m) => m.role === 'user' && m.content.trim())

  let base: string
  if (reason === 'max_replies') {
    const n = replyCount
    const replies =
      n === 1 ? '1 reply' : `${n} replies`
    base = `🤖 AI agent reached the reply limit (${replies}) and handed off to a human.`
  } else {
    const replies =
      replyCount === 0
        ? 'without replying'
        : `after ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
    base = `🤖 AI agent handed off ${replies}.`
  }

  if (!lastCustomer) return base

  const quote = truncate(lastCustomer.content.trim(), MAX_QUOTE_LEN)
  return `${base} Last customer message: “${quote}”`
}

function truncate(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, ' ')
  if (collapsed.length <= max) return collapsed
  return `${collapsed.slice(0, max - 1).trimEnd()}…`
}
