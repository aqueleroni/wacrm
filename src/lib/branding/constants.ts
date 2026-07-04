/** Default logo when the account has no custom branding. */
export const DEFAULT_BRAND_LOGO = '/logo-wepost.webp';

export const BRANDING_BUCKET = 'account-branding';

/** CSS custom properties overridden when an account sets a custom accent. */
export const BRAND_COLOR_VARS = [
  '--primary',
  '--primary-hover',
  '--primary-soft',
  '--primary-soft-2',
  '--ring',
  '--sidebar-primary',
  '--sidebar-ring',
  '--chart-1',
] as const;
