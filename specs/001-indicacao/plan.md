# Plano técnico — 001 Indicação

> Referência: `spec.md` nesta pasta é a fonte de verdade das regras; `specs/design/DESIGN.md` define a aparência das telas. Este plano só decide **como** implementar. Atualizado em 2026-10-20 para a spec revisada (sem comissão nem pagamento ao indicador; telas detalhadas na seção 10 da spec) e para o **Kero System com várias empresas**: empresas, cadastro, RLS por empresa e módulos estão em `specs/000-empresas/plan.md`.

## Stack

- **Next.js 16 (App Router) + TypeScript**, já em uso no projeto. `app/` fica na raiz; **não usar `src/`**.
- **Supabase (Postgres + Auth)** para dados e login. Cada empresa cria sua conta pelo cadastro público (spec 000); um usuário por empresa no MVP.
- **Tailwind v4**: tokens do `DESIGN.md` no `@theme` de `app/globals.css` (não há `tailwind.config`).
- **Jest** para testes (`npm test`).
- UI em **pt-BR**, mobile-first, tema claro apenas.
- Regras de negócio em um **módulo puro** (`lib/indicacao/`), sem dependência de banco ou framework, para testar fácil.

## Modelo de dados

- Valores monetários em **centavos** (`integer`).
- Percentuais em **centésimos de ponto** (`integer`): `500` = 5%, `750` = 7,5%.
- Telefones guardados **normalizados** (só dígitos, com DDI 55; 12 ou 13 dígitos), conforme a RN4.
- Datas em `timestamptz`; a validade do código é `date` interpretada no fuso `America/Sao_Paulo`.
- **Toda tabela tem `empresa_id`** (não nulo, FK para `empresas`, ver `000-empresas/plan.md`). Unicidades são por empresa e as referências entre tabelas exigem a mesma empresa.

| Tabela | Campos principais |
|---|---|
| `indicadores` | id, empresa_id, nome, telefone (obrigatório; único por empresa), created_at |
| `clientes` | id, empresa_id, nome, telefone (único por empresa), indicador_id (nullable; vínculo da RN6, preenchido na **primeira confirmação** e não desfeito), created_at |
| `codigos` | id, empresa_id, codigo (único por empresa, em minúsculas), indicador_id, tipo (`normal`\|`primeira_compra`), desconto_bp (0 a 10000), valido_ate (`date`, nullable), limite_usos (padrão 10, `>= 1`), ativo, created_at |
| `vendas` | id, empresa_id, cliente_id, codigo_id (nullable), valor_original, desconto_bp_aplicado, valor_desconto, valor_final, status (`pendente`\|`confirmada`\|`cancelada`), created_at, confirmada_em (nullable), cancelada_em (nullable) |

Não há comissão nem tabela de pagamentos ao indicador (spec, seção 5 e RN11 removida).

Restrições no banco:

- `codigos`: depois de criado, só `ativo` pode mudar (RN1, RN2). Garantido por não existir função de edição e por gatilho que recusa `update` de outras colunas.
- `vendas`: sem edição de valores (RN12). `confirmada_em` é obrigatória quando `status = 'confirmada'` e continua preenchida se a venda confirmada for cancelada depois; `cancelada_em` é preenchida se e só se `status = 'cancelada'`.
- Valores e percentuais `>= 0`; `valor_original > 0`; `valor_final = valor_original - valor_desconto`.

Consultas derivadas (em **view**, sem coluna redundante):

- **Usos do código** = contagem de vendas `confirmada` com o código (RN3); `limite_atingido = usos >= limite_usos`.
- **Resumo do indicador** = códigos ativos, quantidade de vendas `confirmada` e soma do `valor_final` delas (spec 10.2).

## Módulo de regras (`lib/indicacao/`)

Funções puras, sem banco; recebem os dados já carregados e o `agora`.

