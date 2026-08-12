import type { createTranslator } from '@/i18n/translate';

type TFunction = ReturnType<typeof createTranslator>;

/** English seed names from `SPEC_DEFAULT_STAGES` → i18n keys. */
const DEFAULT_STAGE_KEYS: Record<string, string> = {
  'New Lead': 'pipelines.stages.newLead',
  Qualified: 'pipelines.stages.qualified',
  'Proposal Sent': 'pipelines.stages.proposalSent',
  Negotiation: 'pipelines.stages.negotiation',
  Won: 'pipelines.stages.won',
};

/** Show a localized label for built-in stage names; custom names pass through. */
export function translateStageName(name: string, t: TFunction): string {
  const key = DEFAULT_STAGE_KEYS[name];
  return key ? t(key) : name;
}

export function getDefaultStages(t: TFunction) {
  return [
    { name: t('pipelines.stages.newLead'), color: '#3b82f6', position: 0 },
    { name: t('pipelines.stages.qualified'), color: '#eab308', position: 1 },
    { name: t('pipelines.stages.proposalSent'), color: '#f97316', position: 2 },
    { name: t('pipelines.stages.negotiation'), color: '#8b5cf6', position: 3 },
    { name: t('pipelines.stages.won'), color: '#22c55e', position: 4 },
  ];
}
