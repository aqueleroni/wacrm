import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatMessage } from './types'
import { aiContextMessageLimit } from './defaults'

interface DbMessage {
  sender_type: 'customer' | 'agent' | 'bot'
  content_type: string | null
  content_text: string | null
}

/** Human-readable label per media content_type (pt-BR — matches the
 *  default prompt locale; a language mismatch in a bracketed hint is
 *  harmless to the model). */
const MEDIA_LABELS: Record<string, string> = {
  image: 'uma imagem',
  video: 'um vídeo',
  audio: 'um áudio',
  document: 'um documento',
  location: 'uma localização',
  template: 'um modelo',
}

/** Content types that carry real text and are fed verbatim. Everything
 *  else is media we can't read and gets a placeholder instead. */
const TEXTUAL_TYPES = new Set(['text', 'interactive'])

/**
 * Render one non-text message as a bracketed placeholder so the model
 * KNOWS media arrived instead of replying into a void. Without this, a
 * customer who sends a photo and asks "tem desse?" looks like they said
 * nothing — the most visible failure of a text-only agent.
 */
function mediaPlaceholder(m: DbMessage): string {
  const label = MEDIA_LABELS[m.content_type ?? ''] ?? 'um anexo'
  const caption = m.content_text?.trim()
  if (m.sender_type === 'customer') {
    return caption
      ? `[o cliente enviou ${label} com a legenda: "${caption}"]`
      : `[o cliente enviou ${label}]`
  }
  return `[o negócio enviou ${label}]`
}

/**
 * Fetch the last N messages of a conversation and map them to the
 * provider-neutral chat shape. Customer messages become `user`; agent
 * and bot messages become `assistant`. Text (and interactive taps) pass
 * through verbatim; media messages become a short bracketed placeholder
 * so the transcript reflects that something non-text was exchanged.
 *
 * Ordered oldest-first (chronological) so the transcript reads
 * naturally and the most recent customer message lands last.
 */
export async function buildConversationContext(
  db: SupabaseClient,
  conversationId: string,
  limit: number = aiContextMessageLimit(),
): Promise<ChatMessage[]> {
  const { data, error } = await db
    .from('messages')
    .select('sender_type, content_type, content_text')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const rows = ((data ?? []) as DbMessage[]).reverse()
  const out: ChatMessage[] = []
  for (const m of rows) {
    const role: ChatMessage['role'] =
      m.sender_type === 'customer' ? 'user' : 'assistant'
    const type = m.content_type ?? 'text'
    if (TEXTUAL_TYPES.has(type)) {
      const text = m.content_text?.trim()
      if (text) out.push({ role, content: text })
    } else {
      out.push({ role, content: mediaPlaceholder(m) })
    }
  }
  return out
}
