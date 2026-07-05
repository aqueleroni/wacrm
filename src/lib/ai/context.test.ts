import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildConversationContext } from './context'

/** Minimal fake matching the query chain in buildConversationContext:
 *  from().select().eq().eq().order().limit() → { data, error }. */
function fakeDb(rows: unknown[]): SupabaseClient {
  const chain = {
    from: () => chain,
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: rows, error: null }),
  }
  return chain as unknown as SupabaseClient
}

describe('buildConversationContext', () => {
  it('maps sender_type to role and returns chronological order', async () => {
    // DB returns newest-first (created_at DESC); the fn reverses it.
    const rows = [
      { sender_type: 'customer', content_type: 'text', content_text: 'third' },
      { sender_type: 'agent', content_type: 'text', content_text: 'second' },
      { sender_type: 'customer', content_type: 'text', content_text: 'first' },
    ]
    const out = await buildConversationContext(fakeDb(rows), 'conv-1')
    expect(out).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'second' },
      { role: 'user', content: 'third' },
    ])
  })

  it('treats bot messages as assistant', async () => {
    const out = await buildConversationContext(
      fakeDb([{ sender_type: 'bot', content_type: 'text', content_text: 'auto reply' }]),
      'conv-1',
    )
    expect(out).toEqual([{ role: 'assistant', content: 'auto reply' }])
  })

  it('drops empty / whitespace-only text messages', async () => {
    const out = await buildConversationContext(
      fakeDb([
        { sender_type: 'customer', content_type: 'text', content_text: '   ' },
        { sender_type: 'customer', content_type: 'text', content_text: null },
        { sender_type: 'customer', content_type: 'text', content_text: 'real' },
      ]),
      'conv-1',
    )
    expect(out).toEqual([{ role: 'user', content: 'real' }])
  })

  it('renders media as a bracketed placeholder (with caption when present)', async () => {
    const out = await buildConversationContext(
      fakeDb([
        { sender_type: 'customer', content_type: 'image', content_text: 'esse aqui' },
        { sender_type: 'customer', content_type: 'audio', content_text: null },
        { sender_type: 'bot', content_type: 'document', content_text: null },
      ]),
      'conv-1',
    )
    // DB rows come in newest-first; the fn reverses to chronological.
    expect(out).toEqual([
      { role: 'assistant', content: '[o negócio enviou um documento]' },
      { role: 'user', content: '[o cliente enviou um áudio]' },
      { role: 'user', content: '[o cliente enviou uma imagem com a legenda: "esse aqui"]' },
    ])
  })

  it('keeps interactive taps as text', async () => {
    const out = await buildConversationContext(
      fakeDb([{ sender_type: 'customer', content_type: 'interactive', content_text: 'Ver planos' }]),
      'conv-1',
    )
    expect(out).toEqual([{ role: 'user', content: 'Ver planos' }])
  })
})
