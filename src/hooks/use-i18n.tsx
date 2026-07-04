'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { getLocale, type Locale } from '@/i18n/config';
import { createTranslator } from '@/i18n/translate';
import { messagesEn } from '@/i18n/locales/en';
import { messagesPtBR } from '@/i18n/locales/pt-BR';

type TFunction = ReturnType<typeof createTranslator>;

const I18nContext = createContext<{ locale: Locale; t: TFunction } | null>(null);

const catalogs = { en: messagesEn, 'pt-BR': messagesPtBR };

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = getLocale();
  const value = useMemo(
    () => ({ locale, t: createTranslator(locale, catalogs) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}
