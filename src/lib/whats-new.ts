/**
 * Product “What's new” announcements.
 *
 * Bump `WHATS_NEW_VERSION` when you want every signed-in user to see
 * the dialog again. Add/remove keys in `WHATS_NEW_ITEM_KEYS` and mirror
 * the strings under `whatsNew.items.*` in en + pt-BR catalogs.
 *
 * Seen state is stored in localStorage as `wpcrm:whats-new:seen=<version>`.
 */

export const WHATS_NEW_VERSION = '2026.07.13';

export const WHATS_NEW_STORAGE_KEY = 'wpcrm:whats-new:seen';

/** Stable keys → `whatsNew.items.<key>` in i18n. */
export const WHATS_NEW_ITEM_KEYS = [
  'settingsNav',
  'avatarUpload',
  'whatsappTokens',
  'whatsappWebhook',
] as const;

export type WhatsNewItemKey = (typeof WHATS_NEW_ITEM_KEYS)[number];

export function getSeenWhatsNewVersion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(WHATS_NEW_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markWhatsNewSeen(version: string = WHATS_NEW_VERSION): void {
  try {
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, version);
  } catch {
    // private mode / quota — ignore; dialog may reappear next visit
  }
}

export function shouldShowWhatsNew(): boolean {
  return getSeenWhatsNewVersion() !== WHATS_NEW_VERSION;
}
