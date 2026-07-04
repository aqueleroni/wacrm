import type { SupabaseClient } from '@supabase/supabase-js'
import { promptLocale, type PromptLocale } from './prompt-scaffold'

export interface CrmContextParts {
  lines: string[]
}

interface ContactRow {
  name: string | null
  phone: string
  email: string | null
  company: string | null
}

interface DealRow {
  title: string
  value: number | string
  currency: string | null
  status: string | null
  stage: { name: string; pipeline: { name: string } | null } | null
}

/**
 * Load CRM facts about a contact for prompt injection. Best-effort — returns
 * null when contactId is missing or the contact is not found.
 */
export async function buildCrmContext(
  db: SupabaseClient,
  accountId: string,
  contactId: string | null | undefined,
): Promise<CrmContextParts | null> {
  if (!contactId) return null

  try {
    const { data: contact, error: contactErr } = await db
      .from('contacts')
      .select('name, phone, email, company')
      .eq('account_id', accountId)
      .eq('id', contactId)
      .maybeSingle()

    if (contactErr || !contact) return null

    const row = contact as ContactRow
    const lines: string[] = []

    if (row.name?.trim()) lines.push(`Nome: ${row.name.trim()}`)
    if (row.phone?.trim()) lines.push(`Telefone: ${row.phone.trim()}`)
    if (row.email?.trim()) lines.push(`E-mail: ${row.email.trim()}`)
    if (row.company?.trim()) lines.push(`Empresa: ${row.company.trim()}`)

    const [tagsRes, fieldsRes, noteRes, dealsRes] = await Promise.all([
      db
        .from('contact_tags')
        .select('tags(name)')
        .eq('contact_id', contactId),
      db
        .from('contact_custom_values')
        .select('value, custom_fields(field_name)')
        .eq('contact_id', contactId),
      db
        .from('contact_notes')
        .select('note_text')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from('deals')
        .select(
          'title, value, currency, status, stage:pipeline_stages(name, pipeline:pipelines(name))',
        )
        .eq('account_id', accountId)
        .eq('contact_id', contactId)
        .order('updated_at', { ascending: false })
        .limit(5),
    ])

    const tagNames = (tagsRes.data ?? [])
      .map((t) => {
        const tags = t.tags as { name?: string } | { name?: string }[] | null
        if (Array.isArray(tags)) return tags[0]?.name
        return tags?.name
      })
      .filter(Boolean) as string[]
    if (tagNames.length) lines.push(`Tags: ${tagNames.join(', ')}`)

    const fieldLines = (fieldsRes.data ?? [])
      .map((f) => {
        const cf = f.custom_fields as { field_name?: string } | { field_name?: string }[] | null
        const name = Array.isArray(cf) ? cf[0]?.field_name : cf?.field_name
        const val = typeof f.value === 'string' ? f.value.trim() : ''
        if (!name || !val) return null
        return `${name}: ${val}`
      })
      .filter(Boolean) as string[]
    if (fieldLines.length) lines.push(`Campos personalizados: ${fieldLines.join('; ')}`)

    const noteText =
      noteRes.data && typeof (noteRes.data as { note_text?: string }).note_text === 'string'
        ? (noteRes.data as { note_text: string }).note_text.trim()
        : ''
    if (noteText) {
      const clipped = noteText.length > 280 ? `${noteText.slice(0, 277)}…` : noteText
      lines.push(`Última nota interna da equipe: ${clipped}`)
    }

    const dealLines = (dealsRes.data ?? [])
      .map((d) => formatDealLine(parseDealRow(d)))
      .filter(Boolean) as string[]
    if (dealLines.length) {
      lines.push(`Negócios no funil:\n${dealLines.map((l) => `- ${l}`).join('\n')}`)
    }

    if (lines.length === 0) return null

    if (row.name?.trim()) {
      lines.push(
        'Ao cumprimentar ou personalizar, use o nome do cliente quando soar natural — sem exagerar.',
      )
    }

    return { lines }
  } catch (err) {
    console.error('[ai crm-context] build failed:', err)
    return null
  }
}

function parseDealRow(raw: unknown): DealRow {
  const d = raw as {
    title?: string
    value?: number | string
    currency?: string | null
    status?: string | null
    stage?: { name?: string; pipeline?: { name?: string } | { name?: string }[] | null } | { name?: string; pipeline?: { name?: string } | { name?: string }[] | null }[] | null
  }
  const stageRaw = d.stage
  const stageObj = Array.isArray(stageRaw) ? stageRaw[0] : stageRaw
  const pipelineRaw = stageObj?.pipeline
  const pipelineObj = Array.isArray(pipelineRaw) ? pipelineRaw[0] : pipelineRaw
  return {
    title: d.title ?? '',
    value: d.value ?? 0,
    currency: d.currency ?? null,
    status: d.status ?? null,
    stage: stageObj?.name
      ? { name: stageObj.name, pipeline: pipelineObj?.name ? { name: pipelineObj.name } : null }
      : null,
  }
}

function formatDealLine(deal: DealRow): string | null {
  const title = deal.title?.trim()
  if (!title) return null
  const stageName = deal.stage?.name?.trim()
  const pipelineName = deal.stage?.pipeline?.name?.trim()
  const funnel =
    pipelineName && stageName
      ? `${pipelineName} / ${stageName}`
      : stageName || pipelineName || null
  const value = Number(deal.value)
  const valuePart =
    Number.isFinite(value) && value > 0
      ? ` (${deal.currency ?? 'BRL'} ${value.toLocaleString('pt-BR')})`
      : ''
  const status = deal.status && deal.status !== 'open' ? ` [${deal.status}]` : ''
  return funnel ? `"${title}" — ${funnel}${valuePart}${status}` : `"${title}"${valuePart}${status}`
}

/** Render CRM parts as a system-prompt block (locale-aware heading). */
export function formatCrmContextBlock(
  parts: CrmContextParts | null,
  locale: PromptLocale = promptLocale(),
): string | null {
  if (!parts?.lines.length) return null
  const heading =
    locale === 'pt-BR'
      ? 'CONTEXTO DO CLIENTE (CRM — use para personalizar; nunca diga ao cliente que viu "CRM" ou "sistema"):'
      : 'CUSTOMER CONTEXT (CRM — use to personalize; never tell the customer you saw "CRM" or a "system"):'
  return `${heading}\n${parts.lines.map((l) => `- ${l}`).join('\n')}`
}
