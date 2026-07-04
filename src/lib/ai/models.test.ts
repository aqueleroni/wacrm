import { describe, it, expect } from 'vitest'
import {
  AI_PROVIDER_MODELS,
  getDefaultModel,
  isKnownModel,
  modelsForProvider,
} from './models'

describe('AI provider models', () => {
  it('returns a recommended default per provider', () => {
    expect(getDefaultModel('openai')).toBe('gpt-5.4-mini')
    expect(getDefaultModel('anthropic')).toBe('claude-haiku-4-5-20251001')
  })

  it('recognises curated model ids', () => {
    expect(isKnownModel('openai', 'gpt-4o-mini')).toBe(true)
    expect(isKnownModel('openai', 'custom-model')).toBe(false)
  })

  it('appends a legacy model when not in the curated list', () => {
    const models = modelsForProvider('openai', 'legacy-x')
    expect(models.some((m) => m.id === 'legacy-x')).toBe(true)
    expect(models.length).toBe(AI_PROVIDER_MODELS.openai.length + 1)
  })
})
