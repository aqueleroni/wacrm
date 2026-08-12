import { randomBytes } from 'node:crypto'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export interface ExchangeEmbeddedSignupCodeResult {
  accessToken: string
}

/**
 * Exchange the short-lived Embedded Signup authorization `code`
 * (≤30s TTL) for a business integration system-user access token.
 */
export async function exchangeEmbeddedSignupCode(
  code: string,
): Promise<ExchangeEmbeddedSignupCodeResult> {
  const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error(
      'META_APP_ID and META_APP_SECRET must be set to complete Embedded Signup.',
    )
  }

  const url = new URL(`${META_API_BASE}/oauth/access_token`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('code', code)

  const response = await fetch(url.toString(), { method: 'GET' })
  const data = (await response.json()) as {
    access_token?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error?.message ||
        `Failed to exchange Embedded Signup code (${response.status})`,
    )
  }

  return { accessToken: data.access_token }
}

/** Random webhook verify token for newly connected accounts. */
export function generateVerifyToken(): string {
  return randomBytes(24).toString('base64url')
}

export function isEmbeddedSignupConfigured(): boolean {
  const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID
  const configId = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID
  const appSecret = process.env.META_APP_SECRET
  return Boolean(appId && configId && appSecret)
}
