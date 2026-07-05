import type { SupabaseClient } from '@supabase/supabase-js'
import {
  extractMemoryFromConversation,
  findConversationsForExtract,
} from './memory-extract'

export interface ConsolidateResult {
  processed: number
  inserted: number
  proposed: number
  skipped: number
}

/**
 * Analyze idle conversations and propose memory candidates (pending).
 * Used by the cron endpoint and tests.
 */
export async function runMemoryConsolidation(
  db: SupabaseClient,
  options?: { idleMinutes?: number; limit?: number },
): Promise<ConsolidateResult> {
  const idleMinutes = options?.idleMinutes ?? 30
  const limit = options?.limit ?? 20

  const conversations = await findConversationsForExtract(db, idleMinutes, limit)

  const result: ConsolidateResult = {
    processed: 0,
    inserted: 0,
    proposed: 0,
    skipped: 0,
  }

  for (const conv of conversations) {
    try {
      const extract = await extractMemoryFromConversation(
        db,
        conv.account_id,
        conv.id,
        conv.contact_id,
      )
      result.processed++
      result.inserted += extract.inserted
      result.proposed += extract.proposed
      result.skipped += extract.skipped
    } catch (err) {
      console.error('[ai memory consolidate] extract failed:', conv.id, err)
    }
  }

  return result
}
