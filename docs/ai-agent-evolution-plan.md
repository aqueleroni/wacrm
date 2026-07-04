# Agente de IA evolutivo — Auditoria e plano de implementação

> **Projeto:** fork Wp CRM (`aqueleroni/wacrm`)  
> **Data:** 2026-07-04  
> **Objetivo:** evoluir o assistente atual (prompt + KB + 1 call) para um agente com **persona**, **memória interna**, **skills** e aprendizado supervisionado — configurável em **Configurações**, Playground só para teste.

---

## 1. Resumo executivo

| Hoje | Meta |
|------|------|
| Chatbot: 1 chamada LLM por mensagem | Agente: contexto rico + memória + skills |
| Comportamento = texto livre em `system_prompt` | **Persona** (Gabriella / soul) editável + versionável |
| KB = docs manuais | KB oficial **+** memória aprendida (interna) |
| Sem memória entre conversas | Memória por conta e por contato |
| UI em **Agentes → Configuração** | UI centralizada em **Configurações → Agente de IA** |
| Playground duplica setup | Playground permanece em **Agentes** (só teste) |

Implementação em **7 etapas** incrementais. Cada etapa entrega valor sozinha e não quebra o upstream desnecessariamente.

---

## 2. Auditoria do sistema atual

### 2.1 Arquitetura de IA (runtime)

```
Inbound WhatsApp / Playground / Draft
        │
        ▼
  loadAiConfig(accountId)
        │
        ├── buildConversationContext(conversationId)  → últimas N msgs texto
        ├── retrieveKnowledge(query)                  → FTS + opcional pgvector
        └── buildSystemPrompt({ userPrompt, mode, knowledge })
        │
        ▼
  generateReply(provider, model)  → 1 completion, max 1024 tokens
        │
        ▼
  Resposta ao cliente (ou handoff [[HANDOFF]])
```

**Arquivos centrais**

| Caminho | Função |
|---------|--------|
| `src/lib/ai/config.ts` | Carrega/decrypt `ai_configs` |
| `src/lib/ai/defaults.ts` | Scaffold fixo EN + `buildSystemPrompt()` |
| `src/lib/ai/generate.ts` | OpenAI / Anthropic adapters |
| `src/lib/ai/knowledge.ts` | RAG híbrido (FTS + semantic) |
| `src/lib/ai/context.ts` | Últimas ~20 mensagens texto |
| `src/lib/ai/auto-reply.ts` | Webhook → bot (gates: flows, automations, human assigned) |
| `src/lib/ai/presets/wepost.ts` | Preset Gabriella + 5 docs KB (só código, não auto-aplica) |

**Pontos de entrada (3 caminhos idênticos no prompt)**

| Rota | Quem | `requireActive` | Modo prompt |
|------|------|-----------------|-------------|
| `POST /api/ai/playground` | agent+ | false | `auto_reply` |
| `POST /api/ai/draft` | agent+ | true | `draft` |
| `dispatchInboundToAiReply` | service-role | true | `auto_reply` |

### 2.2 Banco de dados (migrations 029–030)

**`ai_configs`** (1 row / account)

| Coluna | Uso |
|--------|-----|
| `provider`, `model`, `api_key` | BYO-key |
| `system_prompt` | Comportamento / persona |
| `embeddings_api_key` | Busca semântica KB |
| `is_active` | Master switch (draft) |
| `auto_reply_enabled` | Bot WhatsApp |
| `auto_reply_max_per_conversation` | Cap por thread |

**`ai_knowledge_documents` + `ai_knowledge_chunks`**

- Docs colados pela equipe → chunked → FTS + optional embedding
- RPCs: `match_ai_knowledge_fts`, `match_ai_knowledge_semantic`

**`conversations`** (IA)

- `ai_autoreply_disabled`, `ai_reply_count`
- RPC: `claim_ai_reply_slot` (cap atômico)

**O que NÃO existe**

- Tabelas de memória, skills, soul versionado
- Resumo de conversa persistido
- Job pós-conversa / reflexão
- Agent loop / tools
- Memória por contato para IA

### 2.3 UI / UX atual

| Local | Conteúdo |
|-------|----------|
| **`/agents`** | Playground + aba Setup com `<AiConfig />` completo |
| **`/settings`** | **Não tem** seção Agente de IA (rail: overview, whatsapp, members…) |
| **`ai-config.tsx`** | Cards: Provedor, Comportamento, KB, switches |
| **`ai-knowledge.tsx`** | CRUD documentos + reindex |

**Inconsistência:** draft API diz "Settings → AI Assistant", mas config só está em Agentes. **Etapa 1 corrige** isso.

### 2.4 Integrações e prioridades (webhook)

