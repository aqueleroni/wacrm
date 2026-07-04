import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/ai/skills/[id]  (admin+)
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')
    const limit = checkRateLimit(`ai-skills:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const { id } = await params
    const body = await request.json().catch(() => null)
    const update: Record<string, unknown> = {}

    if (typeof body?.name === 'string') {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
      }
      update.name = name
    }
    if (typeof body?.description === 'string') {
      update.description = body.description.trim() || null
    }
    if (typeof body?.trigger_hint === 'string') {
      const triggerHint = body.trigger_hint.trim()
      if (!triggerHint) {
        return NextResponse.json(
          { error: 'trigger_hint cannot be empty' },
          { status: 400 },
        )
      }
      update.trigger_hint = triggerHint
    }
    if (typeof body?.instructions === 'string') {
      const instructions = body.instructions.trim()
      if (!instructions) {
        return NextResponse.json(
          { error: 'instructions cannot be empty' },
          { status: 400 },
        )
      }
      update.instructions = instructions
    }
    if (typeof body?.is_active === 'boolean') update.is_active = body.is_active
    if (typeof body?.priority === 'number' && Number.isFinite(body.priority)) {
      update.priority = Math.floor(body.priority)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_agent_skills')
      .update(update)
      .eq('account_id', accountId)
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[ai/skills/[id] PATCH] error:', error)
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * DELETE /api/ai/skills/[id]  (admin+)
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { supabase, accountId } = await requireRole('admin')
    const { id } = await params
    const { error } = await supabase
      .from('ai_agent_skills')
      .delete()
      .eq('account_id', accountId)
      .eq('id', id)
    if (error) {
      console.error('[ai/skills/[id] DELETE] error:', error)
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