- `normalizarCodigo(texto)` → minúsculas, sem espaços (RN1).
- `normalizarTelefone(texto)` → só dígitos com DDI 55, ou erro se fora do padrão (RN4).
- `codigoValido({ codigo, agora })` → ativo e validade até 23h59 de Brasília (RN2).
- `validarCodigo({ codigo, cliente, agora })` → RN2, RN3, RN5, RN6 e RN7. Devolve erro em português **ou** avisos (`limiteAtingido`, `clienteComVendaPendente`); limite nunca recusa.
- `calcularVenda({ valorOriginal, descontoBp })` → RN8, arredondamento metade para cima em centavos, com aritmética inteira. **Sem comissão.**
- `gerarMensagem({ nome, descontoBp, codigo, valorOriginal, valorFinal })` → formato da seção 8 (só para venda com código).
- `podeConfirmar({ venda, cliente })` → revalida RN6 e, se for primeira compra, RN5 (RN10).
- `podeCancelarVenda({ venda })` → recusa só venda já cancelada (RN12, sem bloqueio por saldo).

Formatação compartilhada (`lib/formato/`), usada por mensagem e telas: `formatarReais` (`R$ 1.234,56` com espaço comum), `formatarPercentual` (`5%`, `7,5%`), `lerReais` (texto digitado → centavos: "110", "110,5", "1.234,56"; erro em texto inválido ou zero), `lerPercentual` (texto → centésimos de ponto: "5", "7,5"), máscara de telefone.

## Gravações

- As telas chamam **Server Actions**, que leem os dados, aplicam o módulo de regras e chamam uma **função no Postgres** (RPC) para gravar.
- Cada função roda em **uma transação** e repete as checagens que dependem de estado concorrente, com `select ... for update` no cliente:
  - Nenhuma função recebe `empresa_id`: todas usam `empresa_atual()` (RE3 da spec 000) e só enxergam dados dessa empresa.
  - `cadastrar_indicador`: recusa telefone repetido na empresa.
  - `criar_codigo` e `definir_codigo_ativo`.
  - `lancar_venda`: cria o cliente se novo, revalida o código, grava a venda `pendente` com percentual e valores.
  - `confirmar_recebimento`: revalida RN6 e RN5, cria o vínculo se for o primeiro, grava `confirmada_em`.
  - `cancelar_venda`: recusa venda já cancelada; grava `cancelada_em`.
- O servidor **recalcula** desconto e valor final; nunca usa valores vindos do navegador.
- Toda action devolve `{ ok: true, ... }` ou `{ ok: false, mensagem }` com o texto da spec (seção 10), para a tela mostrar sem traduzir.

## Segurança e acesso

- Login com **Supabase Auth** (e-mail e senha) via `@supabase/ssr`, com sessão longa.
- Proteção de rotas no `proxy.ts` do Next 16 (antigo `middleware`): sem sessão, redireciona para `/login`. Ler `node_modules/next/dist/docs/` antes de implementar, inclusive o efeito de `cacheComponents` sobre leitura de cookies.
- **RLS** em todas as tabelas: acesso só às linhas com `empresa_id = empresa_atual()` (ver `000-empresas/plan.md`). Funções do Postgres com `security invoker`.
- Chaves só em `.env.local` (ignorado pelo git). Seed com **duas empresas fictícias** e telefones fictícios.

## Telas (implementação)

Comportamento e textos de cada tela: spec, seção 10. Antes de implementar, ler em `node_modules/next/dist/docs/` os guias de Server Actions, `redirect`, `searchParams` (assíncrono no Next 16) e `proxy.ts`.