Ordem quando chega mensagem inbound:

1. **Flows** determinísticos (prioridade máxima)
2. **Automations** `new_message_received` / `keyword_match` → AI auto-reply **desiste**
3. **Humano assigned** → AI não responde
4. **AI auto-reply** (se habilitado)

Memória/skills futuras **não alteram** essa ordem.

### 2.5 Fork Wp CRM / Wepost

| Asset | Estado |
|-------|--------|
| Preset Gabriella | `presets/wepost.ts` + salvo no banco |
| KB Wepost | 2/5 docs no banco (faltam FAQ, Contato, Marketing médico) |
| Modelos curados | `models.ts` + select UI |
| i18n PT-BR | settings.ai.*, agents.* |

### 2.6 Limitações técnicas atuais

1. **Scaffold em inglês** em `buildSystemPrompt` — compete com persona PT (tom robótico)
2. **Sem contexto CRM** — nome do contato, tags, deals, notas não entram no prompt
3. **Sem memória longa** — só janela de mensagens
4. **1 LLM call** — sem reflexão interna
5. **Custo/latência** — WhatsApp exige resposta rápida; jobs pesados devem ser async
6. **Risco de aprendizado livre** — preços/promessas falsas se memória auto-aprovada sem revisão

### 2.7 O que pode ser reutilizado

- `retrieveKnowledge` → modelo para `retrieveAgentMemory`
- `ingestDocument` / chunking → indexar memórias aprovadas
- `AUTOMATION_CRON_SECRET` + padrão `/api/automations/cron` → job de consolidação
- RLS `is_account_member` / admin+ write — mesmo padrão das migrations 029–030
- `AiConfig` component → refatorar em sub-abas, não reescrever do zero

---

## 3. Arquitetura alvo

### 3.1 Camadas de contexto (invisíveis ao cliente)

```
┌─────────────────────────────────────────────────────────┐
│  buildAgentContext(accountId, contactId?, conversationId?, query) │
├─────────────────────────────────────────────────────────┤
│  1. Soul / Persona     ← ai_configs.system_prompt (+ meta opcional) │
│  2. Skills ativas     ← ai_agent_skills (match por intent/keywords) │
│  3. KB oficial        ← ai_knowledge_* (como hoje)                  │
│  4. Memória aprovada  ← ai_agent_memory (conta + contato)           │
│  5. CRM snapshot      ← contact name, tags, deal stage, notas       │
│  6. Thread summary   ← conversations.ai_summary (opcional)         │
│  7. Mensagens recentes← buildConversationContext (como hoje)       │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    generateReply → texto WhatsApp
                              │
                              ▼ (async, pós-resposta)
                    extractMemoryCandidates → fila pending
```

### 3.2 Configurações → Agente de IA (IA revisada)

**Local:** `/agents` — três abas (não em Configurações globais).

| Aba | Conteúdo |
|-----|----------|
| **Playground** | Testar conversas |
| **Configuração** | Conexão, persona, KB, atendimento (`ai-config`) |
| **Inteligência** | Memória + skills (interno; placeholders → Etapas 4–5) |

### 3.3 O que permanece vs evolui

| Recurso | Decisão |
|---------|---------|
| Comportamento (texto) | **Permanece** → renomeado **Persona** |
| Base de conhecimento | **Permanece** → fonte oficial |
| Memória | **Novo** — complementa KB, não substitui |
| Skills | **Novo** — regras acionáveis |
| Playground | **Permanece** — testa stack completa |

---

## 4. Schema proposto (migration 032+)

### 4.1 `ai_agent_memory`

