import { NextResponse } from 'next/server'
import {
  getCurrentAccount,
  requireRole,
  toErrorResponse,
} from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/ai/skills — list skills for the account (any member).
 */
export async function GET() {
  try {
    const { supabase, accountId } = await getCurrentAccount()
    const { data, error } = await supabase
      .from('ai_agent_skills')
      .select(
        'id, name, description, trigger_hint, instructions, is_active, priority, created_at, updated_at',
      )
      .eq('account_id', accountId)
      .order('priority', { ascending: false })
    if (error) {
      console.error('[ai/skills GET] error:', error)
      return NextResponse.json({ error: 'Failed to load skills' }, { status: 500 })
    }
    return NextResponse.json({ skills: data ?? [] })
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * POST /api/ai/skills  (admin+) — create a skill.
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')
    const limit = checkRateLimit(`ai-skills:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const triggerHint =
      typeof body?.trigger_hint === 'string' ? body.trigger_hint.trim() : ''
    const instructions =
      typeof body?.instructions === 'string' ? body.instructions.trim() : ''
    const description =
      typeof body?.description === 'string' ? body.description.trim() : null
    const priority =
      typeof body?.priority === 'number' && Number.isFinite(body.priority)
        ? Math.floor(body.priority)
        : 0
    const isActive = body?.is_active !== false

    if (!name || !triggerHint || !instructions) {
      return NextResponse.json(
        { error: 'name, trigger_hint and instructions are required' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('ai_agent_skills')
      .insert({
        account_id: accountId,
        name,
        description: description || null,
        trigger_hint: triggerHint,
        instructions,
        is_active: isActive,
        priority,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[ai/skills POST] error:', error)
      return NextResponse.json({ error: 'Failed to save skill' }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return toErrorResponse(err)
  }
}
