import type { ChatMessage } from './types'

/**
 * The text to retrieve knowledge against: the most recent customer
 * (`user`) turn in the conversation context. Falls back to the last
 * message of any role, then empty string. Shared by the draft route and
 * the auto-reply bot so both query the knowledge base the same way.
 */
export function latestUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content
  }
  return messages.length > 0 ? messages[messages.length - 1].content : ''
}

/**
 * The text to retrieve against, using the last few customer turns rather
 * than only the last message. A trailing "e o preço?" retrieves nothing
 * on its own; joined with the previous customer turn ("vocês fazem site
 * VTEX?") it grounds the query. Newest-last so the freshest intent reads
 * as the tail of the string. `maxTurns` caps how far back we reach so an
 * old topic doesn't pollute a fresh question.
 */
export function retrievalQuery(messages: ChatMessage[], maxTurns = 3): string {
  const turns: string[] = []
  for (let i = messages.length - 1; i >= 0 && turns.length < maxTurns; i--) {
    if (messages[i].role === 'user') turns.push(messages[i].content)
  }
  if (turns.length === 0) {
    return messages.length > 0 ? messages[messages.length - 1].content : ''
  }
  return turns.reverse().join(' ').trim()
}
