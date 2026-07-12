'use client';

import { useT } from '@/hooks/use-i18n';

type Params = Record<string, string | number>;

/**
 * Thin compatibility shim for upstream components that still call
 * `useTranslations("Namespace.path")` (next-intl style).
 *
 * Maps `Inbox.bubble` → `inbox.bubble.*` keys in our catalogs.
 */
export function useTranslations(namespace: string) {
  const t = useT();
  const prefix = namespace
    .split('.')
    .map((part, index) =>
      index === 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part,
    )
    .join('.');

  return function translate(key: string, values?: Params): string {
    return t(`${prefix}.${key}`, values);
  };
}
