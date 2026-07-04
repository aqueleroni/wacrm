'use client';

import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { ImageIcon, Loader2, RotateCcw } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-i18n';
import { BRANDING_BUCKET, DEFAULT_BRAND_LOGO } from '@/lib/branding/constants';
import { isValidBrandHex } from '@/lib/branding/apply-primary-color';
import { AppLogo } from '@/components/brand/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MAX_NAME_LEN = 60;
const DEFAULT_BRAND_COLOR = '#7c3aed';

export function BrandingSettings() {
  const t = useT();
  const supabase = createClient();
  const {
    accountId,
    account,
    canEditSettings,
    profileLoading,
    refreshProfile,
  } = useAuth();

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [color, setColor] = useState('');
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(account?.brand_name ?? '');
    setLogoUrl(account?.brand_logo_url ?? null);
    setColor(account?.brand_primary_color ?? '');
  }, [account]);

  useEffect(() => {
    if (!pendingLogo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingLogo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingLogo]);

  const displayLogo = previewUrl ?? logoUrl ?? DEFAULT_BRAND_LOGO;

  const dirty =
    name !== (account?.brand_name ?? '') ||
    color !== (account?.brand_primary_color ?? '') ||
    pendingLogo !== null ||
    logoUrl !== (account?.brand_logo_url ?? null);

  async function uploadLogo(file: File): Promise<string | null> {
    if (!accountId) return null;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `account-${accountId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BRANDING_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      toast.error(t('settings.appearance.branding.toast.uploadFailed'));
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);
    return publicUrl;
  }

  async function handleSave() {
    if (!accountId || !dirty) return;

    const trimmedName = name.trim();
    if (trimmedName.length > MAX_NAME_LEN) {
      toast.error(t('settings.appearance.branding.toast.nameTooLong'));
      return;
    }
    if (color && !isValidBrandHex(color)) {
      toast.error(t('settings.appearance.branding.toast.invalidColor'));
      return;
    }

    setSaving(true);
    try {
      let nextLogoUrl = logoUrl;
      if (pendingLogo) {
        const uploaded = await uploadLogo(pendingLogo);
        if (!uploaded) {
          setSaving(false);
          return;
        }
        nextLogoUrl = uploaded;
      }

      const { error } = await supabase
        .from('accounts')
        .update({
          brand_name: trimmedName || null,
          brand_logo_url: nextLogoUrl,
          brand_primary_color: color || null,
        })
        .eq('id', accountId);

      if (error) {
        toast.error(t('settings.appearance.branding.toast.saveFailed'));
        return;
      }

      setPendingLogo(null);
      setLogoUrl(nextLogoUrl);
      await refreshProfile();
      toast.success(t('settings.appearance.branding.toast.saved'));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setName('');
    setLogoUrl(null);
    setColor('');
    setPendingLogo(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="size-4 text-primary" />
          {t('settings.appearance.branding.title')}
        </CardTitle>
        <CardDescription>{t('settings.appearance.branding.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary p-1.5">
            <AppLogo src={displayLogo} size={28} className="h-full w-full" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {name.trim() || t('nav.appName')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('settings.appearance.branding.previewHint')}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="brand-name">{t('settings.appearance.branding.nameLabel')}</Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('nav.appName')}
              maxLength={MAX_NAME_LEN}
              disabled={!canEditSettings || profileLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.appearance.branding.logoLabel')}</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              disabled={!canEditSettings || profileLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPendingLogo(file);
                e.target.value = '';
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canEditSettings || profileLoading}
                onClick={() => fileRef.current?.click()}
              >
                {t('settings.appearance.branding.uploadLogo')}
              </Button>
              {(logoUrl || pendingLogo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canEditSettings || profileLoading}
                  onClick={() => {
                    setPendingLogo(null);
                    setLogoUrl(null);
                  }}
                >
                  {t('settings.appearance.branding.removeLogo')}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.appearance.branding.logoHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-color-hex">{t('settings.appearance.branding.colorLabel')}</Label>
            <BrandColorPicker
              value={color}
              onChange={setColor}
              disabled={!canEditSettings || profileLoading}
              onClear={() => setColor('')}
              clearLabel={t('settings.appearance.branding.clearColor')}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.appearance.branding.colorHint')}
            </p>
          </div>
        </div>

        {!canEditSettings && (
          <p className="text-xs text-muted-foreground">
            {t('settings.appearance.branding.adminOnly')}
          </p>
        )}

        {canEditSettings && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t('common.actions.save')}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-2 size-4" />
              {t('settings.appearance.branding.resetDefaults')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BrandColorPicker({
  value,
  onChange,
  disabled,
  onClear,
  clearLabel,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  onClear: () => void;
  clearLabel: string;
}) {
  const t = useT();
  const display = value || DEFAULT_BRAND_COLOR;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          render={
            <button
              type="button"
              disabled={disabled}
              aria-label={t('settings.appearance.branding.pickColor')}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent p-1',
                'transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'dark:bg-input/30',
              )}
            />
          }
        >
          <span
            aria-hidden
            className="h-full w-full rounded-md ring-1 ring-foreground/10"
            style={{ backgroundColor: display }}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <div className="brand-color-picker">
            <HexColorPicker
              color={display}
              onChange={onChange}
              className="!w-52"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Input
        id="brand-color-hex"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_BRAND_COLOR}
        maxLength={7}
        disabled={disabled}
        className="w-28 font-mono text-sm"
      />

      {value && (
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onClear}>
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
