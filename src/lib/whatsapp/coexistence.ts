import { normalizePhone } from '@/lib/whatsapp/phone-utils'

/**
 * WhatsApp Business app coexistence webhooks.
 *
 * A number onboarded through Embedded Signup's "connect your existing
 * WhatsApp Business app" path stays live on the phone. Meta mirrors what
 * happens there through three extra WABA webhook fields, which the app
 * must be subscribed to in App Dashboard → WhatsApp → Configuration:
 *
 *   smb_message_echoes  messages the business sends FROM the phone app
 *   history             up to 180 days of past chats, sent once after
 *                       `POST /<phone_number_id>/smb_app_data` (history)
 *   smb_app_state_sync  the phone's address book, after the same call
 *                       with `smb_app_state_sync`, then on every change
 *
 * This module only parses those payloads into flat rows; persistence
 * lives in the webhook route next to the inbound-message helpers.
 */

export const COEXISTENCE_WEBHOOK_FIELDS = [
  'smb_message_echoes',
  'history',
  'smb_app_state_sync',
] as const

export type CoexistenceWebhookField = (typeof COEXISTENCE_WEBHOOK_FIELDS)[number]

export function isCoexistenceWebhookField(
  field: string,
): field is CoexistenceWebhookField {
  return (COEXISTENCE_WEBHOOK_FIELDS as readonly string[]).includes(field)
}

/** Meta error code on a `history` webhook when the business declined sharing. */
export const HISTORY_SHARING_DECLINED_CODE = 2593109

export type MirroredStatus = 'sent' | 'delivered' | 'read' | 'failed'

/**
 * One message from the phone app, normalised so echoes and history rows
 * share a single persistence path. `message` keeps Meta's original shape
 * (`type` + the matching content key) so the webhook's content parser can
 * read it like any inbound message.
 */
export interface MirroredMessage {
  id: string
  /** Digits-only phone of the WhatsApp user on the other side. */
  customerPhone: string
  /** True when the business wrote it (phone app), false when the customer did. */
  fromBusiness: boolean
  /** Unix seconds, as Meta sends it. */
  timestamp: string
  type: string
  status: MirroredStatus
  message: Record<string, unknown> & { id: string; type: string; timestamp: string }
}

export interface MirroredThread {
  customerPhone: string
  messages: MirroredMessage[]
}

interface RawMessage {
  id?: string
  from?: string
  to?: string
  timestamp?: string
  type?: string
  history_context?: { status?: string; from_me?: boolean }
  [key: string]: unknown
}

/** Types that carry nothing worth a message row. */
const SKIPPED_TYPES = new Set(['reaction', 'errors', 'unsupported', 'system'])

export function historyStatusToMirrored(
  status: string | undefined,
  fromBusiness: boolean,
): MirroredStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'READ':
    case 'PLAYED':
      return 'read'
    case 'DELIVERED':
      return 'delivered'
    case 'ERROR':
      return 'failed'
    default:
      // Customer-written rows are stored as 'delivered' by the inbound path.
      return fromBusiness ? 'sent' : 'delivered'
  }
}

function toMirrored(
  raw: RawMessage,
  customerPhone: string,
  fromBusiness: boolean,
  status: MirroredStatus,
): MirroredMessage | null {
  if (!raw.id || !raw.type || !raw.timestamp) return null
  if (SKIPPED_TYPES.has(raw.type)) return null
  if (!customerPhone) return null
  return {
    id: raw.id,
    customerPhone,
    fromBusiness,
    timestamp: raw.timestamp,
    type: raw.type,
    status,
    message: { ...raw, id: raw.id, type: raw.type, timestamp: raw.timestamp },
  }
}

/** `smb_message_echoes` → messages the business typed on the phone app. */
export function parseMessageEchoes(value: unknown): MirroredMessage[] {
  const echoes = (value as { message_echoes?: RawMessage[] })?.message_echoes
  if (!Array.isArray(echoes)) return []
  const out: MirroredMessage[] = []
  for (const echo of echoes) {
    const mirrored = toMirrored(echo, normalizePhone(echo.to ?? ''), true, 'sent')
    if (mirrored) out.push(mirrored)
  }
  return out
}

export interface ParsedHistory {
  threads: MirroredThread[]
  /** The business turned history sharing off in the phone app. */
  declined: boolean
  /** Highest `progress` seen in this delivery (0–100), null if absent. */
  progress: number | null
}

/**
 * `history` with a `history` array → chat threads. A thread's `id` is the
 * customer's phone; a message whose `from` is that phone was written by
 * the customer, anything else by the business (`history_context.from_me`
 * confirms it when Meta includes it).
 */
export function parseHistory(value: unknown): ParsedHistory {
  const items = (value as { history?: unknown[] })?.history
  const result: ParsedHistory = { threads: [], declined: false, progress: null }
  if (!Array.isArray(items)) return result

  for (const item of items as Array<{
    errors?: Array<{ code?: number }>
    metadata?: { progress?: number }
    threads?: Array<{ id?: string; messages?: RawMessage[] }>
  }>) {
    if (item.errors?.some((e) => e.code === HISTORY_SHARING_DECLINED_CODE)) {
      result.declined = true
    }
    const progress = item.metadata?.progress
    if (typeof progress === 'number') {
      result.progress = Math.max(result.progress ?? 0, progress)
    }
    for (const thread of item.threads ?? []) {
      const customerPhone = normalizePhone(thread.id ?? '')
      if (!customerPhone) continue
      const messages: MirroredMessage[] = []
      for (const raw of thread.messages ?? []) {
        const fromBusiness =
          raw.history_context?.from_me === true ||
          normalizePhone(raw.from ?? '') !== customerPhone
        const mirrored = toMirrored(
          raw,
          customerPhone,
          fromBusiness,
          historyStatusToMirrored(raw.history_context?.status, fromBusiness),
        )
        if (mirrored) messages.push(mirrored)
      }
      if (messages.length > 0) result.threads.push({ customerPhone, messages })
    }
  }
  return result
}

/**
 * `history` with a `messages` array → the media asset for an earlier
 * `media_placeholder` row (only sent for media from the last 14 days).
 * Same message id as the placeholder; no thread id, so the caller
 * matches it back by message id.
 */
export function parseHistoryMedia(value: unknown): RawMessage[] {
  const messages = (value as { messages?: RawMessage[] })?.messages
  if (!Array.isArray(messages)) return []
  return messages.filter((m) => m.id && m.type && m.type !== 'media_placeholder')
}

export interface AddressBookChange {
  phone: string
  action: 'add' | 'remove'
  /** Name as saved on the business phone; absent on remove. */
  name: string | null
}

/** `smb_app_state_sync` → address-book additions, edits and removals. */
export function parseAddressBookSync(value: unknown): AddressBookChange[] {
  const entries = (value as {
    state_sync?: Array<{
      type?: string
      action?: string
      contact?: { phone_number?: string; full_name?: string; first_name?: string }
    }>
  })?.state_sync
  if (!Array.isArray(entries)) return []
  const out: AddressBookChange[] = []
  for (const entry of entries) {
    if (entry.type && entry.type !== 'contact') continue
    const phone = normalizePhone(entry.contact?.phone_number ?? '')
    if (!phone) continue
    const action = entry.action === 'remove' ? 'remove' : 'add'
    const name =
      entry.contact?.full_name?.trim() || entry.contact?.first_name?.trim() || null
    out.push({ phone, action, name })
  }
  return out
}
