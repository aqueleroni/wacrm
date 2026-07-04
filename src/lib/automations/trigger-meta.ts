import type { AutomationTriggerType } from '@/types';

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export interface TriggerMeta {
  label: string;
  /** Tailwind classes for the Badge pill on the list row. */
  pillClass: string;
}

const PILL_CLASSES: Record<AutomationTriggerType, string> = {
  new_message_received: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  first_inbound_message: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  keyword_match: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  new_contact_created: 'border-primary/30 bg-primary/10 text-primary',
  conversation_assigned: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  tag_added: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  time_based: 'border-slate-500/30 bg-slate-500/10 text-muted-foreground',
};

const TRIGGER_LABEL_KEYS: Record<AutomationTriggerType, string> = {
  new_message_received: 'automations.triggers.newMessage',
  first_inbound_message: 'automations.triggers.firstMessage',
  keyword_match: 'automations.triggers.keywordMatch',
  new_contact_created: 'automations.triggers.newContact',
  conversation_assigned: 'automations.triggers.conversationAssigned',
  tag_added: 'automations.triggers.tagAdded',
  time_based: 'automations.triggers.timeBased',
};

export function getTriggerMeta(
  t: TranslateFn,
): Record<AutomationTriggerType, TriggerMeta> {
  return (Object.keys(PILL_CLASSES) as AutomationTriggerType[]).reduce(
    (acc, type) => {
      acc[type] = {
        label: t(TRIGGER_LABEL_KEYS[type]),
        pillClass: PILL_CLASSES[type],
      };
      return acc;
    },
    {} as Record<AutomationTriggerType, TriggerMeta>,
  );
}

export function triggerMeta(
  type: AutomationTriggerType | string,
  t: TranslateFn,
): TriggerMeta {
  const meta = getTriggerMeta(t)[type as AutomationTriggerType];
  return (
    meta ?? {
      label: type,
      pillClass: 'border-slate-500/30 bg-slate-500/10 text-muted-foreground',
    }
  );
}

export function formatRelative(
  t: TranslateFn,
  iso: string | null | undefined,
): string {
  if (!iso) return t('common.time.never');
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t('common.time.never');
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return t('common.time.justNow');
  if (diffSec < 3600) {
    return t('common.time.minutesAgo', { count: Math.floor(diffSec / 60) });
  }
  if (diffSec < 86400) {
    return t('common.time.hoursAgo', { count: Math.floor(diffSec / 3600) });
  }
  if (diffSec < 2_592_000) {
    return t('common.time.daysAgo', { count: Math.floor(diffSec / 86400) });
  }
  return new Date(iso).toLocaleDateString();
}
