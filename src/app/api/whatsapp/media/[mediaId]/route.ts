import { NextResponse } from 'next/server'
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { getMediaUrl, downloadMedia } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      )
    }

    const { supabase, accountId } = await getCurrentAccount()

    // A Meta media ID is not an authorization token. Only proxy an ID
    // that was persisted on a message the caller can access, then confirm
    // the message's conversation belongs to this account. This also means
    // an ID obtained from a different WhatsApp account cannot be used as a
    // bearer-like download URL here.
    const mediaPath = `/api/whatsapp/media/${mediaId}`
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('media_url', mediaPath)
      .limit(1)
      .maybeSingle()

    if (messageError) {
      console.error('Error resolving WhatsApp media message:', messageError)
      return NextResponse.json(
        { error: 'Failed to resolve media' },
        { status: 500 },
      )
    }
    if (!message) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', message.conversation_id)
      .eq('account_id', accountId)
      .maybeSingle()

    if (conversationError) {
      console.error('Error verifying WhatsApp media conversation:', conversationError)
      return NextResponse.json(
        { error: 'Failed to resolve media' },
        { status: 500 },
      )
    }
    if (!conversation) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Only load and decrypt the account credential after authorization.
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('access_token')
      .eq('account_id', accountId)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'WhatsApp not configured' },
        { status: 400 }
      )
    }

    const accessToken = decrypt(config.access_token)

    // Get the download URL from Meta
    const mediaInfo = await getMediaUrl({ mediaId, accessToken })

    // Download the binary data
    const { buffer, contentType } = await downloadMedia({
      downloadUrl: mediaInfo.url,
      accessToken,
    })

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType || mediaInfo.mimeType || 'application/octet-stream',
        // The response is authenticated and contains customer data. Never
        // let a browser, CDN, or shared proxy reuse it for another request.
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
