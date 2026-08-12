import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getCurrentAccount, toErrorResponse } = vi.hoisted(() => ({
  getCurrentAccount: vi.fn(),
  toErrorResponse: vi.fn(),
}))

const { getMediaUrl, downloadMedia } = vi.hoisted(() => ({
  getMediaUrl: vi.fn(),
  downloadMedia: vi.fn(),
}))

vi.mock('@/lib/auth/account', () => ({ getCurrentAccount, toErrorResponse }))
vi.mock('@/lib/whatsapp/meta-api', () => ({ getMediaUrl, downloadMedia }))
vi.mock('@/lib/whatsapp/encryption', () => ({
  decrypt: vi.fn(() => 'plaintext-token'),
}))

let storedMedia: { conversation_id: string } | null = null
let conversation: { id: string } | null = { id: 'conv-1' }

function makeSupabaseMock() {
  return {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {}
      const chain = () => builder
      for (const method of ['select', 'eq', 'limit']) builder[method] = vi.fn(chain)
      builder.maybeSingle = vi.fn(async () => {
        if (table === 'messages') return { data: storedMedia, error: null }
        if (table === 'conversations') return { data: conversation, error: null }
        if (table === 'whatsapp_config') {
          return { data: { access_token: 'enc-token' }, error: null }
        }
        return { data: null, error: null }
      })
      builder.single = builder.maybeSingle
      return builder
    }),
  }
}

const supabase = makeSupabaseMock()

import { GET } from './route'

function requestMedia(mediaId = 'media-123') {
  return GET(new Request(`http://localhost/api/whatsapp/media/${mediaId}`), {
    params: Promise.resolve({ mediaId }),
  })
}

describe('GET /api/whatsapp/media/[mediaId]', () => {
  beforeEach(() => {
    storedMedia = { conversation_id: 'conv-1' }
    conversation = { id: 'conv-1' }
    getCurrentAccount.mockResolvedValue({ supabase, accountId: 'acct-1' })
    toErrorResponse.mockImplementation(() =>
      Response.json({ error: 'Internal server error' }, { status: 500 }),
    )
    getMediaUrl.mockResolvedValue({
      url: 'https://lookaside.fbsbx.com/media',
      mimeType: 'image/jpeg',
    })
    downloadMedia.mockResolvedValue({
      buffer: Buffer.from('image-bytes'),
      contentType: 'image/jpeg',
    })
  })

  it('does not call Meta for an ID not stored on an accessible message', async () => {
    storedMedia = null

    const res = await requestMedia()

    expect(res.status).toBe(404)
    expect(getMediaUrl).not.toHaveBeenCalled()
    expect(downloadMedia).not.toHaveBeenCalled()
  })

  it('does not call Meta when the stored message is outside this account', async () => {
    conversation = null

    const res = await requestMedia()

    expect(res.status).toBe(404)
    expect(getMediaUrl).not.toHaveBeenCalled()
  })

  it('proxies only an account-owned media ID and disables shared caching', async () => {
    const res = await requestMedia()

    expect(res.status).toBe(200)
    expect(getMediaUrl).toHaveBeenCalledWith({
      mediaId: 'media-123',
      accessToken: 'plaintext-token',
    })
    expect(res.headers.get('Cache-Control')).toBe('private, no-store, max-age=0')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(await res.text()).toBe('image-bytes')
  })
})
