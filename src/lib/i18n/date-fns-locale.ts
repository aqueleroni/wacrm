import { enUS, ptBR, type Locale as DateFnsLocale } from 'date-fns/locale';

import type { Locale } from '@/i18n/config';

/** date-fns locale matching the active app locale. */
export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === 'pt-BR' ? ptBR : enUS;
}
