import type { SupabaseClient } from '@supabase/supabase-js'

export type MemoryKind = 'fact' | 'preference' | 'objection' | 'note'
export type MemorySource = 'manual' | 'extracted' | 'import'
export type MemoryStatus = 'pending' | 'approved' | 'rejected' | 'archived'

export interface AgentMemoryRow {
  id: string
  account_id: string
  contact_id: string | null
  kind: MemoryKind
  content: string
  source: MemorySource
  status: MemoryStatus
  created_at: string
  updated_at: string
}

interface MatchRow {
  id: string
  content: string
}

/**
 * Retrieve approved memory excerpts relevant to the customer's message.
 * Uses FTS when the query has terms; falls back to recent account-wide
 * memories for the contact when FTS returns nothing (best-effort).
 */
export async function retrieveMemory(
  db: SupabaseClient,
  accountId: string,
  queryText: string,
  contactId?: string | null,
  k = 5,
): Promise<string[]> {
  const query = queryText.trim()
  if (!query || k <= 0) return []

  try {
    const { count, error } = await db
      .from('ai_agent_memory')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('status', 'approved')
    if (error || !count) return []
  } catch {
    return []
  }

  const picked = new Map<string, string>()

  try {
    const { data, error } = await db.rpc('match_ai_agent_memory_fts', {
      p_account_id: accountId,
      p_query: query,
      p_contact_id: contactId ?? null,
      p_match_count: k,
    })
    if (!error && Array.isArray(data)) {
      for (const row of data as MatchRow[]) picked.set(row.id, row.content)
    }
  } catch (err) {
    console.error('[ai memory] FTS retrieval failed:', err)
  }

  // Fallback: recent approved memories scoped to contact + account-wide.
  if (picked.size < k && contactId) {
    try {
      const { data, error } = await db
        .from('ai_agent_memory')
        .select('id, content')
        .eq('account_id', accountId)
        .eq('status', 'approved')
        .or(`contact_id.is.null,contact_id.eq.${contactId}`)
        .order('updated_at', { ascending: false })
        .limit(k)
      if (!error && data) {
        for (const row of data as MatchRow[]) {
          if (picked.size >= k) break
          if (!picked.has(row.id)) picked.set(row.id, row.content)
        }
      }
    } catch (err) {
      console.error('[ai memory] fallback retrieval failed:', err)
    }
  }

  return Array.from(picked.values()).slice(0, k)
}
