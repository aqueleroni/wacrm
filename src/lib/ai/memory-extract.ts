import type { SupabaseClient } from '@supabase/supabase-js'
import { loadAiConfig } from './config'
import { buildConversationContext } from './context'
import { generateReply } from './generate'
import type { MemoryKind } from './memory'

export interface ExtractedMemory {
  kind: MemoryKind
  content: string
  contactScoped: boolean
}

const VALID_KINDS: MemoryKind[] = ['fact', 'preference', 'objection', 'note']

/** Heuristic: never auto-approve these — they stay pending for humans. */
const SENSITIVE_PATTERN =
  /\b(preço|preco|valor|R\$|desconto|orçamento|orcamento|garantia|roi|%\s|promet|pacote fechado)\b/i

const EXTRACT_SYSTEM = `You analyze WhatsApp conversations between a business and a customer.
Extract 0 to 3 durable facts worth remembering for future customer support.

Output ONLY valid JSON with this exact shape:
{"memories":[{"kind":"fact|preference|objection|note","content":"...","contact_scoped":true}]}

Rules:
- kind: fact (objective info), preference (likes/dislikes), objection (concerns), note (misc context)
- content: one concise sentence in the same language as the conversation
- contact_scoped: true if the fact applies only to this customer; false if useful for all customers
- Only include facts clearly stated or strongly implied — never invent
- Never extract prices, discounts, delivery dates, guarantees, ROI, or commercial promises
- If the thread is only greetings with no substance, return {"memories":[]}
- Do not include instructions to the assistant — only factual memory candidates`

export function parseExtractedMemories(raw: string): ExtractedMemory[] {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      memories?: unknown[]
    }
    if (!Array.isArray(parsed.memories)) return []

    const out: ExtractedMemory[] = []
    for (const item of parsed.memories) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const kind = row.kind
      const content = typeof row.content === 'string' ? row.content.trim() : ''
      if (!content || !VALID_KINDS.includes(kind as MemoryKind)) continue
      out.push({
        kind: kind as MemoryKind,
        content,
        contactScoped: row.contact_scoped !== false,
      })
    }
    return out.slice(0, 3)
  } catch {
    return []
  }
}

export function isSensitiveMemory(content: string): boolean {
  return SENSITIVE_PATTERN.test(content)
}

export interface ExtractResult {
  proposed: number
  inserted: number
  skipped: number
}

/**
 * Analyze a conversation and insert memory candidates as `pending`.
 * The agent never writes approved memory directly — humans approve in UI.
 */
export async function extractMemoryFromConversation(
  db: SupabaseClient,
  accountId: string,
  conversationId: string,
  contactId: string | null,
): Promise<ExtractResult> {
  const result: ExtractResult = { proposed: 0, inserted: 0, skipped: 0 }

  const config = await loadAiConfig(db, accountId, { requireActive: false })
  if (!config) return result

  const messages = await buildConversationContext(db, conversationId, 40)
  const customerTurns = messages.filter((m) => m.role === 'user').length
  if (customerTurns < 2) {
    await markExtracted(db, conversationId)
    return result
  }

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Business'}: ${m.content}`)
    .join('\n')

  const { text } = await generateReply({
    config,
    systemPrompt: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content: transcript }],
  })

  const candidates = parseExtractedMemories(text)
  result.proposed = candidates.length

  for (const candidate of candidates) {
    if (isSensitiveMemory(candidate.content)) {
      result.skipped++
      continue
    }

    const dup = await hasSimilarMemory(
      db,
      accountId,
      contactId,
      candidate.content,
    )
    if (dup) {
      result.skipped++
      continue
    }

    const { error } = await db.from('ai_agent_memory').insert({
      account_id: accountId,
      contact_id: candidate.contactScoped ? contactId : null,
      kind: candidate.kind,
      content: candidate.content,
      source: 'extracted',
      status: 'pending',
    })
    if (error) {
      console.error('[ai memory extract] insert failed:', error)
      result.skipped++
      continue
    }
    result.inserted++
  }

  await markExtracted(db, conversationId)
  return result
}

async function markExtracted(
  db: SupabaseClient,
  conversationId: string,
): Promise<void> {
  await db
    .from('conversations')
    .update({ ai_memory_extracted_at: new Date().toISOString() })
    .eq('id', conversationId)
}

async function hasSimilarMemory(
  db: SupabaseClient,
  accountId: string,
  contactId: string | null,
  content: string,
): Promise<boolean> {
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim()
  const { data } = await db
    .from('ai_agent_memory')
    .select('content')
    .eq('account_id', accountId)
    .in('status', ['pending', 'approved'])
    .limit(50)

  if (!data?.length) return false
  return data.some((row) => {
    const existing = (row.content as string).toLowerCase().replace(/\s+/g, ' ').trim()
    return existing === normalized || existing.includes(normalized) || normalized.includes(existing)
  })
}

/** Find idle conversations eligible for automatic extraction. */
export async function findConversationsForExtract(
  db: SupabaseClient,
  idleMinutes = 30,
  limit = 20,
): Promise<{ id: string; account_id: string; contact_id: string | null }[]> {
  const cutoff = new Date(Date.now() - idleMinutes * 60_000).toISOString()

  const { data: configs } = await db
    .from('ai_configs')
    .select('account_id')
    .eq('memory_auto_extract', true)
    .eq('is_active', true)

  const accountIds = (configs ?? []).map((c) => c.account_id as string)
  if (accountIds.length === 0) return []

  const { data, error } = await db
    .from('conversations')
    .select('id, account_id, contact_id, updated_at, ai_memory_extracted_at')
    .in('account_id', accountIds)
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(limit * 3)

  if (error || !data) return []

  return data
    .filter((c) => {
      if (!c.ai_memory_extracted_at) return true
      return new Date(c.updated_at as string) > new Date(c.ai_memory_extracted_at as string)
    })
    .slice(0, limit)
    .map((c) => ({
      id: c.id as string,
      account_id: c.account_id as string,
      contact_id: (c.contact_id as string | null) ?? null,
    }))
}
