# Etapa 7 — Machine Learning no agente de IA

Plano para evoluir o Wp CRM de **RAG + memória supervisionada** para **ML incremental**, sem substituir o LLM como motor de redação.

**Pré-requisitos:** Etapas 0–6 estáveis (persona, KB, memória, skills, extração pending/approve).

**Estimativa:** 2–4 semanas (fases independentes; pode entregar por fatias).

---

## 1. Visão geral

### O que já temos (não é ML clássico)

| Camada | Mecanismo |
|--------|-----------|
| Resposta | LLM (OpenAI/Anthropic) + prompt |
| Conhecimento | RAG (FTS ± embeddings) |
| Memória | Fatos `approved` + extração → `pending` |
| Skills | Match por keywords na mensagem |

### O que “ML” adiciona

Modelos ou pipelines que **melhoram decisões** com dados históricos:

- *Qual memória/skill usar?*
- *Qual a intenção do cliente?*
- *Este fato extraído é confiável?*
- *Esta resposta provavelmente precisa de handoff?*

O LLM continua **escrevendo** o texto; ML **ranqueia e filtra** contexto.

---

## 2. Arquitetura alvo

```
                    ┌─────────────────────┐
  Mensagem cliente  │  Intent classifier  │  (ML v2)
        │           └──────────┬──────────┘
        ▼                      ▼
  ┌─────────────┐    ┌─────────────────────┐
  │ Skill rank  │    │ Memory rank (vector)│  (ML v1)
  └──────┬──────┘    └──────────┬──────────┘
         └──────────┬───────────┘
                    ▼
           buildAgentContext()
                    ▼
              buildSystemPrompt()
                    ▼
                 LLM → resposta
                    │
         (async)    ▼
           extract → pending
                    │
         feedback   ▼
      approve/reject/handoff → dataset
```

---

## 3. Fases de implementação

### Fase 7.1 — Embeddings na memória e skills (1 semana)

**Objetivo:** retrieval semântico onde hoje só há FTS/keywords.

**Schema**

```sql
-- migration 035
ALTER TABLE ai_agent_memory
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE ai_agent_skills
  ADD COLUMN IF NOT EXISTS trigger_embedding vector(1536);

CREATE INDEX ... USING hnsw (embedding vector_cosine_ops);
```

**Backend**

- Reutilizar `embedTexts()` + `toVectorLiteral()` de `knowledge.ts`
- Embed ao aprovar memória / salvar skill
- RPC `match_ai_agent_memory_semantic(p_account_id, p_query_embedding, p_contact_id, k)`
- `matchSkills()` v2: keyword score + cosine similarity no `trigger_hint`

**Aceite**

- Cliente escreve “quanto fica o investimento?” aciona skill Preço mesmo sem palavra “preço”
- Memória “João quer VTEX” aparece quando João menciona “loja online”

**Custo:** 1 embedding por memória/skill + 1 por mensagem (query) — cachear embedding da última mensagem por conversa (TTL 5 min).

---

### Fase 7.2 — Dataset de feedback (3–5 dias)

**Objetivo:** transformar ações humanas em dados rotulados.

**Schema**

