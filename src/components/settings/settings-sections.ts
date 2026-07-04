import {
  Coins,
  FileText,
  KeyRound,
  LayoutGrid,
  Palette,
  PlugZap,
  Shield,
  Tags,
  User,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

/**
 * Settings information architecture for the redesigned page.
 *
 * The flat tab strip became a grouped left rail with a new Overview
 * landing. The URL query param stays `?tab=` (deep-linkable, and it
 * keeps the existing links in sidebar.tsx / header.tsx working) — we
 * just map the old values onto the new sections.
 */
export const SETTINGS_SECTIONS = [
  'overview',
  'profile',
  'security',
  'appearance',
  'whatsapp',
  'templates',
  'fields',
  'deals',
  'members',
  'api',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const DEFAULT_SECTION: SettingsSection = 'overview';

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/** Rail grouping. `adminOnly` items are hidden for non-admins. */
export interface SectionMeta {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
  group: 'top' | 'account' | 'workspace';
}

export function getSectionMeta(t: TranslateFn): Record<SettingsSection, SectionMeta> {
  return {
    overview: {
      id: 'overview',
      label: t('settings.sections.overview'),
      icon: LayoutGrid,
      group: 'top',
    },
    profile: {
      id: 'profile',
      label: t('settings.sections.profile'),
      icon: User,
      group: 'account',
    },
    security: {
      id: 'security',
      label: t('settings.sections.security'),
      icon: Shield,
      group: 'account',
    },
    appearance: {
      id: 'appearance',
      label: t('settings.sections.appearance'),
      icon: Palette,
      group: 'account',
    },
    whatsapp: {
      id: 'whatsapp',
      label: t('settings.sections.whatsapp'),
      icon: PlugZap,
      group: 'workspace',
    },
    templates: {
      id: 'templates',
      label: t('settings.sections.templates'),
      icon: FileText,
      group: 'workspace',
    },
    fields: {
      id: 'fields',
      label: t('settings.sections.fields'),
      icon: Tags,
      group: 'workspace',
    },
    deals: {
      id: 'deals',
      label: t('settings.sections.deals'),
      icon: Coins,
      group: 'workspace',
    },
    members: {
      id: 'members',
      label: t('settings.sections.members'),
      icon: UsersRound,
      group: 'workspace',
    },
    api: {
      id: 'api',
      label: t('settings.sections.api'),
      icon: KeyRound,
      group: 'workspace',
    },
  };
}

export function getRailGroups(
  t: TranslateFn,
): { label: string | null; group: SectionMeta['group'] }[] {
  return [
    { label: null, group: 'top' },
    { label: t('settings.rail.groups.account'), group: 'account' },
    { label: t('settings.rail.groups.workspace'), group: 'workspace' },
  ];
}

function isSection(value: string | null): value is SettingsSection {
  return !!value && (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

/**
 * Resolve a raw `?tab=` value to a section. Legacy tabs from the old
 * flat layout collapse onto their new home (Tags + Custom fields → the
 * merged "Fields & tags" section). Anything unknown falls back to the
 * Overview landing.
 */
export function resolveSection(raw: string | null): SettingsSection {
  if (raw === 'tags' || raw === 'custom-fields') return 'fields';
  if (isSection(raw)) return raw;
  return DEFAULT_SECTION;
}
