import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { extractMemoryFromConversation } from '@/lib/ai/memory-extract'

/**
 * POST /api/ai/memory/extract  (admin+)
 *
 * Body: { conversation_id }
 * Proposes memory candidates from one conversation (status=pending).
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')
    const limit = checkRateLimit(`ai-memory-extract:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json().catch(() => null)
    const conversationId =
      typeof body?.conversation_id === 'string' ? body.conversation_id.trim() : ''
    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })
    }

    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('id, contact_id')
      .eq('id', conversationId)
      .maybeSingle()

    if (convErr) {
      console.error('[ai/memory/extract] lookup error:', convErr)
      return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 })
    }
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const result = await extractMemoryFromConversation(
      supabase,
      accountId,
      conversationId,
      conversation.contact_id,
    )

    return NextResponse.json({
      success: true,
      proposed: result.proposed,
      inserted: result.inserted,
      skipped: result.skipped,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
