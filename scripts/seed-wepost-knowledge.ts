/**
 * Etapa 0 — seed missing Wepost KB documents for an account.
 *
 * Usage (from repo root, requires .env.local with Supabase service role):
 *   npx tsx scripts/seed-wepost-knowledge.ts
 *   npx tsx scripts/seed-wepost-knowledge.ts --account-id=<uuid>
 *
 * Idempotent: skips documents whose title already exists for the account.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { WEPOST_KNOWLEDGE_DOCUMENTS } from '../src/lib/ai/presets/wepost'
import { ingestDocument } from '../src/lib/ai/knowledge'

const DEFAULT_ACCOUNT_ID = '4e559497-1e19-46db-bdfa-1306ee66d22b'

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) {
    console.error('Missing .env.local — copy from .env.local.example')
    process.exit(1)
  }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function accountIdFromArgs(): string {
  const arg = process.argv.find((a) => a.startsWith('--account-id='))
  if (arg) return arg.split('=')[1]?.trim() || DEFAULT_ACCOUNT_ID
  return process.env.WEPOST_SEED_ACCOUNT_ID?.trim() || DEFAULT_ACCOUNT_ID
}

async function main() {
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
    process.exit(1)
  }

  const accountId = accountIdFromArgs()
  const db = createClient(url, key)

  const { data: existing, error: listErr } = await db
    .from('ai_knowledge_documents')
    .select('id, title')
    .eq('account_id', accountId)
  if (listErr) {
    console.error('Failed to list documents:', listErr.message)
    process.exit(1)
  }

  const byTitle = new Map((existing ?? []).map((d) => [d.title, d.id]))
  let inserted = 0
  let skipped = 0

  for (const doc of WEPOST_KNOWLEDGE_DOCUMENTS) {
    if (byTitle.has(doc.title)) {
      console.log(`skip  ${doc.title}`)
      skipped++
      continue
    }

    const { data: row, error: insErr } = await db
      .from('ai_knowledge_documents')
      .insert({
        account_id: accountId,
        title: doc.title,
        content: doc.content,
      })
      .select('id')
      .single()

    if (insErr || !row) {
      console.error(`Failed to insert "${doc.title}":`, insErr?.message)
      process.exit(1)
    }

    await ingestDocument(db, accountId, { embeddingsApiKey: null }, row.id, doc.content)
    console.log(`added ${doc.title} (${row.id})`)
    inserted++
  }

  const { count } = await db
    .from('ai_knowledge_documents')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)

  console.log(`\nDone. inserted=${inserted} skipped=${skipped} total=${count ?? '?'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
