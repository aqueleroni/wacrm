import { describe, expect, it } from 'vitest'
import {
  historyStatusToMirrored,
  isCoexistenceWebhookField,
  parseAddressBookSync,
  parseHistory,
  parseHistoryMedia,
  parseMessageEchoes,
} from './coexistence'

const metadata = { display_phone_number: '15550783881', phone_number_id: '106540352242922' }

describe('isCoexistenceWebhookField', () => {
  it('matches the three coexistence fields only', () => {
    expect(isCoexistenceWebhookField('smb_message_echoes')).toBe(true)
    expect(isCoexistenceWebhookField('history')).toBe(true)
    expect(isCoexistenceWebhookField('smb_app_state_sync')).toBe(true)
    expect(isCoexistenceWebhookField('messages')).toBe(false)
    expect(isCoexistenceWebhookField('message_template_status_update')).toBe(false)
  })
})

describe('parseMessageEchoes', () => {
  it('maps an echo to a business-sent message addressed to the customer', () => {
    const [echo] = parseMessageEchoes({
      messaging_product: 'whatsapp',
      metadata,
      message_echoes: [
        {
          from: '15550783881',
          to: '+1 650 555 1234',
          id: 'wamid.ECHO',
          timestamp: '1739321024',
          type: 'text',
          text: { body: 'On my way' },
        },
      ],
    })
    expect(echo).toMatchObject({
      id: 'wamid.ECHO',
      customerPhone: '16505551234',
      fromBusiness: true,
      status: 'sent',
      type: 'text',
    })
    expect(echo.message.text).toEqual({ body: 'On my way' })
  })

  it('drops reactions and malformed entries', () => {
    expect(
      parseMessageEchoes({
        message_echoes: [
          { from: '1', to: '2', id: 'a', timestamp: '1', type: 'reaction' },
          { from: '1', to: '2', type: 'text' },
          { from: '1', id: 'b', timestamp: '1', type: 'text' },
        ],
      })
    ).toEqual([])
  })

  it('returns [] for a payload without echoes', () => {
    expect(parseMessageEchoes({})).toEqual([])
    expect(parseMessageEchoes(null)).toEqual([])
  })
})

describe('parseHistory', () => {
  const value = {
    messaging_product: 'whatsapp',
    metadata,
    history: [
      {
        metadata: { phase: 0, chunk_order: 1, progress: 55 },
        threads: [
          {
            id: '16505551234',
            messages: [
              {
                from: '15550783881',
                id: 'wamid.1',
                timestamp: '1739230955',
                type: 'text',
                text: { body: 'Here you go' },
                history_context: { status: 'READ' },
              },
              {
                from: '15550783881',
                id: 'wamid.2',
                timestamp: '1739230970',
                type: 'media_placeholder',
                history_context: { status: 'PLAYED' },
              },
              {
                from: '16505551234',
                id: 'wamid.3',
                timestamp: '1739230971',
                type: 'text',
                text: { body: 'Thanks!' },
                history_context: { status: 'pending' },
              },
              {
                from: '16505551234',
                id: 'wamid.4',
                timestamp: '1739230972',
                type: 'errors',
                errors: [{ code: 131051 }],
              },
            ],
          },
        ],
      },
    ],
  }

  it('splits business and customer messages by the thread id', () => {
    const parsed = parseHistory(value)
    expect(parsed.declined).toBe(false)
    expect(parsed.progress).toBe(55)
    expect(parsed.threads).toHaveLength(1)
    const [thread] = parsed.threads
    expect(thread.customerPhone).toBe('16505551234')
    expect(thread.messages.map((m) => [m.id, m.fromBusiness, m.status])).toEqual([
      ['wamid.1', true, 'read'],
      ['wamid.2', true, 'read'],
      ['wamid.3', false, 'delivered'],
    ])
  })

  it('trusts history_context.from_me when present', () => {
    const parsed = parseHistory({
      history: [
        {
          threads: [
            {
              id: '16505551234',
              messages: [
                {
                  from: '16505551234',
                  id: 'wamid.x',
                  timestamp: '1',
                  type: 'text',
                  text: { body: 'hi' },
                  history_context: { from_me: true, status: 'delivered' },
                },
              ],
            },
          ],
        },
      ],
    })
    expect(parsed.threads[0].messages[0].fromBusiness).toBe(true)
  })

  it('flags declined history sharing', () => {
    const parsed = parseHistory({
      metadata,
      history: [{ errors: [{ code: 2593109, title: 'History sync is turned off' }] }],
    })
    expect(parsed.declined).toBe(true)
    expect(parsed.threads).toEqual([])
  })
})

describe('historyStatusToMirrored', () => {
  it('maps Meta statuses onto the messages.status CHECK values', () => {
    expect(historyStatusToMirrored('DELIVERED', true)).toBe('delivered')
    expect(historyStatusToMirrored('ERROR', true)).toBe('failed')
    expect(historyStatusToMirrored('PENDING', true)).toBe('sent')
    expect(historyStatusToMirrored('SENT', false)).toBe('delivered')
    expect(historyStatusToMirrored(undefined, false)).toBe('delivered')
  })
})

describe('parseHistoryMedia', () => {
  it('returns the media follow-up messages', () => {
    const media = parseHistoryMedia({
      metadata,
      messages: [
        {
          from: '16505551234',
          id: 'wamid.2',
          timestamp: '1738796547',
          type: 'image',
          image: { id: '24230790383178626', mime_type: 'image/jpeg', caption: 'Photo' },
        },
      ],
    })
    expect(media).toHaveLength(1)
    expect(media[0].id).toBe('wamid.2')
  })

  it('ignores history payloads without a messages array', () => {
    expect(parseHistoryMedia({ history: [] })).toEqual([])
  })
})

describe('parseAddressBookSync', () => {
  it('maps adds and removes with the saved name', () => {
    expect(
      parseAddressBookSync({
        metadata,
        state_sync: [
          {
            type: 'contact',
            action: 'add',
            contact: { full_name: 'Pablo Morales', first_name: 'Pablo', phone_number: '16505551234' },
            metadata: { timestamp: '1738346006' },
          },
          {
            type: 'contact',
            action: 'remove',
            contact: { phone_number: '+91 77150 78842' },
            metadata: { timestamp: '0' },
          },
          { type: 'contact', action: 'add', contact: {} },
        ],
      })
    ).toEqual([
      { phone: '16505551234', action: 'add', name: 'Pablo Morales' },
      { phone: '917715078842', action: 'remove', name: null },
    ])
  })
})
