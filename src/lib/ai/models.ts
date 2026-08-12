import type { AiProvider } from './types'

export type AiModelTier = 'economy' | 'balanced' | 'premium'

export interface AiModelOption {
  id: string
  tier: AiModelTier
  /** Shown first in the list and pre-selected for new setups. */
  recommended?: boolean
}

/**
 * Curated BYO-key models — fast/cheap first, premium last. IDs are stored
 * as-is in `account_ai_config.model`; the UI is a pick-list, not free text.
 */
export const AI_PROVIDER_MODELS: Record<AiProvider, readonly AiModelOption[]> = {
  openai: [
    { id: 'gpt-5.4-mini', tier: 'economy', recommended: true },
    { id: 'gpt-4o-mini', tier: 'economy' },
    { id: 'gpt-4.1-mini', tier: 'economy' },
    { id: 'gpt-5.4', tier: 'balanced' },
    { id: 'gpt-4o', tier: 'balanced' },
  ],
  anthropic: [
    // IDs sem sufixo de data (aliases) não aposentam silenciosamente.
    // Ver auditoria B1: 'claude-3-5-haiku-20241022' foi aposentado e
    // 'claude-opus-4-6-20250514' nunca existiu (data do Opus 4, não do 4.6).
    { id: 'claude-haiku-4-5', tier: 'economy', recommended: true },
    { id: 'claude-sonnet-5', tier: 'balanced' },
    { id: 'claude-sonnet-4-6', tier: 'balanced' },
    { id: 'claude-sonnet-4-5-20250929', tier: 'balanced' },
    { id: 'claude-opus-4-8', tier: 'premium' },
  ],
}

export function getDefaultModel(provider: AiProvider): string {
  const models = AI_PROVIDER_MODELS[provider]
  return models.find((m) => m.recommended)?.id ?? models[0]?.id ?? ''
}

export function isKnownModel(provider: AiProvider, model: string): boolean {
  const trimmed = model.trim()
  if (!trimmed) return false
  return AI_PROVIDER_MODELS[provider].some((m) => m.id === trimmed)
}

/** Known models plus a legacy/custom id when the saved config is not in the list. */
export function modelsForProvider(
  provider: AiProvider,
  currentModel?: string,
): AiModelOption[] {
  const base = [...AI_PROVIDER_MODELS[provider]]
  const trimmed = currentModel?.trim()
  if (trimmed && !base.some((m) => m.id === trimmed)) {
    base.push({ id: trimmed, tier: 'economy' })
  }
  return base
}
