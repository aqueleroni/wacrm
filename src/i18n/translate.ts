import type { Locale } from './config';

type Params = Record<string, string | number>;

function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

/** Walk nested message objects into dot-path keys. */
export function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[path] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenMessages(value as Record<string, unknown>, path));
    }
  }
  return out;
}

export function createTranslator(
  locale: Locale,
  catalogs: Record<Locale, Record<string, string>>,
) {
  const active = catalogs[locale] ?? catalogs.en;

  return function t(key: string, params?: Params): string {
    const text = active[key] ?? catalogs.en[key] ?? key;
    return interpolate(text, params);
  };
}
