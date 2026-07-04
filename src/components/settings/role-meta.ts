import {
  Crown,
  Shield,
  UserCog,
  UserIcon,
  type LucideIcon,
} from 'lucide-react';

import type { AccountRole } from '@/lib/auth/roles';
import type { ChipVariant } from './settings-chip';
import type { TranslateFn } from './settings-sections';

/**
 * Single source of truth for per-role chip metadata across settings
 * surfaces (the Overview identity chip and the Members roster/invite
 * chips). Previously duplicated in both files; hoisted here so a label,
 * icon, or colour change lands once.
 *
 * `variant` drives the token-based <SettingsChip>; `className` is the
 * inline Tailwind string the Members tab applies to its own spans.
 */
export function getRoleMeta(
  t: TranslateFn,
): Record<
  AccountRole,
  { icon: LucideIcon; label: string; variant: ChipVariant; className: string }
> {
  return {
    owner: {
      icon: Crown,
      label: t('common.roles.owner'),
      variant: 'owner',
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    admin: {
      icon: Shield,
      label: t('common.roles.admin'),
      variant: 'admin',
      className: 'border-primary/40 bg-primary/10 text-primary',
    },
    agent: {
      icon: UserCog,
      label: t('common.roles.agent'),
      variant: 'muted',
      className: 'border-border bg-muted text-muted-foreground',
    },
    viewer: {
      icon: UserIcon,
      label: t('common.roles.viewer'),
      variant: 'muted',
      // Outline-only so it stays quieter than the filled Agent chip in
      // both modes — bg-card would blend into a card surface in light mode.
      className: 'border-border bg-transparent text-muted-foreground',
    },
  };
}
