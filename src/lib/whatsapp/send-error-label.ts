import { isRecipientNotAllowedError } from '@/lib/whatsapp/phone-utils'

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string

/**
 * Map a raw send/API error string (often English from Meta) to a
 * localized label for toasts. Unknown messages are returned as-is so
 * we never hide a novel Meta error behind a generic string.
 */
export function translateWhatsAppSendError(
  message: string,
  t: TranslateFn,
): string {
  const trimmed = message.trim()
  if (!trimmed) return trimmed

  if (/^network error$/i.test(trimmed)) {
    return t('inbox.thread.errors.network')
  }

  if (isRecipientNotAllowedError(trimmed)) {
    return t('inbox.thread.errors.meta.recipientNotAllowed')
  }

  const codeMatch = trimmed.match(/#(\d{5,6})/)
  if (codeMatch) {
    const key = `inbox.thread.errors.meta.code${codeMatch[1]}`
    const translated = t(key)
    if (translated !== key) return translated
  }

  if (/^Meta API error:\s*/i.test(trimmed)) {
    const detail = trimmed.replace(/^Meta API error:\s*/i, '').trim()
    return t('inbox.thread.errors.meta.generic', { detail })
  }

  return trimmed
}
