# Plano técnico — 001 Indicação

> Referência: `spec.md` nesta pasta é a fonte de verdade das regras; `DESIGN.md` (raiz) define as telas. Este plano só decide **como** implementar. Atualizado em 2026-10-20 para a spec aprovada.

## Stack

- **Next.js 16 (App Router) + TypeScript**, já em uso no projeto. `app/` fica na raiz; **não usar `src/`**.
- **Supabase (Postgres + Auth)** para dados e login da dona. Um único usuário, criado à mão no painel; cadastro público desativado.
- **Tailwind v4**: tokens do `DESIGN.md` no `@theme` de `app/globals.css` (não há `tailwind.config`).
- **Jest** para testes (`npm test`).
- UI em **pt-BR**, mobile-first, tema claro apenas.
- Regras de negócio em um **módulo puro** (`lib/indicacao/`), sem dependência de banco ou framework, para testar fácil.

## Modelo de dados

- Valores monetários em **centavos** (`integer`).
- Percentuais em **centésimos de ponto** (`integer`): `500` = 5%, `750` = 7,5%.
- Telefones guardados **normalizados** (só dígitos, com DDI 55; 12 ou 13 dígitos), conforme a RN4.
- Datas em `timestamptz`; a validade do código é `date` interpretada no fuso `America/Sao_Paulo`.

| Tabela | Campos principais |
|---|---|
| `indicadores` | id, nome, telefone (obrigatório, único), created_at |
| `clientes` | id, nome, telefone (único), indicador_id (nullable; vínculo da RN6, preenchido na **primeira confirmação**), created_at |
| `codigos` | id, codigo (único, em minúsculas), indicador_id, tipo (`normal`\|`primeira_compra`), desconto_bp, comissao_bp, valido_ate (`date`, nullable), limite_usos (padrão 10), ativo, created_at |
| `vendas` | id, cliente_id, codigo_id (nullable), valor_original, desconto_bp_aplicado, valor_desconto, valor_final, comissao_bp_aplicada, comissao_valor, status (`pendente`\|`confirmada`\|`cancelada`), created_at, confirmada_em (nullable), cancelada_em (nullable) |
| `pagamentos_indicador` | id, indicador_id, tipo (`dinheiro`\|`credito_produtos`), valor, observacao (nullable), status (`ativo`\|`cancelado`), created_at, cancelado_em (nullable) |

Restrições no banco:

- `codigos`: depois de criado, só `ativo` pode mudar (RN1, RN2). Garantido por não existir função de edição e por gatilho que recusa `update` de outras colunas.
- `vendas`: sem edição de valores (RN12). `confirmada_em` é obrigatória quando `status = 'confirmada'` e continua preenchida se a venda confirmada for cancelada depois; `cancelada_em` é preenchida se e só se `status = 'cancelada'`.
- Valores e percentuais `>= 0`; `valor_final = valor_original - valor_desconto`.

Consultas derivadas (em **view**, sem coluna redundante):

- **Saldo do indicador** = Σ `comissao_valor` das vendas `confirmada` com códigos do indicador − Σ `valor` dos pagamentos `ativo` (RN11).
- **A confirmar** = Σ `comissao_valor` das vendas `pendente` com códigos do indicador.
- **Usos do código** = contagem de vendas `confirmada` com o código (RN3); `limite_atingido = usos >= limite_usos`.

## Módulo de regras (`lib/indicacao/`)

Funções puras, sem banco; recebem os dados já carregados e o `agora`.

- `normalizarCodigo(texto)` → minúsculas, sem espaços (RN1).
- `normalizarTelefone(texto)` → só dígitos com DDI 55, ou erro se fora do padrão (RN4).
- `codigoValido({ codigo, agora })` → ativo e validade até 23h59 de Brasília (RN2).
- `validarCodigo({ codigo, cliente, agora })` → RN2, RN3, RN5, RN6 e RN7. Devolve erro em português **ou** avisos (`limiteAtingido`, `clienteComVendaPendente`); limite nunca recusa.
- `calcularVenda({ valorOriginal, descontoBp, comissaoBp })` → RN8, arredondamento metade para cima em centavos, com aritmética inteira.
- `gerarMensagem({ nome, descontoBp, codigo, valorOriginal, valorFinal })` → formato da seção 8 (só para venda com código).
- `calcularSaldo({ vendas, pagamentos })` → saldo e "a confirmar" (RN11); `podePagar(valor, saldo)`.
- `podeConfirmar({ venda, cliente })` → revalida RN6 e, se for primeira compra, RN5 (RN10).
- `podeCancelarVenda({ venda, saldo })` → pendente livre; confirmada bloqueada se o saldo ficaria negativo (RN12).

Formatação compartilhada (`lib/formato/`), usada por mensagem e telas: `formatarReais` (`R$ 1.234,56` com espaço comum), `formatarPercentual` (`5%`, `7,5%`), máscara de telefone.

## Gravações

- As telas chamam **Server Actions**, que leem os dados, aplicam o módulo de regras e chamam uma **função no Postgres** (RPC) para gravar.
- Cada função roda em **uma transação** e repete as checagens que dependem de estado concorrente, com `select ... for update` no cliente ou no indicador:
  - `lancar_venda`: cria o cliente se novo, grava a venda `pendente` com percentuais e valores.
  - `confirmar_recebimento`: revalida RN6 e RN5, cria o vínculo se for o primeiro, grava `confirmada_em`.
  - `cancelar_venda`: bloqueia se o saldo ficaria negativo; grava `cancelada_em`.
  - `registrar_pagamento_indicador`: recusa valor acima do saldo.
  - `cancelar_pagamento`: grava `cancelado_em`.
  - `criar_codigo` e `definir_codigo_ativo`.
- O servidor **recalcula** desconto, valor final e comissão; nunca usa valores vindos do navegador.

## Segurança e acesso

- Login com **Supabase Auth** (e-mail e senha) via `@supabase/ssr`, com sessão longa.
- Proteção de rotas no `proxy.ts` do Next 16 (antigo `middleware`): sem sessão, redireciona para `/login`. Ler `node_modules/next/dist/docs/` antes de implementar, inclusive o efeito de `cacheComponents` sobre leitura de cookies.
- **RLS** em todas as tabelas: acesso só para usuário autenticado. Funções do Postgres com `security invoker`.
- Chaves só em `.env.local` (ignorado pelo git). Seed com telefones fictícios.

## Telas (rotas)

| Rota | Tela da spec |
|---|---|
| `/login` | Login |
| `/vendas/nova` | Nova venda (3 telas + sucesso) |
| `/vendas` | Lista de vendas |
| `/indicadores` | Lista de indicadores e cadastro |
| `/indicadores/[id]` | Detalhe do indicador |
| `/indicadores/[id]/codigos/novo` | Criar código |

Navegação inferior fixa com **Nova venda**, **Vendas** e **Indicadores** (`DESIGN.md`, seção 6).

## Testes

- Testes unitários do módulo de regras e da formatação, cobrindo a tabela de critérios de aceite da spec (seção 11).
- Teste de integração das funções do Postgres no fluxo lançar → confirmar → cancelar e no pagamento ao indicador, contra um banco de desenvolvimento.
- Telas conferidas com o checklist da seção 13 do `DESIGN.md`.

## Decisões tomadas

- Percentuais em centésimos de ponto (inteiro).
- Validade do código até 23h59 de Brasília.
- Gravações por função no Postgres, em transação.
- Regras em `lib/indicacao/`, sem `src/`.
- Filtro de período da lista de vendas pela data de lançamento (`created_at`).
