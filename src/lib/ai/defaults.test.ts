import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, HANDOFF_SENTINEL } from './defaults'

describe('buildSystemPrompt', () => {
  it('uses Portuguese scaffold by default', () => {
    const prompt = buildSystemPrompt({
      userPrompt: null,
      mode: 'draft',
      locale: 'pt-BR',
    })
    expect(prompt).toContain('WhatsApp')
    expect(prompt).toContain('tom WhatsApp')
    expect(prompt).not.toContain('WhatsApp CRM')
  })

  it('puts persona before generic guidelines', () => {
    const prompt = buildSystemPrompt({
      userPrompt: 'Você é Gabriella, da Wepost.',
      mode: 'draft',
      locale: 'pt-BR',
    })
    const personaIdx = prompt.indexOf('Gabriella')
    const guidelinesIdx = prompt.indexOf('Diretrizes')
    expect(personaIdx).toBeGreaterThan(-1)
    expect(guidelinesIdx).toBeGreaterThan(personaIdx)
  })

  it('includes conversation examples when provided', () => {
    const prompt = buildSystemPrompt({
      userPrompt: 'Gabriella',
      mode: 'draft',
      conversationExamples: 'Cliente: oi\nVocê: Olá!',
      locale: 'pt-BR',
    })
    expect(prompt).toContain('EXEMPLOS DE TOM')
    expect(prompt).toContain('Cliente: oi')
  })

  it('includes handoff sentinel in auto_reply mode', () => {
    const prompt = buildSystemPrompt({
      userPrompt: null,
      mode: 'auto_reply',
      locale: 'pt-BR',
    })
    expect(prompt).toContain(HANDOFF_SENTINEL)
  })
})
