import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  getSubscribedApps,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api'

/**
 * GET /api/whatsapp/config/verify-registration
 *
 * Confirms the saved phone number is reachable on Meta, and — when the
 * Meta-side checks pass — marks `registered_at` locally if it was still
 * null (common for Developer/test numbers that have no 2FA PIN and thus
 * skip POST /register on save).
 *
 * Checks:
 *   1. phone_info  — GET /{phone_number_id} succeeds
 *   2. waba_subscription — our app appears in GET /{waba_id}/subscribed_apps
 *   3. registered_at — local flag; auto-promoted when (1)+(2) pass
 *
 * Returns 200 in every case so the UI can render diagnostic detail
 * rather than a generic error toast. The combined `live` flag is
 * what the UI badges on.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // whatsapp_config is one-row-per-account post-017. Resolve the
  // caller's account_id so a teammate who joined an existing account
  // sees the same registration state as the admin who set it up.
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .maybeSingle()
  const accountId = profile?.account_id as string | undefined
  if (!accountId) {
    return NextResponse.json({
      live: false,
      checks: { config_exists: false },
      message: 'Your profile is not linked to an account.',
    })
  }

  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle()

  if (!config) {
    return NextResponse.json({
      live: false,
      checks: { config_exists: false },
      message: 'No WhatsApp configuration saved yet.',
    })
  }

  let accessToken: string
  try {
    accessToken = decrypt(config.access_token)
  } catch {
    return NextResponse.json({
      live: false,
      checks: {
        config_exists: true,
        token_decryptable: false,
      },
      message:
        'Stored access token can\'t be decrypted — likely ENCRYPTION_KEY changed. Re-enter the token to repair.',
    })
  }

  const checks: {
    config_exists: boolean
    token_decryptable: boolean
    phone_metadata_ok: boolean
    waba_subscribed_to_app: boolean | null
    locally_marked_registered: boolean
  } = {
    config_exists: true,
    token_decryptable: true,
    phone_metadata_ok: false,
    waba_subscribed_to_app: null,
    locally_marked_registered: config.registered_at != null,
  }
  const errors: string[] = []

  // 1. Phone metadata
  try {
    await verifyPhoneNumber({
      phoneNumberId: config.phone_number_id,
      accessToken,
    })
    checks.phone_metadata_ok = true
  } catch (err) {
    errors.push(
      `Phone metadata check failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 2. WABA subscription — only meaningful if we have a waba_id
  if (config.waba_id) {
    try {
      const subs = await getSubscribedApps({
        wabaId: config.waba_id,
        accessToken,
      })
      // Meta returns the apps subscribed to this WABA. If the list
      // is non-empty, OUR app is in there (the access_token we used
      // belongs to our app — Meta wouldn't return data for an app
      // the token can't see). Treat any entry as success.
      checks.waba_subscribed_to_app = subs.length > 0
      if (!checks.waba_subscribed_to_app) {
        errors.push(
          'WABA has no subscribed apps. Re-save the configuration to subscribe.',
        )
      }
    } catch (err) {
      errors.push(
        `WABA subscription check failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  } else {
    errors.push(
      'No WABA ID on file — webhooks can\'t be wired without it. Add it in the form and re-save.',
    )
  }

  // Meta-side readiness is what matters for inbound delivery. The local
  // registered_at flag used to be both a prerequisite for `live` AND
  // never written by this endpoint — so test numbers (no PIN → save
  // leaves registered_at null) were stuck on "Not registered" forever
  // even after the WABA was subscribed and the webhook was live in Meta.
  const metaReady =
    checks.phone_metadata_ok && (checks.waba_subscribed_to_app ?? false)

  let registeredAt: string | null = config.registered_at ?? null
  let promoted = false
  if (metaReady && registeredAt == null) {
    registeredAt = new Date().toISOString()
    const { error: promoteError } = await supabase
      .from('whatsapp_config')
      .update({
        registered_at: registeredAt,
        last_registration_error: null,
        updated_at: registeredAt,
      })
      .eq('account_id', accountId)
    if (promoteError) {
      errors.push(
        `Could not mark registration locally: ${promoteError.message}`,
      )
    } else {
      promoted = true
      checks.locally_marked_registered = true
    }
  }

  const live = metaReady && checks.locally_marked_registered

  return NextResponse.json({
    live,
    promoted,
    checks,
    errors,
    last_registration_error: promoted
      ? null
      : (config.last_registration_error ?? null),
    registered_at: registeredAt,
    subscribed_apps_at: config.subscribed_apps_at ?? null,
  })
}
