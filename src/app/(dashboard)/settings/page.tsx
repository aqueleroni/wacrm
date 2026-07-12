'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { SettingsRail } from '@/components/settings/settings-rail';
import { SettingsOverview } from '@/components/settings/settings-overview';
import { ProfileForm } from '@/components/settings/profile-form';
import { SecurityPanel } from '@/components/settings/security-panel';
import { AppearancePanel } from '@/components/settings/appearance-panel';
import { WhatsAppConfig } from '@/components/settings/whatsapp-config';
import { TemplateManager } from '@/components/settings/template-manager';
import { QuickRepliesManager } from '@/components/settings/quick-replies-manager';
import { FieldsAndTagsPanel } from '@/components/settings/fields-and-tags-panel';
import { DealsSettings } from '@/components/settings/deals-settings';
import { MembersTab } from '@/components/settings/members-tab';
import { ApiKeysSettings } from '@/components/settings/api-keys-settings';
import { useT } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import {
  resolveSection,
  type SettingsSection,
} from '@/components/settings/settings-sections';

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { defaultCurrency } = useAuth();
  const { mode } = useTheme();

  // The URL (`?tab=`) is the single source of truth for the active
  // section — deep-linkable, and it keeps the existing links in the
  // app sidebar/header working. Legacy tab values (tags, custom-fields)
  // resolve onto their new home; unknown/empty → the Overview landing.
  const section = resolveSection(searchParams.get('tab'));

  const go = (next: SettingsSection) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  // Cheap, fetch-free rail hints. The Overview landing carries the
  // full live status/counts; the rail just surfaces the two that are
  // already in context.
  const hints: Partial<Record<SettingsSection, ReactNode>> = useMemo(
    () => ({
      appearance: mode.charAt(0).toUpperCase() + mode.slice(1),
      deals: defaultCurrency,
    }),
    [mode, defaultCurrency],
  );

  const panel: Record<SettingsSection, ReactNode> = {
    overview: <SettingsOverview onSelect={go} />,
    profile: <ProfileForm />,
    security: <SecurityPanel />,
    appearance: <AppearancePanel />,
    whatsapp: <WhatsAppConfig />,
    templates: <TemplateManager />,
    'quick-replies': <QuickRepliesManager />,
    fields: <FieldsAndTagsPanel />,
    deals: <DealsSettings />,
    members: <MembersTab />,
    api: <ApiKeysSettings />,
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Rail must stay within the viewport hit-box. A tall sticky column
          without max-height paints lower items but lets clicks fall through
          to the panel (items below Modelos looked clickable and weren't). */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside
          className={cn(
            'relative z-20 w-full shrink-0',
            'lg:sticky lg:top-0 lg:w-[236px]',
            'lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain',
          )}
        >
          <SettingsRail active={section} onSelect={go} hints={hints} />
        </aside>
        <div className="relative z-0 min-w-0 flex-1">{panel[section]}</div>
      </div>
    </div>
  );
}
