import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import type { MemoryKind, MemoryStatus } from '@/lib/ai/memory'
import { invalidatePresence } from '@/lib/ai/presence-cache'

type Params = { params: Promise<{ id: string }> }

const KINDS: MemoryKind[] = ['fact', 'preference', 'objection', 'note']
const STATUSES: MemoryStatus[] = ['pending', 'approved', 'rejected', 'archived']

/**
 * PATCH /api/ai/memory/[id]  (admin+) — edit or change status.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')
    const limit = checkRateLimit(`ai-memory:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const { id } = await params
    const body = await request.json().catch(() => null)
    const update: Record<string, unknown> = {}

    if (typeof body?.content === 'string') {
      const content = body.content.trim()
      if (!content) {
        return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 })
      }
      update.content = content
    }
    if (KINDS.includes(body?.kind)) update.kind = body.kind
    if (STATUSES.includes(body?.status)) update.status = body.status
    if (body?.contact_id === null) update.contact_id = null
    else if (typeof body?.contact_id === 'string' && body.contact_id.trim()) {
      update.contact_id = body.contact_id.trim()
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_agent_memory')
      .update(update)
      .eq('account_id', accountId)
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[ai/memory/[id] PATCH] error:', error)
      return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    invalidatePresence('memory', accountId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * DELETE /api/ai/memory/[id]  (admin+)
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { supabase, accountId } = await requireRole('admin')
    const { id } = await params
    const { error } = await supabase
      .from('ai_agent_memory')
      .delete()
      .eq('account_id', accountId)
      .eq('id', id)
    if (error) {
      console.error('[ai/memory/[id] DELETE] error:', error)
      return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
    }
    invalidatePresence('memory', accountId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
