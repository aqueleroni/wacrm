import { getLocale } from './config';
import { createTranslator } from './translate';
import { messagesEn } from './locales/en';
import { messagesPtBR } from './locales/pt-BR';

export { getLocale, createTranslator };

const catalogs = { en: messagesEn, 'pt-BR': messagesPtBR };

/** Server-side translator — use in RSC, API routes, and middleware. */
export function t(key: string, params?: Record<string, string | number>): string {
  return createTranslator(getLocale(), catalogs)(key, params);
}

export { messagesEn, messagesPtBR };
