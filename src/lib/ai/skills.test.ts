import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { matchSkills } from './skills'

type SkillRow = {
  id: string
  name: string
  trigger_hint: string
  instructions: string
  priority: number
}

/** Minimal db stub returning a fixed active-skills list for the account. */
function dbWith(rows: SkillRow[]): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

const SKILL: SkillRow = {
  id: 's1',
  name: 'Promo',
  trigger_hint: 'promo, cupom',
  instructions: 'Oferecer o cupom ativo.',
  priority: 1,
}

describe('matchSkills — word-boundary matching', () => {
  it('matches a whole-word trigger', async () => {
    const out = await matchSkills(dbWith([SKILL]), 'acc', 'tem promo hoje?')
    expect(out.map((s) => s.id)).toEqual(['s1'])
  })

  it('does NOT fire on a substring inside another word', async () => {
    // "promo" must not match inside "compromisso".
    const out = await matchSkills(dbWith([SKILL]), 'acc', 'tenho um compromisso')
    expect(out).toEqual([])
  })

  it('still falls back to substring for non-word triggers (emoji)', async () => {
    const emojiSkill: SkillRow = { ...SKILL, id: 's2', trigger_hint: '🔥' }
    const out = await matchSkills(dbWith([emojiSkill]), 'acc', 'promo 🔥 agora')
    expect(out.map((s) => s.id)).toEqual(['s2'])
  })

  it('returns [] for an empty query', async () => {
    expect(await matchSkills(dbWith([SKILL]), 'acc', '   ')).toEqual([])
  })
})
