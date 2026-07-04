/**
 * Shared display config for message_templates.status.
 *
 * The DB stores Meta's raw enum (DRAFT / APPROVED / PENDING / REJECTED /
 * PAUSED / DISABLED / IN_APPEAL / PENDING_DELETION) — the UI maps it to
 * a human label + dark-theme badge classes here so the template manager,
 * inbox picker, and broadcast picker stay aligned.
 */

import type { MessageTemplateStatus } from '@/types';

export interface TemplateStatusDisplay {
  label: string;
  classes: string;
}

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

const templateStatusClasses: Record<MessageTemplateStatus, string> = {
  DRAFT: 'bg-slate-600/20 text-muted-foreground border-slate-600/30',
  PENDING: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  APPROVED: 'bg-primary/20 text-primary border-primary/30',
  REJECTED: 'bg-red-600/20 text-red-400 border-red-600/30',
  PAUSED: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  DISABLED: 'bg-red-900/30 text-red-500 border-red-900/40',
  IN_APPEAL: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  PENDING_DELETION: 'bg-slate-700/30 text-muted-foreground border-slate-700/40',
};

const templateStatusLabelKeys: Record<MessageTemplateStatus, string> = {
  DRAFT: 'common.status.draft',
  PENDING: 'common.status.pending',
  APPROVED: 'common.status.approved',
  REJECTED: 'common.status.rejected',
  PAUSED: 'common.status.paused',
  DISABLED: 'common.status.disabled',
  IN_APPEAL: 'common.status.inAppeal',
  PENDING_DELETION: 'common.status.pendingDeletion',
};

/** Localized labels via `useT()`; badge classes stay locale-agnostic. */
export function getTemplateStatusConfig(
  t: TranslateFn,
): Record<MessageTemplateStatus, TemplateStatusDisplay> {
  return (Object.keys(templateStatusClasses) as MessageTemplateStatus[]).reduce(
    (acc, status) => {
      acc[status] = {
        label: t(templateStatusLabelKeys[status]),
        classes: templateStatusClasses[status],
      };
      return acc;
    },
    {} as Record<MessageTemplateStatus, TemplateStatusDisplay>,
  );
}

/** @deprecated Prefer `getTemplateStatusConfig(t)` for UI labels. */
export const templateStatusConfig: Record<
  MessageTemplateStatus,
  TemplateStatusDisplay
> = {
  DRAFT: {
    label: 'Draft',
    classes: templateStatusClasses.DRAFT,
  },
  PENDING: {
    label: 'Pending',
    classes: templateStatusClasses.PENDING,
  },
  APPROVED: {
    label: 'Approved',
    classes: templateStatusClasses.APPROVED,
  },
  REJECTED: {
    label: 'Rejected',
    classes: templateStatusClasses.REJECTED,
  },
  PAUSED: {
    label: 'Paused',
    classes: templateStatusClasses.PAUSED,
  },
  DISABLED: {
    label: 'Disabled',
    classes: templateStatusClasses.DISABLED,
  },
  IN_APPEAL: {
    label: 'In Appeal',
    classes: templateStatusClasses.IN_APPEAL,
  },
  PENDING_DELETION: {
    label: 'Pending Deletion',
    classes: templateStatusClasses.PENDING_DELETION,
  },
};
