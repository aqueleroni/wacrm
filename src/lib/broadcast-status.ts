/**
 * Shared status badge config for broadcasts + recipients.
 *
 * Previously `statusConfig` was defined inline in both
 * /broadcasts/page.tsx and /broadcasts/[id]/page.tsx with slight
 * drift risk. One source of truth now.
 *
 * Badge shape: bg-*-500/10 + text-*-400 + border-*-500/20. The
 * translucent fills sit fine on both light and dark surfaces; neutral
 * statuses use text-muted-foreground so the label stays legible in
 * light mode (a solid slate-400 would be too faint on white).
 */

import type { BroadcastStatus, RecipientStatus } from "@/types";

export interface StatusDisplay {
  label: string;
  classes: string;
  /**
   * Set true for statuses that should pulse in the UI to convey
   * "live / in-flight" — currently only `sending`.
   */
  pulse?: boolean;
}

export const broadcastStatusConfig: Record<BroadcastStatus, StatusDisplay> = {
  draft: {
    label: "draft",
    classes: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
  },
  scheduled: {
    label: "scheduled",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  sending: {
    label: "sending",
    classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    pulse: true,
  },
  sent: {
    label: "sent",
    classes: "bg-primary/10 text-primary border-primary/20",
  },
  failed: {
    label: "failed",
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export const recipientStatusConfig: Record<RecipientStatus, StatusDisplay> = {
  pending: {
    label: "pending",
    classes: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
  },
  sent: {
    label: "sent",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  delivered: {
    label: "delivered",
    classes: "bg-primary/10 text-primary border-primary/20",
  },
  read: {
    label: "read",
    classes: "bg-primary/10 text-primary border-primary/20",
  },
  replied: {
    label: "replied",
    classes: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  failed: {
    label: "failed",
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

/** Lookup broadcast/recipient status display with translated labels. */
type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const BROADCAST_STATUS_KEYS: Record<BroadcastStatus, string> = {
  draft: 'broadcasts.status.draft',
  scheduled: 'broadcasts.status.scheduled',
  sending: 'broadcasts.status.sending',
  sent: 'broadcasts.status.sent',
  failed: 'broadcasts.status.failed',
};

const RECIPIENT_STATUS_KEYS: Record<RecipientStatus, string> = {
  pending: 'broadcasts.recipientStatus.pending',
  sent: 'broadcasts.recipientStatus.sent',
  delivered: 'broadcasts.recipientStatus.delivered',
  read: 'broadcasts.recipientStatus.read',
  replied: 'broadcasts.recipientStatus.replied',
  failed: 'broadcasts.recipientStatus.failed',
};

export function getBroadcastStatusMeta(
  status: string,
  t: TranslateFn,
): StatusDisplay {
  const key = status as BroadcastStatus;
  const base =
    broadcastStatusConfig[key] ?? broadcastStatusConfig.draft;
  const labelKey = BROADCAST_STATUS_KEYS[key] ?? BROADCAST_STATUS_KEYS.draft;
  return { ...base, label: t(labelKey) };
}

export function getRecipientStatusMeta(
  status: string,
  t: TranslateFn,
): StatusDisplay {
  const key = status as RecipientStatus;
  const base =
    recipientStatusConfig[key] ?? recipientStatusConfig.pending;
  const labelKey = RECIPIENT_STATUS_KEYS[key] ?? RECIPIENT_STATUS_KEYS.pending;
  return { ...base, label: t(labelKey) };
}

/**
 * @deprecated Use getBroadcastStatusMeta(status, t) for translated labels.
 */
export function getBroadcastStatus(status: string): StatusDisplay {
  return (
    broadcastStatusConfig[status as BroadcastStatus] ??
    broadcastStatusConfig.draft
  );
}

/** @deprecated Use getRecipientStatusMeta(status, t) for translated labels. */
export function getRecipientStatus(status: string): StatusDisplay {
  return (
    recipientStatusConfig[status as RecipientStatus] ??
    recipientStatusConfig.pending
  );
}