```sql
CREATE TABLE ai_agent_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  message_id      uuid REFERENCES messages(id) ON DELETE SET NULL,
  kind            text NOT NULL CHECK (kind IN (
                    'memory_approved', 'memory_rejected',
                    'handoff', 'manual_edit', 'thumb_up', 'thumb_down'
                  )),
  label           text,           -- ex.: intent "pricing", memory_id
  payload         jsonb,          -- snapshot: query, skills matched, etc.
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**Eventos automáticos**

| Evento | Quando |
|--------|--------|
| `memory_approved` | Admin aprova memória pending |
| `memory_rejected` | Admin rejeita |
| `handoff` | Modelo emitiu `[[HANDOFF]]` ou humano assumiu |
| `manual_edit` | Agente editou draft antes de enviar (futuro inbox) |

**Aceite**

- Tabela acumula eventos sem UI extra obrigatória
- Export CSV/JSON por conta (admin) para análise

---

### Fase 7.3 — Classificador de intenção (1–2 semanas)

**Objetivo:** prever intenção antes do prompt completo.

**Intenções v1 (Wepost)**

- `greeting`, `services_info`, `pricing`, `medical_marketing`, `human_contact`, `complaint`, `other`

**Abordagem A — LLM barato (rápido, sem treino)**

- `gpt-4.1-mini` / Haiku com JSON structured output
- Cache por hash da mensagem
- **Prós:** zero infra ML; **Contras:** custo por msg, latência +200ms

**Abordagem B — Modelo pequeno treinado (ML de verdade)**

- Features: TF-IDF ou embedding médio da mensagem
- Algoritmo: logistic regression ou linear SVM (scikit-learn)
- Treino offline com `ai_agent_feedback` + conversas rotuladas
- Servir via:
  - **Opção 1:** Supabase Edge Function (ONNX runtime)
  - **Opção 2:** microserviço Python (FastAPI) sidecar
  - **Opção 3:** Vercel serverless + `@xenova/transformers` (JS, limitado)

**Recomendação Wepost:** começar **A** para validar labels; migrar **B** quando >500 exemplos rotulados.

**Integração**

```typescript
const intent = await classifyIntent(queryText)
const skills = await matchSkills(db, accountId, queryText, { intent })
```

---

### Fase 7.4 — Ranking de memória (1 semana)

**Objetivo:** ordenar memórias por relevância, não só FTS hit.

**Features por candidato**

- Cosine similarity (embedding)
- Recency (`updated_at`)
- Contact scope match
- Approval count / usage (futuro)

**Modelo v1:** score linear ponderado (sem treino)

```
score = 0.6 * semantic + 0.2 * fts_rank + 0.1 * recency + 0.1 * contact_match
```

**Modelo v2:** learning-to-rank (LambdaMART) quando feedback acumular pares (memória usada vs rejeitada).

---

### Fase 7.5 — Confiança na extração (3–5 dias)

**Objetivo:** priorizar fila pending por confiança.

**Heurísticas v1 (já parcialmente feito)**

- Blocklist preço/promessa → não extrai

**ML v2**

- Classificador binário: “fato seguro para sugerir?”
- Treino: `memory_approved` = positivo, `memory_rejected` = negativo
- UI: ordenar pending por score; badge “alta confiança”

---

### Fase 7.6 — Fine-tuning LLM (opcional, futuro)

**Quando considerar**

- >5.000 conversas anonimizadas
- Processo LGPD documentado
- Orçamento retreino trimestral

**Escopo**

- Fine-tune mini model com pares (system + conversa → resposta humana aprovada)
- Não substituir RAG — complementar tom Wepost/Gabriella

**Fora de escopo v1/v2** do fork.

---

## 4. Infraestrutura

| Componente | Onde roda |
|----------|-----------|
| Embeddings | OpenAI API (chave BYO existente) |
| Vetores | Supabase pgvector |
| Treino batch | GitHub Action semanal ou cron |
| Inferência intent | Edge Function ou route `/api/ai/classify` |
| Dataset export | Admin route `/api/ai/feedback/export` |

**Env vars novas**

```bash
AI_PROMPT_LOCALE=pt-BR          # já Etapa 2
AI_INTENT_PROVIDER=llm|local    # Fase 7.3
AI_ML_MODEL_PATH=...            # Fase 7.3B ONNX
```

---

## 5. Cronograma sugerido

| Fase | Duração | Dependência |
|------|---------|-------------|
| 7.1 Embeddings memória/skills | 1 sem | embeddings key |
| 7.2 Feedback dataset | 3–5 d | Etapa 6 rodando |
| 7.3 Intent (LLM) | 3 d | 7.2 opcional |
| 7.4 Ranking | 1 sem | 7.1 |
| 7.5 Confiança extração | 3–5 d | 7.2 |
| 7.3B Intent (modelo local) | 2 sem | >500 labels |
| 7.6 Fine-tune | — | escala + legal |

**MVP ML útil:** **7.1 + 7.2 + 7.3A** (~2 semanas).

---

## 6. Métricas de sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Handoff indevido (preço inventado) | medir no Playground | ↓ 80% |
| Skill correta acionada | teste manual 20 frases | >90% |
| Memória relevante no top-3 | revisão humana | >85% |
| Pending aprovados vs rejeitados | dashboard | >60% approve |
| Latência p95 auto-reply | medir | <3s (+embed) |

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| LGPD — treino com PII | Anonimizar telefones/nomes no export; opt-out por conta |
| Custo embeddings | Cache query; embed memória só on approve |
| Model drift | Retreino mensual; fallback keyword v1 |
| Complexidade ops | Fase 7.3A antes de sidecar Python |

---

## 8. Próximo passo recomendado

1. Concluir **Etapa 2** (scaffold PT + exemplos) ← em andamento
2. Concluir **Etapa 3** (contexto CRM)
3. Ligar **aprendizado automático** + acumular pending/approve 2–4 semanas
4. Iniciar **Fase 7.1** (embeddings memória) quando embeddings key estiver na Wepost

---

*Documento criado: 2026-07-04 — fork Wp CRM / Wepost*
