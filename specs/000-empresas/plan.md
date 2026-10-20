# Plano técnico — 000 Empresas e módulos

> Referência: `spec.md` nesta pasta é a fonte de verdade das regras. Este plano só decide **como** implementar. Vale como base para todos os módulos (`001-indicacao` em diante).

## Stack

A mesma da `001-indicacao/plan.md`: Next.js 16 (App Router) + TypeScript, Supabase (Postgres + Auth), Tailwind v4, Jest. Sem `src/`.

## Modelo de dados

| Tabela | Campos principais |
|---|---|
| `empresas` | id, nome (1 a 60 caracteres, sem espaços nas pontas), created_at |
| `empresa_usuarios` | empresa_id, user_id (`auth.users`, **único**: um usuário em uma só empresa no MVP), papel (`responsavel`), created_at |
| `empresa_modulos` | empresa_id, modulo (`indicacao`\|`fidelidade`), ativo, created_at; chave (empresa_id, modulo) |

- Toda tabela de módulo ganha `empresa_id` (não nulo, FK para `empresas`).
- Unicidades dos módulos passam a ser **compostas com `empresa_id`** (RE4): ex. `unique (empresa_id, codigo)`, `unique (empresa_id, telefone)`.
- Chaves estrangeiras entre tabelas de módulo checam a mesma empresa (ex.: a venda e o código precisam ser da mesma empresa), com FK composta `(empresa_id, id)` ou gatilho.

## Empresa da sessão

- Função `public.empresa_atual()` (`stable`, `security definer`, `search_path` fixo): devolve o `empresa_id` do `auth.uid()` em `empresa_usuarios`.
- **RLS** em todas as tabelas de módulo: `empresa_id = empresa_atual()` para `select`, `insert`, `update` e `delete`. Em `empresas`, `empresa_usuarios` e `empresa_modulos`, só leitura das linhas da própria empresa; gravação só pelas funções abaixo.
- As funções de gravação dos módulos (RPC) **não recebem** `empresa_id`: usam `empresa_atual()` (RE3).

## Cadastro

- Cadastro público **ligado** no Supabase Auth (o MVP antigo deixava desligado).
- Server Action `criarConta({ nomeEmpresa, email, senha })`:
  1. valida com funções puras de `lib/empresas/` (nome, e-mail, senha; RE1);
  2. cria o usuário pelo `auth.signUp`, sem confirmação de e-mail (RE2), já com sessão aberta;
  3. chama a RPC `criar_empresa(nome)`, que, em uma transação, cria `empresas`, `empresa_usuarios` (com o `auth.uid()`) e `empresa_modulos` com `indicacao` ativo. Recusa se o usuário já tem empresa.
- Se o passo 3 falhar, a action apaga o usuário recém-criado (cliente admin, só no servidor) para não sobrar usuário sem empresa. Alternativa a avaliar: gatilho em `auth.users` que cria a empresa a partir de `raw_user_meta_data`, tudo na mesma transação.
- Usuário logado sem empresa (caso de falha antiga) é levado para uma tela de erro com "Tentar de novo", nunca para telas de módulo.

## Módulos no app

- `lib/dados/empresa.ts`: lê a empresa da sessão (nome e módulos ativos), uma vez por requisição.
- O layout de `app/(app)/` usa essa leitura para o nome no cabeçalho (RE6) e para montar a navegação inferior só com os destinos dos módulos ativos (RE5).
- Rotas de módulo inativo redirecionam para `/`.

## Módulo de regras (`lib/empresas/`)

- `validarNomeEmpresa(texto)` → nome sem espaços nas pontas, 1 a 60 caracteres, ou erro com a mensagem da spec 9.1.
- `validarEmail(texto)` e `validarSenha(texto)` → mensagens da spec 9.1.

## Testes

- Unitários de `lib/empresas/`.
- Integração (banco de desenvolvimento) com **duas empresas**: cada uma só lê e grava o que é seu; mesmo código e mesmo telefone em empresas diferentes; gravação com `empresa_id` de outra empresa é recusada.

## Decisões tomadas

- Um usuário pertence a uma única empresa no MVP (`user_id` único em `empresa_usuarios`), mas o modelo já aceita vários usuários por empresa no futuro.
- Isolamento por `empresa_id` em todas as tabelas + RLS (um banco só, sem schema por empresa).
- Marca única **Kero System**; nada de marca por empresa no MVP.
