import { enUS, ptBR } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';

import { getLocale } from '@/i18n/config';

/** date-fns locale matching `NEXT_PUBLIC_LOCALE` / fork default (pt-BR). */
export function getDateFnsLocale(): DateFnsLocale {
  return getLocale() === 'pt-BR' ? ptBR : enUS;
}
