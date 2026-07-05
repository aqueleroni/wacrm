# Etapa 6 — Aprendizado supervisionado (cron + operação)

> **Status:** implementado  
> **Relacionado:** `docs/ai-agent-evolution-plan.md` (Etapa 6)

---

## O que faz

Após conversas **paradas ~30 min**, a IA analisa o histórico e **propõe fatos** na fila **Pendentes** (`ai_agent_memory.status = pending`). Um admin **aprova ou rejeita** em **Agentes → Inteligência → Memória**.

A IA **nunca grava memória aprovada sozinha** — nem preços, nem promessas comerciais (blocklist heurística).

---

## Pré-requisitos

1. Migration **033** aplicada (`memory_auto_extract`, `ai_memory_extracted_at`)
2. Agente de IA configurado (`ai_configs` com API key)
3. Variável de ambiente **`AUTOMATION_CRON_SECRET`** (mesma dos outros crons)

---

## Ativar na conta

1. **Agentes → Inteligência → Memória**
2. Ligue **Aprendizado automático**
3. Aguarde conversas idle (30 min) **ou** use extração manual (abaixo)

---

## Cron (automático)

**Endpoint:** `GET /api/ai/cron/consolidate`  
**Header:** `x-cron-secret: <AUTOMATION_CRON_SECRET>`

Processa até 20 conversas idle por execução, só contas com `memory_auto_extract = true`.

### Vercel Cron (exemplo)

Adicione em `vercel.json` na raiz do projeto (se usar Vercel):

```json
{
  "crons": [
    {
      "path": "/api/automations/cron",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/flows/cron",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/ai/cron/consolidate",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Configure o secret no painel Vercel:

```
AUTOMATION_CRON_SECRET=<openssl rand -hex 32>
```

O Vercel envia automaticamente `Authorization: Bearer <CRON_SECRET>` em alguns planos; **este endpoint usa o header `x-cron-secret`**. Com Vercel Cron puro, use um pinger externo (GitHub Actions, cron-job.org) ou middleware que injete o header.

### Pinger manual (teste local / Hostinger)

```bash
curl -s -X GET "https://seu-dominio.com/api/ai/cron/consolidate" \
  -H "x-cron-secret: SEU_SECRET"
```

Resposta esperada:

```json
{ "processed": 2, "inserted": 3, "proposed": 4, "skipped": 1 }
```

---

## Extração manual

### Inbox

Na conversa aberta, botão **cérebro** no cabeçalho (admin+) → propõe memórias sem esperar o cron.

### API

```http
POST /api/ai/memory/extract
Content-Type: application/json

{ "conversation_id": "<uuid>" }
```

Requer sessão admin+. Ignora o toggle `memory_auto_extract` (útil para testar).

---

## UI — fila pendente

- **Agentes → Inteligência → Memória:** seção amarela **Pendentes** com Aprovar / Rejeitar
- **Badge numérico** na aba Inteligência quando há pendentes
- Memórias **rejeitadas** não são re-propostas (dedup)

---

## Aceite (checklist)

- [ ] Toggle aprendizado automático liga/desliga no banco
- [ ] Cron retorna 401 sem secret, 503 sem env configurada
- [ ] Conversa teste (2+ msgs cliente) gera 1–3 pendentes
- [ ] Aprovar → próxima resposta usa o fato
- [ ] Rejeitar → mesma sugestão não reaparece
- [ ] Conteúdo com "preço", "R$", "desconto" é bloqueado na extração

---

## Arquivos

| Arquivo | Função |
|---------|--------|
| `src/lib/ai/memory-extract.ts` | LLM extract + find idle conversations |
| `src/lib/ai/memory-consolidate.ts` | Job batch |
| `src/app/api/ai/cron/consolidate/route.ts` | Cron HTTP |
| `src/app/api/ai/memory/extract/route.ts` | Extract manual |
| `src/components/agents/ai-memory-card.tsx` | Toggle + fila pendentes |
| `src/components/inbox/message-thread.tsx` | Botão extrair na inbox |
