type TranslateFn = (key: string) => string;

/** Spec default stage names (English) → i18n keys. Stored in DB as English historically. */
const DEFAULT_STAGE_KEYS: Record<string, string> = {
  'New Lead': 'pipelines.stages.newLead',
  Qualified: 'pipelines.stages.qualified',
  'Proposal Sent': 'pipelines.stages.proposalSent',
  Negotiation: 'pipelines.stages.negotiation',
  Won: 'pipelines.stages.won',
};

/** Display label for a pipeline stage — translates known default names. */
export function localizeStageName(name: string, t: TranslateFn): string {
  const key = DEFAULT_STAGE_KEYS[name];
  if (!key) return name;
  const translated = t(key);
  return translated === key ? name : translated;
}

export function getDefaultStages(t: TranslateFn) {
  return [
    { name: t('pipelines.stages.newLead'), color: '#3b82f6', position: 0 },
    { name: t('pipelines.stages.qualified'), color: '#eab308', position: 1 },
    { name: t('pipelines.stages.proposalSent'), color: '#f97316', position: 2 },
    { name: t('pipelines.stages.negotiation'), color: '#8b5cf6', position: 3 },
    { name: t('pipelines.stages.won'), color: '#22c55e', position: 4 },
  ];
}
