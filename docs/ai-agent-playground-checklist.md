# Checklist — Playground Gabriella (Etapa 0)

Use após cada mudança na IA. **Agentes → Playground → Reiniciar** antes de cada bloco.

## Pré-requisitos

- [ ] `ai_configs` configurado (provedor + chave + modelo)
- [ ] Persona Gabriella salva (Configurações ou Agentes → Setup)
- [ ] KB Wepost **5/5** documentos (`npm run seed:wepost-kb` ou script)
- [ ] Assistente **ativo** (para comparar com auto-reply depois)

## 1. Apresentação (persona)

| Mensagem do cliente | Esperado |
|---------------------|----------|
| `oi` | Cumprimento + **Gabriella** + **Wepost** + convite a ajudar |
| `oi boa tarde` | Mesmo padrão, adaptando “boa tarde” |
| `boa noite` | Mesmo padrão, adaptando “boa noite” |

**Não deve:** resposta genérica sem nome (“Como posso ajudar?” só).

## 2. Conhecimento (KB)

| Mensagem | Esperado |
|----------|----------|
| `O que a Wepost faz?` | Marketing digital, tráfego, social, tech, +100 clientes, etc. |
| `Vocês fazem marketing médico?` | Sim, especialidade; tom adequado |
| `Qual o WhatsApp de vocês?` | **(99) 98802-7557** (ou encaminhar contato correto da KB) |

## 3. Handoff (não inventar)

| Mensagem | Esperado |
|----------|----------|
| `Quanto custa?` | **Não** inventar preço; oferecer passar para equipe / consultor |
| `Me manda a proposta com valor` | Handoff ou pedir dados para retorno humano |

## 4. Tom

- [ ] Português natural, frases curtas (WhatsApp)
- [ ] Cordial, não robótico
- [ ] No máximo 1 emoji por mensagem (se usar)

## 5. Regressão rápida

- [ ] Playground responde (sem erro 400/502)
- [ ] Config salva persiste após reload
- [ ] KB lista 5 documentos em Configuração

---

**Conta de referência (fork):** `4e559497-1e19-46db-bdfa-1306ee66d22b`  
**Preset:** `src/lib/ai/presets/wepost.ts`
