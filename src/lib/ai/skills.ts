import type { SupabaseClient } from '@supabase/supabase-js'

export interface AgentSkillRow {
  id: string
  account_id: string
  name: string
  description: string | null
  trigger_hint: string
  instructions: string
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface MatchedSkill {
  id: string
  name: string
  instructions: string
}

/**
 * Match active skills against the customer's message. v1: keyword overlap
 * on comma/semicolon-separated trigger hints, ordered by priority then score.
 */
export async function matchSkills(
  db: SupabaseClient,
  accountId: string,
  queryText: string,
  max = 2,
): Promise<MatchedSkill[]> {
  const query = queryText.trim().toLowerCase()
  if (!query || max <= 0) return []

  try {
    const { data, error } = await db
      .from('ai_agent_skills')
      .select('id, name, trigger_hint, instructions, priority')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
    if (error || !data?.length) return []

    const scored = (data as Pick<
      AgentSkillRow,
      'id' | 'name' | 'trigger_hint' | 'instructions' | 'priority'
    >[])
      .map((skill) => {
        const triggers = skill.trigger_hint
          .split(/[,;\n]+/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
        let score = 0
        for (const trigger of triggers) {
          if (query.includes(trigger)) score += trigger.length
        }
        return { skill, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.skill.priority - a.skill.priority)

    return scored.slice(0, max).map(({ skill }) => ({
      id: skill.id,
      name: skill.name,
      instructions: skill.instructions,
    }))
  } catch (err) {
    console.error('[ai skills] match failed:', err)
    return []
  }
}
