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

  // Small concurrent batches instead of fully serial: each extraction
  // is an LLM call (~2-5s), and 20 in series would flirt with the cron
  // invocation's timeout. One failed item never aborts the batch.
  const BATCH_SIZE = 4
  for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
    const batch = conversations.slice(i, i + BATCH_SIZE)
    const settled = await Promise.allSettled(
      batch.map((conv) =>
        extractMemoryFromConversation(db, conv.account_id, conv.id, conv.contact_id),
      ),
    )
    settled.forEach((outcome, j) => {
      if (outcome.status === 'fulfilled') {
        result.processed++
        result.inserted += outcome.value.inserted
        result.proposed += outcome.value.proposed
        result.skipped += outcome.value.skipped
      } else {
        console.error(
          '[ai memory consolidate] extract failed:',
          batch[j].id,
          outcome.reason,
        )
      }
    })
  }

  return result
}