| Rota | Spec | Como |
|---|---|---|
| `/` | — | Redireciona para `/vendas/nova`. |
| `/login` | 10.1 | Formulário client (e-mail, senha, "Mostrar senha"), action `entrar`; link para `/cadastro`; com sessão, redireciona para `/vendas/nova`. |
| `/cadastro` | spec 000, 9.1 | Ver `000-empresas/plan.md`. |
| `/indicadores` | 10.2 | Server Component lê o resumo dos indicadores; formulário client no topo com action `cadastrarIndicador`, que revalida a rota. |
| `/indicadores/[id]` | 10.3 | Server Component lê indicador, códigos (com usos) e vendas pendentes/confirmadas; botões client com actions `definirCodigoAtivo`, `confirmarRecebimento` e `cancelarVenda`, cada um com o diálogo de confirmação. |
| `/indicadores/[id]/codigos/novo` | 10.4 | Client Component com o passo (1 ou 2) no estado; action `criarCodigo` no fim; ao criar, redireciona para `/indicadores/[id]` com a frase de sucesso. |
| `/vendas/nova` | 10.5 | Client Component com o passo (1 a 3) e os dados no estado. Actions: `buscarClientePorTelefone` (ao sair do telefone), `previaVenda` (ao continuar da tela 2: valida o código e calcula no servidor; devolve prévia e avisos) e `lancarVenda` (redireciona para `/vendas/[id]/lancada`). |
| `/vendas/[id]/lancada` | 10.6 | Server Component lê a venda e monta a mensagem com `gerarMensagem` a partir dos valores gravados; botão client "Copiar mensagem" (`navigator.clipboard`); action `cancelarVenda` para "Desfazer esta venda". |
| `/vendas` | 10.7 | Server Component com os filtros na URL (`?indicador=&periodo=&situacao=`); filtros client que trocam a URL; mesmos botões de ação do detalhe. |

Componentes compartilhados de tela: cartão de venda (com as duas ações e os diálogos da spec 10.8), cartão de código, selo de status, aviso, diálogo de confirmação, faixa "Sem internet".

Leituras ficam em `lib/dados/` (servidor, usando o cliente Supabase), separadas das regras puras.

## Dados mockados (provisório, decidido em 2026-10-20)

Até existir o projeto Supabase (T9), casos de uso e telas rodam sobre um **banco em memória**, para não travar o resto:

- `lib/dados/tipos.ts`: as linhas das tabelas (mesmos campos da seção "Modelo de dados") e a interface `RepositorioIndicacao`, já presa a uma empresa: leituras da T39 (fazem o papel das views) e gravações (fazem o papel das RPCs, sem receber `empresa_id`).
- `lib/dados/memoria.ts`: implementação em memória da interface; `lib/dados/semente.ts`: as duas empresas fictícias da T13.
- `lib/casos-de-uso/indicacao.ts`: lê, aplica `lib/indicacao/` e grava pela interface. Testado contra o banco em memória, cobrindo a seção 11 da spec.
- `lib/dados/sessao.ts`: a "empresa da sessão" é fixa (a primeira da semente) e o banco vive na memória do servidor: reiniciar o `npm run dev` volta à semente.
- Na troca pelo Supabase (T43), só muda a implementação da interface e a sessão; casos de uso, actions e telas ficam.

## Testes

- Testes unitários do módulo de regras e da formatação, cobrindo a tabela de critérios de aceite da spec (seção 11).
- Teste de integração das funções do Postgres no fluxo lançar → confirmar → cancelar, contra um banco de desenvolvimento, **com duas empresas** (uma não vê nem altera os dados da outra).
- Telas conferidas com o checklist da seção 13 do `DESIGN.md`.

## Decisões tomadas

- Percentuais em centésimos de ponto (inteiro).
- Validade do código até 23h59 de Brasília.
- Gravações por função no Postgres, em transação.
- Regras em `lib/indicacao/`, sem `src/`.
- Filtro de período da lista de vendas pela data de lançamento (`created_at`), com atalhos fixos: Hoje, Últimos 7 dias, Últimos 30 dias, Tudo.
- Sem comissão e sem pagamento ao indicador (combinados fora do sistema).
- Criar código em 2 passos, sem tela de conferência.
- Cadastro de indicador na própria Lista de indicadores.
- Dados isolados por `empresa_id` + RLS; unicidades por empresa (spec 000).
- Tela de sucesso da venda em rota própria (`/vendas/[id]/lancada`), para não perder a mensagem ao recarregar.
