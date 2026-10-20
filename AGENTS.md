<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kero System

App web para pequenos negócios: **qualquer empresa** cria sua conta e usa os módulos do sistema. Os dados de cada empresa ficam isolados. Primeiro módulo (foco do MVP): sistema de indicação por código. Não use o nome de nenhuma empresa cliente no código, nos textos ou nos exemplos; a marca é sempre **Kero System**.

## Onde estão as regras

- **As regras de negócio vivem em `specs/<funcionalidade>/spec.md`.** Leia a spec antes de implementar e não invente escopo.
- Ordem de trabalho: `spec.md` → `plan.md` → `tasks.md`. Execute uma tarefa por vez e marque `[x]` em `tasks.md`.
- **Telas seguem o `specs/001-indicacao/DESIGN.md`**: aparência, textos, componentes e o checklist da seção 13 antes de dar uma tela como pronta. Em conflito sobre comportamento, a spec vence.
- Se a spec for ambígua ou tiver item **[a confirmar]**, pergunte em vez de assumir.
- Base: `specs/000-empresas/` (cadastro de empresa, isolamento por `empresa_id` + RLS, módulos). Toda tabela e consulta de módulo é por empresa.
- Módulo atual: `specs/001-indicacao/`. O cartão fidelidade (`002-fidelidade`) é futuro, não implementar.

## Stack

Next.js (App Router) + TypeScript + Supabase (Postgres + Auth). Interface em português do Brasil, pensada para celular.

## Comandos

Ajuste conforme o gerenciador de pacotes do repo (npm como padrão):

- `npm run dev` — servidor local
- `npm run build` — build de produção
- `npm run lint` — lint
- `npm test` — testes

## Convenções

- Dinheiro sempre em **centavos inteiros**; formatar como `R$ 1.234,56` só na exibição.
- Regras de negócio em módulo puro (`lib/<funcionalidade>/`, na raiz, ao lado de `app/`; não usar `src/`), sem acesso a banco, com testes unitários.
- Gravações (venda, pagamento) feitas no servidor, nunca confiando em valores calculados no cliente.
- Textos de interface e mensagens de erro em português claro, sem jargão.
- Nunca commitar `.env*` nem chaves do Supabase.
- Mudou uma regra de negócio? Atualize a `spec.md` junto com o código.
