import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/ai/admin-client'
import { runMemoryConsolidation } from '@/lib/ai/memory-consolidate'

function authorizeCron(request: Request): NextResponse | null {
  const expected = process.env.AUTOMATION_CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'cron not configured' }, { status: 503 })
  }
  const supplied = request.headers.get('x-cron-secret') ?? ''
  const suppliedBuf = Buffer.from(supplied)
  const expectedBuf = Buffer.from(expected)
  if (
    suppliedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(suppliedBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * GET/POST /api/ai/cron/consolidate
 *
 * Analyzes idle conversations (30 min+) for accounts with
 * `memory_auto_extract` enabled and proposes memory rows as pending.
 *
 * Auth: x-cron-secret header matching AUTOMATION_CRON_SECRET.
 * Schedule alongside /api/automations/cron and /api/flows/cron.
 */
async function handleConsolidate(request: Request) {
  const denied = authorizeCron(request)
  if (denied) return denied

  const db = supabaseAdmin()
  const result = await runMemoryConsolidation(db)

  return NextResponse.json({
    processed: result.processed,
    inserted: result.inserted,
    proposed: result.proposed,
    skipped: result.skipped,
  })
}

export async function GET(request: Request) {
  return handleConsolidate(request)
}

export async function POST(request: Request) {
  return handleConsolidate(request)
}
