import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fan out an 'ai_handoff' notification to every member of the account
 * when the auto-reply agent hands a conversation off. Without this the
 * customer sits unanswered until someone happens to open the inbox.
 *
 * Best-effort: called with the service-role client (the webhook has no
 * auth.uid()), inserts one row per member, and NEVER throws — a failed
 * notification must not affect the reply path. `notifications` has no
 * client INSERT policy, so the service role is the only writer.
 */
export async function notifyHandoff(
  db: SupabaseClient,
  accountId: string,
  conversationId: string,
  contactId: string | null,
): Promise<void> {
  try {
    const { data: members } = await db
      .from('profiles')
      .select('user_id')
      .eq('account_id', accountId)
    if (!members?.length) return

    let contactName = 'um contato'
    if (contactId) {
      const { data: contact } = await db
        .from('contacts')
        .select('name, phone')
        .eq('id', contactId)
        .maybeSingle()
      contactName =
        (contact?.name as string)?.trim() ||
        (contact?.phone as string) ||
        contactName
    }

    const rows = members.map((m) => ({
      account_id: accountId,
      user_id: m.user_id as string,
      type: 'ai_handoff',
      conversation_id: conversationId,
      contact_id: contactId,
      actor_user_id: null,
      title: 'IA encaminhou para atendimento humano',
      body: `A IA não pôde responder com segurança a conversa com ${contactName} e desativou a resposta automática. Alguém precisa assumir.`,
    }))

    await db.from('notifications').insert(rows)
  } catch (err) {
    console.error('[ai handoff-notify] failed:', err)
  }
}
