export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];

/** Default locale for this fork — Portuguese. English preserved in `en.ts`. */
export const DEFAULT_LOCALE: Locale = 'pt-BR';

export function getLocale(): Locale {
  const raw = process.env.NEXT_PUBLIC_LOCALE;
  if (raw === 'en' || raw === 'pt-BR') return raw;
  return DEFAULT_LOCALE;
}
