# Etapa 0 — Variáveis de ambiente (agente de IA)

Referência rápida para dev local. Detalhes em `.env.local.example`.

## Obrigatórias (app + IA)

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard / RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook auto-reply, seed KB, cron futuro |
| `ENCRYPTION_KEY` | Decrypt `api_key` em `ai_configs` (64 hex chars) |

Sem `ENCRYPTION_KEY` correto, Playground retorna `key_decrypt_failed`.

## IA — opcionais (com defaults)

| Variável | Default | Efeito |
|----------|---------|--------|
| `AI_REQUEST_TIMEOUT_MS` | `30000` | Timeout por chamada ao provedor |
| `AI_CONTEXT_MESSAGE_LIMIT` | `20` | Mensagens recentes no contexto |

## Por conta (Settings UI, não env)

| Campo | Onde |
|-------|------|
| `api_key` | OpenAI ou Anthropic (BYO) |
| `embeddings_api_key` | OpenAI — **habilita busca semântica na KB** |
| `system_prompt` | Persona Gabriella |
| `model` | ex. `gpt-4.1-mini`, `gpt-5.4-mini` |

**Fork Wepost hoje:** embeddings key **não** configurada → KB usa **busca por palavra-chave** (FTS). Funciona; semantic é opcional.

## Seed KB (Etapa 0)

```bash
npm run seed:wepost-kb
# ou outra conta:
npx tsx scripts/seed-wepost-knowledge.ts --account-id=<uuid>
```

Requer `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`.
