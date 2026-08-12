import type { KeywordMatchTriggerConfig } from '@/types'

/**
 * Pure keyword_match predicate — does this trigger config match the
 * inbound text? Lives in its own dependency-free module because both
 * the automations engine and the AI auto-reply gate use it: the AI
 * stands down only when a keyword automation will actually answer this
 * message, not merely because one exists.
 */
export function keywordConfigMatches(
  cfg: KeywordMatchTriggerConfig | null | undefined,
  text: string,
): boolean {
  if (!cfg?.keywords || cfg.keywords.length === 0) return false
  if (!text) return false
  const haystack = cfg.case_sensitive ? text : text.toLowerCase()
  return cfg.keywords.some((raw) => {
    const k = cfg.case_sensitive ? raw : raw.toLowerCase()
    return cfg.match_type === 'exact' ? haystack === k : haystack.includes(k)
  })
}
