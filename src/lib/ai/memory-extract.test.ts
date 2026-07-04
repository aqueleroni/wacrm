import { describe, expect, it } from 'vitest'
import {
  isSensitiveMemory,
  parseExtractedMemories,
} from './memory-extract'

describe('parseExtractedMemories', () => {
  it('parses valid JSON memories', () => {
    const raw = `{"memories":[{"kind":"fact","content":"João quer site VTEX","contact_scoped":true}]}`
    expect(parseExtractedMemories(raw)).toEqual([
      {
        kind: 'fact',
        content: 'João quer site VTEX',
        contactScoped: true,
      },
    ])
  })

  it('returns empty for invalid JSON', () => {
    expect(parseExtractedMemories('not json')).toEqual([])
  })

  it('caps at 3 memories', () => {
    const raw = JSON.stringify({
      memories: [
        { kind: 'fact', content: 'a', contact_scoped: true },
        { kind: 'fact', content: 'b', contact_scoped: true },
        { kind: 'fact', content: 'c', contact_scoped: true },
        { kind: 'fact', content: 'd', contact_scoped: true },
      ],
    })
    expect(parseExtractedMemories(raw)).toHaveLength(3)
  })
})

describe('isSensitiveMemory', () => {
  it('flags price-related content', () => {
    expect(isSensitiveMemory('Cliente pediu desconto de 20%')).toBe(true)
  })

  it('allows neutral facts', () => {
    expect(isSensitiveMemory('Cliente quer site VTEX')).toBe(false)
  })
})
