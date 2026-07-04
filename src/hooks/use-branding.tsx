'use client';

import { useEffect, useMemo } from 'react';

import { applyAccountBrandColor } from '@/lib/branding/apply-primary-color';
import { DEFAULT_BRAND_LOGO } from '@/lib/branding/constants';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-i18n';

export function useBranding() {
  const t = useT();
  const { account } = useAuth();

  return useMemo(
    () => ({
      displayName: account?.brand_name?.trim() || t('nav.appName'),
      logoUrl: account?.brand_logo_url?.trim() || DEFAULT_BRAND_LOGO,
      primaryColor: account?.brand_primary_color ?? null,
      hasCustomLogo: Boolean(account?.brand_logo_url?.trim()),
      hasCustomName: Boolean(account?.brand_name?.trim()),
      hasCustomColor: Boolean(account?.brand_primary_color),
    }),
    [account, t],
  );
}

/** Applies account accent color to CSS variables while mounted. */
export function BrandApplier() {
  const { account } = useAuth();

  useEffect(() => {
    applyAccountBrandColor(account?.brand_primary_color);
    return () => applyAccountBrandColor(null);
  }, [account?.brand_primary_color]);

  return null;
}
