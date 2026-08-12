import type { SupabaseClient } from '@supabase/supabase-js'
import type { AiConfig } from './types'
import { retrieveKnowledge } from './knowledge'
import { retrieveMemory } from './memory'
import { matchSkills, type MatchedSkill } from './skills'

export interface AgentContext {
  knowledge: string[]
  memory: string[]
  skills: MatchedSkill[]
}

export interface BuildAgentContextArgs {
  db: SupabaseClient
  accountId: string
  config: Pick<AiConfig, 'embeddingsApiKey'>
  queryText: string
  contactId?: string | null
}

/**
 * Gather all intelligence layers for one reply turn: KB excerpts,
 * approved memories, and matched skills. Best-effort — never throws.
 */
export async function buildAgentContext(
  args: BuildAgentContextArgs,
): Promise<AgentContext> {
  const { db, accountId, config, queryText, contactId } = args

  const [knowledge, memory, skills] = await Promise.all([
    retrieveKnowledge(db, accountId, config, queryText),
    retrieveMemory(db, accountId, queryText, contactId),
    matchSkills(db, accountId, queryText),
  ])

  return { knowledge, memory, skills }
}
