import { BRAND_COLOR_VARS } from './constants';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidBrandHex(value: string): boolean {
  return HEX_RE.test(value);
}

/** Apply or clear account-level primary color overrides on `<html>`. */
export function applyAccountBrandColor(hex: string | null | undefined): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (!hex || !isValidBrandHex(hex)) {
    for (const key of BRAND_COLOR_VARS) {
      root.style.removeProperty(key);
    }
    return;
  }

  root.style.setProperty('--primary', hex);
  root.style.setProperty('--primary-foreground', '#ffffff');
  root.style.setProperty('--primary-hover', hex);
  root.style.setProperty('--primary-soft', `${hex}1f`);
  root.style.setProperty('--primary-soft-2', `${hex}33`);
  root.style.setProperty('--ring', hex);
  root.style.setProperty('--sidebar-primary', hex);
  root.style.setProperty('--sidebar-ring', hex);
  root.style.setProperty('--chart-1', hex);
}
