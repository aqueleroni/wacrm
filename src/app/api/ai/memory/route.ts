import { NextResponse } from 'next/server'
import {
  getCurrentAccount,
  requireRole,
  toErrorResponse,
} from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import type { MemoryKind, MemorySource, MemoryStatus } from '@/lib/ai/memory'

const KINDS: MemoryKind[] = ['fact', 'preference', 'objection', 'note']
const STATUSES: MemoryStatus[] = ['pending', 'approved', 'rejected', 'archived']

/**
 * GET /api/ai/memory — list memories for the account (any member).
 */
export async function GET(request: Request) {
  try {
    const { supabase, accountId } = await getCurrentAccount()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    let query = supabase
      .from('ai_agent_memory')
      .select(
        'id, contact_id, kind, content, source, status, created_at, updated_at',
      )
      .eq('account_id', accountId)
      .order('updated_at', { ascending: false })

    if (status && STATUSES.includes(status as MemoryStatus)) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      console.error('[ai/memory GET] error:', error)
      return NextResponse.json({ error: 'Failed to load memory' }, { status: 500 })
    }
    return NextResponse.json({ memories: data ?? [] })
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * POST /api/ai/memory  (admin+) — create a manual memory entry.
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')
    const limit = checkRateLimit(`ai-memory:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim() : ''
    const kind = KINDS.includes(body?.kind) ? body.kind : 'fact'
    const status: MemoryStatus =
      body?.status === 'pending' ? 'pending' : 'approved'
    const contactId =
      typeof body?.contact_id === 'string' && body.contact_id.trim()
        ? body.contact_id.trim()
        : null

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_agent_memory')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        kind,
        content,
        source: 'manual' satisfies MemorySource,
        status,
        created_by: userId,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[ai/memory POST] error:', error)
      return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return toErrorResponse(err)
  }
}
