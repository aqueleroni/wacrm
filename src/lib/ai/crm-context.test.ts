import { describe, expect, it } from 'vitest'
import { formatCrmContextBlock } from './crm-context'

describe('formatCrmContextBlock', () => {
  it('returns null for empty parts', () => {
    expect(formatCrmContextBlock(null)).toBeNull()
    expect(formatCrmContextBlock({ lines: [] })).toBeNull()
  })

  it('formats lines with PT heading by default', () => {
    const block = formatCrmContextBlock(
      { lines: ['Nome: João', 'Tags: lead'] },
      'pt-BR',
    )
    expect(block).toContain('CONTEXTO DO CLIENTE')
    expect(block).toContain('- Nome: João')
  })
})
