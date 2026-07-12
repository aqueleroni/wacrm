// ============================================================
// Interactive message payload — shared shape + validation.
//
// The persisted, round-trippable representation of a WhatsApp
// interactive message (reply buttons or a list). This is the single
// source of truth used by:
//   - the inbox composer + automation "send interactive" builders,
//   - the send-message core + automation engine (send + persist),
//   - the message bubble + preview (render),
//   - quick replies (store an interactive snippet).
//
// The field names (`id`/`title`/`description` on buttons/rows) match
// `meta-api.ts`'s `InteractiveButton` / `InteractiveListRow` /
// `InteractiveListSection` on purpose, so a payload maps straight onto
// the Meta send args with no translation.
//
// `validateInteractivePayload` mirrors the throws already inside the
// meta-api senders, but returns a result object so callers (API routes,
// activation checks) can surface a clean error to the user *before* the
// network call rather than turning a bad payload into a 400 from Meta
// mid-conversation.
//
// Failures carry a stable `code` (+ optional `params`) for i18n, and an
// English `error` string as a fallback for APIs/logs without a translator.
// ============================================================

import { INTERACTIVE_LIMITS } from './meta-api'

export interface InteractiveButton {
  /** Stable id echoed back in the webhook when tapped. */
  id: string
  /** Visible label (≤ 20 chars per Meta). */
  title: string
}

export interface InteractiveButtonsPayload {
  kind: 'buttons'
  /** Body text shown above the buttons (≤ 1024 chars). */
  body: string
  /** Optional plain-text header (≤ 60 chars). */
  header?: string
  /** Optional grey footer line (≤ 60 chars). */
  footer?: string
  /** 1–3 buttons. */
  buttons: InteractiveButton[]
}

export interface InteractiveListRow {
  /** Stable id echoed back in the webhook when selected. */
  id: string
  /** Row title (≤ 24 chars per Meta). */
  title: string
  /** Optional secondary line (≤ 72 chars). */
  description?: string
}

export interface InteractiveListSection {
  /** Optional section header shown above its rows. */
  title?: string
  rows: InteractiveListRow[]
}

export interface InteractiveListPayload {
  kind: 'list'
  body: string
  header?: string
  footer?: string
  /** Label of the tap-to-expand button on the message bubble (≤ 20 chars). */
  button_label: string
  /** 1–10 rows TOTAL across all sections. */
  sections: InteractiveListSection[]
}

export type InteractiveMessagePayload =
  | InteractiveButtonsPayload
  | InteractiveListPayload

export type InteractiveErrorCode =
  | 'payload_required'
  | 'body_required'
  | 'body_too_long'
  | 'header_too_long'
  | 'footer_too_long'
  | 'buttons_min'
  | 'buttons_max'
  | 'button_id_required'
  | 'button_id_duplicate'
  | 'button_label_required'
  | 'button_label_too_long'
  | 'list_button_required'
  | 'list_button_too_long'
  | 'list_section_min'
  | 'list_section_max'
  | 'list_section_rows_required'
  | 'list_row_id_required'
  | 'list_row_id_duplicate'
  | 'list_row_title_required'
  | 'list_row_title_too_long'
  | 'list_row_description_too_long'
  | 'list_row_min'
  | 'list_row_max'
  | 'kind_invalid'

export type InteractiveErrorParams = Record<string, string | number>

export type InteractiveValidation =
  | { ok: true }
  | {
      ok: false
      code: InteractiveErrorCode
      params?: InteractiveErrorParams
      /** English fallback for APIs / logs without a translator. */
      error: string
    }

type TranslateFn = (
  key: string,
  params?: InteractiveErrorParams,
) => string

/** Resolve a failed validation to a localized message. */
export function translateInteractiveError(
  t: TranslateFn,
  result: Extract<InteractiveValidation, { ok: false }>,
): string {
  return t(`interactive.errors.${result.code}`, result.params)
}

function ok(): InteractiveValidation {
  return { ok: true }
}

const EN_ERRORS: Record<
  InteractiveErrorCode,
  string | ((p: InteractiveErrorParams) => string)
> = {
  payload_required: 'Interactive message payload is required.',
  body_required: 'Interactive message body text is required.',
  body_too_long: (p) =>
    `Body text exceeds the ${p.max}-character limit.`,
  header_too_long: (p) =>
    `Header exceeds the ${p.max}-character limit.`,
  footer_too_long: (p) =>
    `Footer exceeds the ${p.max}-character limit.`,
  buttons_min: 'Add at least one reply button.',
  buttons_max: (p) =>
    `A reply-button message allows at most ${p.max} buttons.`,
  button_id_required: 'Every button needs an id.',
  button_id_duplicate: (p) => `Duplicate button id "${p.id}".`,
  button_label_required: 'Every button needs a label.',
  button_label_too_long: (p) =>
    `Button label "${p.title}" exceeds the ${p.max}-character limit.`,
  list_button_required: 'The list needs a button label.',
  list_button_too_long: (p) =>
    `List button label exceeds the ${p.max}-character limit.`,
  list_section_min: 'Add at least one list section.',
  list_section_max: (p) =>
    `A list allows at most ${p.max} sections.`,
  list_section_rows_required: 'Every list section needs rows.',
  list_row_id_required: 'Every list row needs an id.',
  list_row_id_duplicate: (p) => `Duplicate list row id "${p.id}".`,
  list_row_title_required: 'Every list row needs a title.',
  list_row_title_too_long: (p) =>
    `List row title "${p.title}" exceeds the ${p.max}-character limit.`,
  list_row_description_too_long: (p) =>
    `List row description exceeds the ${p.max}-character limit.`,
  list_row_min: 'Add at least one list row.',
  list_row_max: (p) =>
    `A list allows at most ${p.max} rows in total.`,
  kind_invalid: 'Interactive message must be reply buttons or a list.',
}

