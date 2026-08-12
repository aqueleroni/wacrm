import { describe, expect, it, vi } from 'vitest'
import { runMemoryConsolidation } from './memory-consolidate'

vi.mock('./memory-extract', () => ({
  findConversationsForExtract: vi.fn(async () => [
    { id: 'c1', account_id: 'a1', contact_id: 'p1' },
  ]),
  extractMemoryFromConversation: vi.fn(async () => ({
    proposed: 2,
    inserted: 1,
    skipped: 1,
  })),
}))

describe('runMemoryConsolidation', () => {
  it('aggregates results from eligible conversations', async () => {
    const db = {} as never
    const result = await runMemoryConsolidation(db)
    expect(result).toEqual({
      processed: 1,
      inserted: 1,
      proposed: 2,
      skipped: 1,
    })
  })
})