```sql
-- Fatos internos; nunca exibidos ao cliente final no WhatsApp
CREATE TABLE ai_agent_memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id    uuid REFERENCES contacts(id) ON DELETE CASCADE,  -- NULL = conta toda
  kind          text NOT NULL CHECK (kind IN ('fact','preference','objection','note')),
  content       text NOT NULL,
  source        text NOT NULL CHECK (source IN ('manual','extracted','import')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','archived')),
  confidence    real,                    -- 0–1 para extracted
  source_ref    jsonb,                   -- { conversation_id, message_id? }
  embedding     vector(1536),            -- opcional, mesma dim KB
  fts           tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

Retrieval: FTS + semantic (reutilizar padrão KB), filtrar `status = 'approved'`.

### 4.2 `ai_agent_skills`

```sql
CREATE TABLE ai_agent_skills (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  trigger_hint  text NOT NULL,   -- "preço", "marketing médico", "oi", etc.
  instructions  text NOT NULL,   -- o que fazer quando acionar
  is_active     boolean NOT NULL DEFAULT true,
  priority      int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

Matching v1: FTS/keyword sobre `trigger_hint` + última mensagem do user. v2: embedding.

### 4.3 Extensões opcionais

```sql
-- Persona estruturada (opcional; v1 pode só usar system_prompt)
ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS agent_display_name text;

-- Resumo rolling da conversa
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_summary_updated_at timestamptz;

-- Config de aprendizado
ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS memory_auto_extract boolean DEFAULT false;
ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS memory_auto_approve boolean DEFAULT false;
```

### 4.4 RLS (padrão existente)

- **SELECT** memory/skills: `is_account_member(account_id)` (viewer+)
- **WRITE** memory/skills: admin+
- Extract job: **service-role** escreve `pending`; admin aprova via UI

---

## 5. Plano por etapas

### Etapa 0 — Preparação (0,5 dia) ✅ concluída 2026-07-04

**Objetivo:** baseline limpo antes de codar.

- [x] Completar KB Wepost no banco (3 docs faltantes → **5/5** via `npm run seed:wepost-kb`)
- [x] Documentar env: `docs/ai-agent-etapa-0-env.md`
- [x] Branch `feat/ai-agent-evolution`
- [x] Checklist Playground: `docs/ai-agent-playground-checklist.md`

**Entregável:** conta Wepost com KB 5/5 + persona Gabriella salva + baseline documentado.

**Próximo:** Etapa 1 — Configurações → Agente de IA (sub-abas).

---

### Etapa 1 — Inteligência no menu Agentes (1–2 dias) 🔄 em andamento

**Objetivo:** ter lugar na UI para memória/skills **sem** mover para Configurações globais.

**Decisão (2026-07-04):** manter setup em **Agentes de IA**; terceira aba **Inteligência** ao lado de Playground e Configuração.

**Frontend**

- [x] Aba **Inteligência** em `/agents` (`ai-intelligence-panel.tsx`)
- [x] Visão: persona, KB (status), placeholders Memória + Skills
- [ ] (opcional) Sub-abas dentro de Configuração — **não** obrigatório por enquanto

**Aceite**

- Três abas: Playground | Configuração | Inteligência
- Inteligência explica camadas internas; link para Configuração

---

### Etapa 2 — Persona menos robótica (1–2 dias) ✅ concluída 2026-07-04

**Objetivo:** respostas naturais sem memória ainda.

**Backend**

- [x] `buildSystemPrompt()` — scaffold PT (`prompt-scaffold.ts`, default `pt-BR`)
- [x] Persona priorizada sobre scaffold genérico; removido tom "WhatsApp CRM assistant"
- [x] `conversation_examples` em `ai_configs` + injeção no prompt
- [x] Preset Wepost: `WEPOST_CONVERSATION_EXAMPLES` (oi, serviços, preço→handoff)

**Frontend**

- [x] Configuração → Persona: campo "Exemplos de conversa"
- [x] Prévia curta do tom

**Aceite**

- Playground: "oi boa tarde" → apresentação Gabriella + Wepost (consistente)
- "quanto custa?" → handoff, sem preço inventado

---

### Etapa 7 — Machine Learning (planejamento)

Ver **`docs/ai-agent-etapa-7-ml-plan.md`** — fases 7.1–7.6 (embeddings, feedback, intent, ranking, fine-tune opcional).

---

### Etapa 3 — Contexto CRM no prompt (2–3 dias) ✅ concluída 2026-07-04

**Objetivo:** agente "conhece" quem está falando.

**Backend**

- [x] `buildCrmContext()` — nome, telefone, tags, campos, última nota, negócios
- [x] Injetado em `draft`, `playground`, `auto-reply` via `formatCrmContextBlock()`
- [x] Playground aceita `contact_id` opcional no body

**Frontend**

- [x] Playground: toggle "Simular com contato" + seletor

**Aceite**

- Auto-reply usa nome do contato quando conhecido
- Draft na inbox inclui tags/deals no contexto

---

### Etapa 4 — Memória (MVP) (4–5 dias)

**Objetivo:** memória manual + retrieval; fila pending vazia até Etapa 6.

**Backend**

- [ ] Migration `032_ai_agent_memory.sql`
- [ ] `src/lib/ai/memory.ts` — CRUD + `retrieveMemory()` (FTS v1)
- [ ] Integrar em `buildAgentContext()` — memórias `approved` only
- [ ] API:
  - `GET/POST /api/ai/memory`
  - `PATCH /api/ai/memory/[id]` (approve/reject/edit)
  - `DELETE /api/ai/memory/[id]`

**Frontend**

- [ ] Aba **Memória** em Configurações
  - Lista: conteúdo, contato (ou "conta"), status, origem
  - Ações: aprovar, rejeitar, editar, arquivar
  - Criar memória manual
  - Badge contador `pending`

**Aceite**

- Memória manual "Cliente João quer site VTEX" aparece quando João escreve
- Cliente WhatsApp **nunca** vê a palavra "memória"

---

### Etapa 5 — Skills (3–4 dias)

**Objetivo:** procedimentos modulares (preço, marketing médico, apresentação).

**Backend**

- [ ] Migration `033_ai_agent_skills.sql`
- [ ] `matchSkills(accountId, query)` — keyword/FTS v1
- [ ] Injetar top 2 skills no system prompt
- [ ] Seed preset Wepost: 4 skills iniciais (apresentação, preço, marketing médico, contato)
- [ ] API CRUD `/api/ai/skills`

**Frontend**

- [ ] Aba **Skills** — lista, toggle ativo, editar trigger + instructions
- [ ] Botão "Importar skills Wepost"

**Aceite**

- "quanto custa" aciona skill de handoff com tom Gabriella
- Admin desliga skill → comportamento muda no Playground

---

### Etapa 6 — Aprendizado supervisionado (4–5 dias)

**Objetivo:** agente propõe memórias; humano aprova (default).

**Backend**

- [ ] `POST /api/ai/cron/consolidate` (auth: `AUTOMATION_CRON_SECRET` ou novo `AI_CRON_SECRET`)
- [ ] `extractMemoryFromConversation()` — LLM structured output → rows `pending`
- [ ] Disparadores v1:
  - Cron: conversas idle > 30 min sem pending extract
  - Opcional: fire-and-forget após auto-reply (webhook `after()`)
- [ ] `ai_configs.memory_auto_extract` toggle
- [ ] **Nunca** auto-approve preços/promessas (heurística + blocklist)
- [ ] Opcional: `conversations.ai_summary` update no mesmo job

**Frontend**

- [ ] Atendimento tab: "Extrair aprendizados automaticamente" (off por default)
- [ ] Memória tab: fila **Pendentes** em destaque
- [ ] Notificação/badge no settings rail quando pending > 0

**Aceite**

- Após conversa teste, aparece 1–3 sugestões pending
- Admin aprova → próxima conversa usa o fato
- Rejeitar não reaparece

---

### Etapa 7 — Refinamentos (opcional, 3–5 dias)

**Objetivo:** qualidade Hermes-like sem sidecar Python.

- [ ] Semantic retrieval para memória (embeddings)
- [ ] `agent_display_name` column + UI
- [ ] Playground debug mode (admin): ver skills/memórias/KB usadas — **só equipe**
- [ ] Consolidation semanal: deduplicar memórias
- [ ] Export/import preset completo (persona + KB + skills)

**Fora de escopo v1**

- Agent loop multi-step visível
- Hermes sidecar / MCP externo
- Soul auto-reescrita sem aprovação
- Tools que escrevem no CRM automaticamente

---

## 6. Cronograma sugerido

| Etapa | Duração | Acumulado |
|-------|---------|-----------|
| 0 Preparação | 0,5 d | 0,5 d |
| 1 Configurações UI | 2–3 d | 3 d |
| 2 Persona natural | 1–2 d | 5 d |
| 3 Contexto CRM | 2–3 d | 8 d |
| 4 Memória MVP | 4–5 d | 13 d |
| 5 Skills | 3–4 d | 17 d |
| 6 Aprendizado | 4–5 d | 22 d |
| 7 Refinamentos | 3–5 d | 27 d |

**MVP útil para Wepost:** Etapas **0–5** (~2 semanas).  
**Agente que aprende:** + Etapa **6** (~+1 semana).

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Preço/promessa inventada na memória | Pending + approve; blocklist de campos |
| Latência WhatsApp | Extract async; 1 call na resposta |
| Custo API duplicado | Cron batch; extract só conversas idle |
| Conflito com flows/automations | Documentar prioridade; não mudar webhook order |
| Merge upstream wacrm | Módulo `src/lib/ai/agent/` isolado; migrations numeradas |
| LGPD — memória de contato | DELETE CASCADE; export no contact delete |

---

## 8. Checklist de execução (por etapa)

Antes de marcar etapa concluída:

1. Migration aplicada em `tvssbeqafnodzvgzfbsp` (MCP)
2. i18n EN + pt-BR
3. RLS testado (viewer read / admin write)
4. Playground + 1 teste auto-reply manual
5. `PROJECT.md` histórico atualizado
6. Sem secrets commitados

---

## 9. Próximo passo imediato

**Começar Etapa 1:** adicionar `Agente de IA` em Configurações e reorganizar abas, mantendo Playground em `/agents`.

Quando aprovar, executamos Etapa 0 + Etapa 1 no código.
