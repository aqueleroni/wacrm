import { describe, expect, it } from 'vitest'
import { translateWhatsAppSendError, translateWhatsAppConnectionError } from './send-error-label'
import { messagesPtBR } from '@/i18n/locales/pt-BR'

function t(key: string, params?: Record<string, string | number>): string {
  let text = messagesPtBR[key] ?? key
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (_, k: string) =>
      params[k] !== undefined ? String(params[k]) : `{${k}}`,
    )
  }
  return text
}

describe('translateWhatsAppSendError', () => {
  it('localizes Meta #131030 recipient-not-allowed', () => {
    const out = translateWhatsAppSendError(
      'Meta API error: (#131030) Recipient phone number not in allowed list',
      t,
    )
    expect(out).toBe(messagesPtBR['inbox.thread.errors.meta.recipientNotAllowed'])
    expect(out).not.toMatch(/Recipient phone number/)
  })

  it('localizes network error', () => {
    expect(translateWhatsAppSendError('network error', t)).toBe(
      messagesPtBR['inbox.thread.errors.network'],
    )
  })

  it('wraps unknown Meta API errors with PT prefix', () => {
    expect(translateWhatsAppSendError('Meta API error: something odd', t)).toBe(
      'Erro da API Meta: something odd',
    )
  })

  it('passes through unrecognized messages', () => {
    expect(translateWhatsAppSendError('HTTP 503', t)).toBe('HTTP 503')
  })
})

describe('translateWhatsAppConnectionError', () => {
  it('localizes expired Meta access token', () => {
    const raw =
      'Meta API rejected the credentials: Error validating access token: Session has expired on Sunday, 19-Jul-26 08:00:00 PDT.'
    expect(translateWhatsAppConnectionError(raw, t)).toBe(
      messagesPtBR['settings.whatsapp.connection.tokenExpired'],
    )
  })
})