function fail(
  code: InteractiveErrorCode,
  params?: InteractiveErrorParams,
): InteractiveValidation {
  const template = EN_ERRORS[code]
  const error =
    typeof template === 'function' ? template(params ?? {}) : template
  return { ok: false, code, params, error }
}

function validateHeaderFooter(
  header: string | undefined,
  footer: string | undefined,
): InteractiveValidation {
  if (header && header.length > INTERACTIVE_LIMITS.headerTextMaxLength) {
    return fail('header_too_long', {
      max: INTERACTIVE_LIMITS.headerTextMaxLength,
    })
  }
  if (footer && footer.length > INTERACTIVE_LIMITS.footerMaxLength) {
    return fail('footer_too_long', {
      max: INTERACTIVE_LIMITS.footerMaxLength,
    })
  }
  return ok()
}

/**
 * Validate an interactive payload against Meta's hard limits + our
 * structural rules (non-empty ids/titles, unique ids). Returns a result
 * object rather than throwing so callers (API routes, activation checks)
 * can surface a clean error to the user *before* the network call.
 *
 * `unknown` in, narrowed here, so it's safe to call straight on a parsed
 * request body.
 */
export function validateInteractivePayload(
  payload: unknown,
): InteractiveValidation {
  if (!payload || typeof payload !== 'object') {
    return fail('payload_required')
  }
  const p = payload as Partial<InteractiveMessagePayload>

  if (typeof p.body !== 'string' || p.body.trim() === '') {
    return fail('body_required')
  }
  if (p.body.length > INTERACTIVE_LIMITS.bodyMaxLength) {
    return fail('body_too_long', { max: INTERACTIVE_LIMITS.bodyMaxLength })
  }
  const hf = validateHeaderFooter(p.header, p.footer)
  if (!hf.ok) return hf

  if (p.kind === 'buttons') {
    const buttons = (p as InteractiveButtonsPayload).buttons
    if (!Array.isArray(buttons) || buttons.length < 1) {
      return fail('buttons_min')
    }
    if (buttons.length > INTERACTIVE_LIMITS.maxButtons) {
      return fail('buttons_max', { max: INTERACTIVE_LIMITS.maxButtons })
    }
    const seen = new Set<string>()
    for (const b of buttons) {
      if (!b || typeof b.id !== 'string' || b.id.trim() === '') {
        return fail('button_id_required')
      }
      if (seen.has(b.id)) {
        return fail('button_id_duplicate', { id: b.id })
      }
      seen.add(b.id)
      if (typeof b.title !== 'string' || b.title.trim() === '') {
        return fail('button_label_required')
      }
      if (b.title.length > INTERACTIVE_LIMITS.buttonTitleMaxLength) {
        return fail('button_label_too_long', {
          title: b.title,
          max: INTERACTIVE_LIMITS.buttonTitleMaxLength,
        })
      }
    }
    return ok()
  }

  if (p.kind === 'list') {
    const list = p as InteractiveListPayload
    if (
      typeof list.button_label !== 'string' ||
      list.button_label.trim() === ''
    ) {
      return fail('list_button_required')
    }
    if (list.button_label.length > INTERACTIVE_LIMITS.buttonTitleMaxLength) {
      return fail('list_button_too_long', {
        max: INTERACTIVE_LIMITS.buttonTitleMaxLength,
      })
    }
    if (!Array.isArray(list.sections) || list.sections.length < 1) {
      return fail('list_section_min')
    }
    if (list.sections.length > INTERACTIVE_LIMITS.maxListSections) {
      return fail('list_section_max', {
        max: INTERACTIVE_LIMITS.maxListSections,
      })
    }
    const seen = new Set<string>()
    let total = 0
    for (const section of list.sections) {
      if (!section || !Array.isArray(section.rows)) {
        return fail('list_section_rows_required')
      }
      for (const row of section.rows) {
        total++
        if (!row || typeof row.id !== 'string' || row.id.trim() === '') {
          return fail('list_row_id_required')
        }
        if (seen.has(row.id)) {
          return fail('list_row_id_duplicate', { id: row.id })
        }
        seen.add(row.id)
        if (typeof row.title !== 'string' || row.title.trim() === '') {
          return fail('list_row_title_required')
        }
        if (row.title.length > INTERACTIVE_LIMITS.listRowTitleMaxLength) {
          return fail('list_row_title_too_long', {
            title: row.title,
            max: INTERACTIVE_LIMITS.listRowTitleMaxLength,
          })
        }
        if (
          row.description &&
          row.description.length >
            INTERACTIVE_LIMITS.listRowDescriptionMaxLength
        ) {
          return fail('list_row_description_too_long', {
            max: INTERACTIVE_LIMITS.listRowDescriptionMaxLength,
          })
        }
      }
    }
    if (total < 1) return fail('list_row_min')
    if (total > INTERACTIVE_LIMITS.maxListRowsTotal) {
      return fail('list_row_max', {
        max: INTERACTIVE_LIMITS.maxListRowsTotal,
      })
    }
    return ok()
  }

  return fail('kind_invalid')
}

/**
 * Short single-line summary used for `conversations.last_message_text`
 * and quick-reply list rows — the body, trimmed, or a sensible fallback.
 */
export function interactivePayloadPreviewText(
  payload: InteractiveMessagePayload,
): string {
  const body = payload.body?.trim()
  if (body) return body
  return payload.kind === 'buttons' ? '[buttons]' : '[list]'
}
