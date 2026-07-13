'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';

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
import {
  resolveSection,
  type SettingsSection,
} from '@/components/settings/settings-sections';

/**
 * Settings tab switching must NOT use `router.replace(?tab=…)` as the
 * sole source of truth. Next.js 16.2.x can silently ignore same-path
 * searchParam updates after the first few navigations (router cache
 * keyed without the query string) — UI focus moves, URL/panel stay put.
 * Local state drives the panel; the address bar is updated via
 * `history.replaceState` so deep links keep working without that bug.
 */
function SettingsPageInner() {
  const t = useT();
  const searchParams = useSearchParams();
  const { defaultCurrency } = useAuth();
  const { mode } = useTheme();

  const urlSection = resolveSection(searchParams.get('tab'));
  const [section, setSection] = useState<SettingsSection>(urlSection);

  // Soft-nav into /settings?tab=… (sidebar / header Link) bumps
  // useSearchParams. Re-read the address bar — not urlSection alone —
  // so a stale Next router cache can't overwrite a tab we already set
  // via history.replaceState.
  useEffect(() => {
    const fromBar = resolveSection(
      new URLSearchParams(window.location.search).get('tab'),
    );
    setSection(fromBar);
  }, [urlSection]);

  useEffect(() => {
    const onPopState = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      setSection(resolveSection(tab));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const go = useCallback((next: SettingsSection) => {
    setSection(next);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', next);
    const url = `/settings?${params.toString()}`;
    window.history.replaceState(window.history.state, '', url);
  }, []);

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start">
        <aside className="relative z-10 min-w-0">
          <SettingsRail active={section} onSelect={go} hints={hints} />
        </aside>
        <div className="min-w-0 overflow-x-hidden">{panel[section]}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
