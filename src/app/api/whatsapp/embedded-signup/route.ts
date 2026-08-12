import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireRole, toErrorResponse, UnauthorizedError, ForbiddenError } from '@/lib/auth/account'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'
import {
  listWabaPhoneNumbers,
  registerPhoneNumber,
  subscribeWabaToApp,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api'
import {
  exchangeEmbeddedSignupCode,
  generateVerifyToken,
  isEmbeddedSignupConfigured,
} from '@/lib/whatsapp/embedded-signup'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: any = null
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _adminClient
}

/**
 * POST /api/whatsapp/embedded-signup
 *
 * Completes Meta Embedded Signup (Tech Provider path):
 *   1. Exchange short-lived `code` for a business token
 *   2. Verify phone_number_id with Meta
 *   3. Encrypt + upsert whatsapp_config for the caller's account
 *   4. Subscribe the WABA to this app (and /register if PIN given)
 */
export async function POST(request: Request) {
  try {
    if (!isEmbeddedSignupConfigured()) {
      return NextResponse.json(
        {
          error:
            'Embedded Signup is not configured on this server. Set META_APP_ID, META_APP_SECRET and NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID.',
        },
        { status: 503 },
      )
    }

    const { accountId } = await requireRole('admin')
    const body = (await request.json()) as {
      code?: string
      waba_id?: string
      phone_number_id?: string
      pin?: string
      /**
       * Set when Embedded Signup finished through the WhatsApp Business app
       * onboarding flow. Those numbers arrive already registered, and Meta
       * only hands back a WABA ID.
       */
      coexistence?: boolean
    }

    const code = body.code?.trim()
    const wabaId = body.waba_id?.trim()
    const pin = body.pin?.trim()
    const coexistence = body.coexistence === true

    if (!code || !wabaId) {
      return NextResponse.json(
        {
          error:
            'code and waba_id are required (from the Meta Embedded Signup callback).',
        },
        { status: 400 },
      )
    }

    if (pin && !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 6 digits.' },
        { status: 400 },
      )
    }

    // Code TTL is ~30s — exchange before any other round trip.
    const { accessToken } = await exchangeEmbeddedSignupCode(code)

    let phoneNumberId = body.phone_number_id?.trim()
    let numberAlreadyRegistered = coexistence

    if (!phoneNumberId) {
      const numbers = await listWabaPhoneNumbers({ wabaId, accessToken })
      if (numbers.length === 0) {
        return NextResponse.json(
          {
            error:
              'Meta returned no phone number for this WhatsApp Business account. Finish adding a number in the signup flow and try again.',
          },
          { status: 400 },
        )
      }
      // Coexistence numbers are the ones already live on the business app.
      const preferred =
        numbers.find((n) => n.is_on_biz_app) ??
        numbers.find((n) => n.platform_type === 'CLOUD_API') ??
        numbers[0]
      phoneNumberId = preferred.id
      numberAlreadyRegistered = true
    }

    const { data: claimed, error: claimedError } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('account_id')
      .eq('phone_number_id', phoneNumberId)
      .neq('account_id', accountId)
      .maybeSingle()

    if (claimedError) {
      console.error('[embedded-signup] ownership check failed:', claimedError)
      return NextResponse.json(
        { error: 'Failed to validate configuration' },
        { status: 500 },
      )
    }
    if (claimed) {
      return NextResponse.json(
        {
          error:
            'This WhatsApp phone number is already linked to another account on this instance.',
        },
        { status: 409 },
      )
    }

    const phoneInfo = await verifyPhoneNumber({
      phoneNumberId,
      accessToken,
    })

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('whatsapp_config')
      .select('id, verify_token, registered_at, phone_number_id')
      .eq('account_id', accountId)
      .maybeSingle()

    let encryptedVerifyToken: string | null = null
    let plainVerifyToken: string | null = null
    if (existing?.verify_token) {
      try {
        plainVerifyToken = decrypt(existing.verify_token)
        encryptedVerifyToken = existing.verify_token
      } catch {
        plainVerifyToken = generateVerifyToken()
        encryptedVerifyToken = encrypt(plainVerifyToken)
      }
    } else {
      plainVerifyToken = generateVerifyToken()
      encryptedVerifyToken = encrypt(plainVerifyToken)
    }

    const encryptedAccessToken = encrypt(accessToken)

    let registeredAt: string | null = existing?.registered_at ?? null
    let registrationError: string | null = null
    let registrationSkipped = false

    const sameNumber =
      existing?.phone_number_id === phoneNumberId && existing?.registered_at != null

    if (numberAlreadyRegistered) {
      // Coexistence: the number is already registered for Cloud API, and
      // calling /register on it fails. Meta docs require skipping the step.
      registeredAt = registeredAt ?? new Date().toISOString()
    } else if (!sameNumber || pin) {
      if (!pin) {
        registrationSkipped = true
      } else {
        try {
          await registerPhoneNumber({
            phoneNumberId,
            accessToken,
            pin,
          })
          registeredAt = new Date().toISOString()
        } catch (err) {
          registrationError =
            err instanceof Error ? err.message : 'Unknown Meta API error'
          console.error('[embedded-signup] /register failed:', registrationError)
        }
      }
    }

    let subscribedAppsAt: string | null = null
    try {
      await subscribeWabaToApp({ wabaId, accessToken })
      subscribedAppsAt = new Date().toISOString()
    } catch (err) {
      console.warn(
        '[embedded-signup] subscribed_apps failed (non-fatal):',
        err instanceof Error ? err.message : err,
      )
    }

    if (
      !registrationError &&
      registrationSkipped &&
      registeredAt == null &&
      subscribedAppsAt != null
    ) {
      registeredAt = subscribedAppsAt
      registrationSkipped = false
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const baseRow = {
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      access_token: encryptedAccessToken,
      verify_token: encryptedVerifyToken,
      status: registrationError ? 'disconnected' : 'connected',
      connected_at: registrationError ? null : new Date().toISOString(),
      registered_at: registrationError ? null : registeredAt,
      subscribed_apps_at: subscribedAppsAt,
      last_registration_error: registrationError,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from('whatsapp_config')
        .update(baseRow)
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('whatsapp_config').insert({
        ...baseRow,
        account_id: accountId,
        user_id: user!.id,
      })
      if (error) throw error
    }

    return NextResponse.json({
      ok: true,
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      display_phone_number: phoneInfo.display_phone_number ?? null,
      verified_name: phoneInfo.verified_name ?? null,
      verify_token: plainVerifyToken,
      registration_error: registrationError,
      registration_skipped: registrationSkipped,
    })
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return toErrorResponse(err)
    }
    console.error('[embedded-signup]', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Embedded Signup failed',
      },
      { status: 400 },
    )
  }
}

/** GET — whether the server has env for Embedded Signup (for UI gating). */
export async function GET() {
  try {
    await requireRole('admin');
    return NextResponse.json({
      configured: isEmbeddedSignupConfigured(),
      appId: process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || null,
      configId: process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID || null,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
