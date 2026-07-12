# CRM — Guia do Projeto (fork aqueleroni)

> **Leia este arquivo antes de qualquer tarefa.** Documenta o contexto do fork,
> customizações já feitas, setup local e fluxos que o agente deve seguir.
>
> **Manutenção contínua:** o agente deve **atualizar este arquivo ao final de
> cada tarefa relevante** — novas customizações, decisões, setup, integrações,
> problemas resolvidos. Objetivo: qualquer chat novo tenha contexto completo.

## Identidade

| Item | Valor |
|------|-------|
| **Produto base** | [wacrm](https://github.com/ArnasDon/wacrm) — CRM self-hosted para WhatsApp |
| **Marca do fork** | **Wp CRM** (nome padrão; white-label por conta em Configurações) |
| **Fork** | `https://github.com/aqueleroni/wacrm.git` (`origin`) |
| **Upstream (criador)** | `https://github.com/ArnasDon/wacrm.git` (`upstream`) |
| **Stack** | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase |
| **Idioma do usuário** | Português (BR) — responder sempre em PT-BR |

## Setup local

```bash
npm install
cp .env.local.example .env.local   # credenciais em .env.local (NUNCA commitar)
npm run dev                          # http://localhost:3000
```

- **Supabase project ref:** `tvssbeqafnodzvgzfbsp`
- **MCP Supabase:** configurado em `.cursor/mcp.json`
- **Agent Skills:** `.agents/skills/supabase` e `supabase-postgres-best-practices`
- **Migrations:** `supabase/migrations/` (001–**037**) — rodar novas migrations via MCP ou SQL Editor após sync upstream
- **Locale padrão:** `NEXT_PUBLIC_LOCALE=pt-BR` em `.env.local`
- **Sem senha padrão** — conta criada em `/signup`

## Git — manter fork atualizado sem perder customizações

```bash
git fetch upstream
git merge upstream/main
# resolver conflitos (priorizar manter customizações deste fork + código novo do upstream)
git push origin main
```

**Regras:**
1. **Sempre commitar** customizações no fork antes de fazer merge upstream
2. Conflitos prováveis em arquivos que customizamos (auth, sidebar, branding, i18n, layout)
3. **Nunca commitar:** `.env.local`, chaves API, arquivos `.tmp_*`, `.apply_*`, `.mcp_*`
4. `upstream` já está configurado — não recriar

## Customizações deste fork (não sobrescrever sem pedir)

| Área | Arquivo(s) | O que foi feito |
|------|------------|-----------------|
| Auth UX | `login/page.tsx`, `signup/page.tsx` | Toggle olho show/hide senha |
| i18n | `src/i18n/` | Locale padrão `pt-BR`; catálogos EN + PT-BR (~800+ chaves); `I18nProvider` + `useT()` / `t()` |
| i18n módulos | auth, layout, settings, dashboard, contacts, inbox, pipelines, broadcasts, automations, flows, agents, etc. | UI traduzida via `useT()` |
| i18n AI settings | `ai-config.tsx`, `ai-knowledge.tsx`, `locales/*/settings.ts` | Seção Assistente de IA completa em PT-BR |
| i18n flows templates | `flow-template-content.ts`, `templates.ts`, `node-config-form.tsx` | Textos prontos dos modelos de fluxo em PT ao clonar |
| Moedas | `src/lib/currency.ts`, `locales/*/currency.ts` | Labels de moeda traduzidos (deals, settings) |
| Fonte | `src/app/fonts/SpaceGrotesk-*.ttf`, `layout.tsx` | Space Grotesk como `--font-sans` (substitui Inter) |
| Marca padrão | `public/logo-wepost.webp`, `AppLogo`, `nav.appName` | Logo wepost (branco invert) + nome **Wp CRM** |
| White-label | `031_account_branding.sql`, `branding-settings.tsx`, `use-branding.tsx` | Nome, logo e cor de destaque **por conta** em Configurações → Aparência |
| Sidebar | `sidebar.tsx` | Logo + nome dinâmicos via `useBranding()` |
| IA — modelos | `src/lib/ai/models.ts`, `ai-config.tsx` | Select curado de modelos OpenAI/Anthropic com descrições |
| IA — preset Wepost | `src/lib/ai/presets/wepost.ts` | System prompt + 5 docs de KB para [agenciawepost.com](https://agenciawepost.com/) |
| IA — roadmap agente | `docs/ai-agent-evolution-plan.md` | Auditoria + plano por etapas (persona, memória, skills, Configurações) |
| Canais omnichannel | `docs/omnichannel-channels-plan.md` | Plano Site (widget + embed) + Instagram DM + inbox unificada + IA por canal |
| IA — Etapa 0 | `scripts/seed-wepost-knowledge.ts`, `docs/ai-agent-playground-checklist.md` | KB 5/5 seed + checklist + env doc |
| IA — Etapa 6 | `docs/ai-agent-etapa-6-cron.md`, cron `/api/ai/cron/consolidate` | Aprendizado supervisionado: extract → pending → aprovação humana |
| Sync upstream | merge `upstream/main` (2026-07-12) | Mantido `useT` (shim `use-translations`); **não** adotar next-intl |
| Quick replies | `quick-replies-manager.tsx`, `?tab=quick-replies` | Respostas rápidas + mensagens interativas no composer |
| i18n interativos/inbox | `interactive-builder.tsx`, `interactive-preview.tsx`, `locales/pt-BR/inbox.ts` | Builder e prévia interativos via `useT()`; novas seções da inbox traduzidas |
| i18n erros interativos | `interactive.ts` + `locales/*/interactive.ts` | Validação com `code`/`params`; UI traduz erros via `translateInteractiveError` |
| AI usage | `agents/ai-usage.tsx`, tab Usage | Dashboard de tokens (admin) |

**Commits publicados:**
- `54006c0` — toggle senha login/signup
- `831ab14` — i18n pt-BR
- `3e4452f` — Wp CRM + white-label
- `3961102` — PROJECT.md + cursor rules
- `656bf24` — agent skills Supabase

## Histórico do fork (atualizar a cada sessão)

| Data | O que foi feito |
|------|-----------------|
| 2026-07-04 | Clone do fork `aqueleroni/wacrm`, setup local (`npm install`, `.env.local`) |
| 2026-07-04 | Supabase `tvssbeqafnodzvgzfbsp` — MCP conectado, migrations 001–030 aplicadas |
| 2026-07-04 | Toggle olho na senha — login + signup (commit `54006c0`) |
| 2026-07-04 | Git: remote `upstream` (ArnasDon), push origin |
| 2026-07-04 | Criado `PROJECT.md` + `.cursor/rules/project-context.mdc` |
| 2026-07-04 | i18n completo PT-BR — infra `src/i18n/`; EN preservado para upstream |
| 2026-07-04 | Fonte Space Grotesk; moedas traduzidas; AI config traduzido |
| 2026-07-04 | Marca Wp CRM + logo wepost (`AppLogo`, favicon, auth pages) |
| 2026-07-04 | Modelos de fluxo: conteúdo PT-BR ao clonar template |
| 2026-07-04 | **White-label v1:** migration `031_account_branding` — `brand_name`, `brand_logo_url`, `brand_primary_color` + bucket `account-branding`; UI em Configurações → Aparência → Marca |
| 2026-07-04 | IA: select de modelos curados; preset Wepost (`presets/wepost.ts`) — comportamento + KB a partir de agenciawepost.com |
| 2026-07-04 | Plano agente evolutivo: `docs/ai-agent-evolution-plan.md` (auditoria + 7 etapas; config em Settings) |
| 2026-07-04 | **Etapa 0:** KB Wepost 5/5, checklist Playground, env doc, branch `feat/ai-agent-evolution`, `npm run seed:wepost-kb` |
| 2026-07-04 | Plano omnichannel: `docs/omnichannel-channels-plan.md` — Site (widget), Instagram DM, inbox com filtro por canal, agente IA por canal |
| 2026-07-05 | **Etapa 6:** aprendizado supervisionado — cron consolidate, badge pendentes, extrair na inbox, doc cron |
| 2026-07-12 | **Sync upstream/main:** merge de 51 commits; mantido i18n próprio (`useT`) + branding Wp CRM; incorporados interactive WhatsApp, quick replies, AI usage, MCP server, security fixes; migration slot grant renomeada `031`→`037` (evitar colisão com branding) |
| 2026-07-12 | Supabase remoto: aplicadas migrations `032`–`037` (knowledge INVOKER, AI polish, profiles RLS, interactive/quick_replies, dedup conversas, slot grant) |
| 2026-07-12 | i18n pós-sync: builder/prévia de mensagens interativas conectados ao `useT()` e seções restantes da inbox traduzidas para PT-BR |
| 2026-07-12 | Erros de validação interativa: códigos estáveis + chaves `interactive.errors.*` (EN/PT); toasts e builder usam `translateInteractiveError` |
| 2026-07-12 | i18n: passos de setup WhatsApp + aba Membros da equipe (títulos, presença, convites) |
| 2026-07-12 | Fix rolagem dupla em Configurações: `min-h-0` no shell + layout contido (só o painel rola) |
| 2026-07-12 | Reverte layout contido de Settings (quebrava clique abaixo de Modelos); mantém `min-h-0` no shell |
| 2026-07-12 | i18n: textos de status de registro WhatsApp (antes hardcoded EN) via `useT()` |

## Onde customizar branding / UI (referência)

| O quê | Onde |
|-------|------|
| **White-label (UI)** | Configurações → Aparência → **Marca e white-label** (`branding-settings.tsx`) — admin+ |
| Logo + nome sidebar | `useBranding()` + `sidebar.tsx` + `AppLogo` |
| Cor de destaque por conta | `BrandApplier` + `apply-primary-color.ts` — sobrescreve `--primary` no `<html>` |
| Logo padrão (fallback) | `public/logo-wepost.webp`, `DEFAULT_BRAND_LOGO` |
| Nome padrão (fallback) | `nav.appName` → **Wp CRM** em `locales/*/nav.ts` |
| Favicon padrão | `layout.tsx` metadata → `/logo-wepost.webp` |
| Título / metadata | `src/app/layout.tsx` → **Wp CRM** |
| Fonte | `src/app/layout.tsx` + `src/app/fonts/` — Space Grotesk |
| Cores / temas (dispositivo) | `globals.css` + `themes.ts` + Aparência (modo claro/escuro + presets) |
| Textos da UI (i18n) | `src/i18n/locales/{en,pt-BR}/*.ts` |
| Locale padrão | `DEFAULT_LOCALE = 'pt-BR'` em `src/i18n/config.ts` |

**Limitação v1 white-label:** login/cadastro ainda usam marca padrão (Wp CRM). Personalização aparece após login. White-label na tela de login exigiria subdomínio/URL por tenant (futuro).

## Convenções de código

- Seguir estilo existente do wacrm (minimal diff, sem over-engineering)
- Não alterar código não relacionado à tarefa
- Comentários só para lógica não óbvia
- Testes só se pedidos ou agregarem valor real
- **Commits:** só quando o usuário pedir; mensagem imperativa em inglês (padrão do repo)
- **i18n:** novas strings → chave em `en/` + tradução em `pt-BR/`; usar `useT()` / `t()`

## Supabase / banco

- Usar MCP `user-supabase` quando disponível
- Skill `.agents/skills/supabase/SKILL.md`
- RLS habilitado — respeitar `account_id` / membership
- Branding: colunas em `accounts` (031); logo em bucket `account-branding/account-{id}/`
- Deletar usuário: apagar `accounts` (CASCADE) antes de `auth.users`

## Deploy (futuro)

- Recomendado upstream: Hostinger Managed Node.js
- Variáveis: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `META_APP_SECRET`, `NEXT_PUBLIC_LOCALE=pt-BR`
- Docs upstream: [wacrm.tech/docs](https://wacrm.tech/docs)

## Checklist rápido para o agente

- [ ] Li este `PROJECT.md`?
- [ ] Minha mudança preserva customizações listadas acima?
- [ ] **Atualizei `PROJECT.md`** (tabela de customizações + histórico)?
- [ ] Não estou commitando secrets nem `.tmp_*` / `.apply_*`?
- [ ] Respondi em português?
- [ ] Diff mínimo e focado na tarefa?

## Como o agente deve manter este arquivo

Ao concluir uma tarefa, adicionar em **Customizações** (se alterou código/UI) e em **Histórico** (linha com data + resumo). Exemplos:

- Branding (logo, nome, cores, fonte, white-label)
- i18n (novos módulos ou chaves)
- Novas features ou remoções de módulos
- Migrations Supabase (número + resumo)
- Sync upstream e conflitos resolvidos
