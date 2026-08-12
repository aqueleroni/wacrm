import { describe, it, expect } from 'vitest'
import { latestUserMessage, retrievalQuery } from './query'

describe('latestUserMessage', () => {
  it('returns the most recent user turn', () => {
    expect(
      latestUserMessage([
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'latest' },
      ]),
    ).toBe('latest')
  })

  it('falls back to the last message when none are user', () => {
    expect(
      latestUserMessage([{ role: 'assistant', content: 'only assistant' }]),
    ).toBe('only assistant')
  })

  it('returns empty string for no messages', () => {
    expect(latestUserMessage([])).toBe('')
  })
})

describe('retrievalQuery', () => {
  it('joins the last few customer turns, oldest-first', () => {
    expect(
      retrievalQuery([
        { role: 'user', content: 'vocês fazem site VTEX?' },
        { role: 'assistant', content: 'fazemos sim' },
        { role: 'user', content: 'e o preço?' },
      ]),
    ).toBe('vocês fazem site VTEX? e o preço?')
  })

  it('caps how far back it reaches', () => {
    const msgs = [
      { role: 'user' as const, content: 'a' },
      { role: 'user' as const, content: 'b' },
      { role: 'user' as const, content: 'c' },
      { role: 'user' as const, content: 'd' },
    ]
    expect(retrievalQuery(msgs, 2)).toBe('c d')
  })

  it('falls back to the last message when no user turns', () => {
    expect(
      retrievalQuery([{ role: 'assistant', content: 'only assistant' }]),
    ).toBe('only assistant')
  })

  it('returns empty string for no messages', () => {
    expect(retrievalQuery([])).toBe('')
  })
})
