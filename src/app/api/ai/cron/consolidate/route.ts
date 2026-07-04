import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/ai/admin-client'
import {
  extractMemoryFromConversation,
  findConversationsForExtract,
} from '@/lib/ai/memory-extract'

/**
 * POST /api/ai/cron/consolidate
 *
 * Analyzes idle conversations and proposes memory candidates (pending).
 * Auth: x-cron-secret header matching AUTOMATION_CRON_SECRET.
 */
export async function POST(request: Request) {
  const expected = process.env.AUTOMATION_CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'cron not configured' }, { status: 503 })
  }
  const supplied = request.headers.get('x-cron-secret')
  if (supplied !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const conversations = await findConversationsForExtract(db)

  let processed = 0
  let inserted = 0

  for (const conv of conversations) {
    try {
      const result = await extractMemoryFromConversation(
        db,
        conv.account_id,
        conv.id,
        conv.contact_id,
      )
      processed++
      inserted += result.inserted
    } catch (err) {
      console.error('[ai/cron/consolidate] extract failed:', conv.id, err)
    }
  }

  return NextResponse.json({ processed, inserted, candidates: inserted })
}
