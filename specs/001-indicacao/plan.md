# Plano técnico — 001 Indicação

> Referência: `spec.md` nesta pasta é a fonte de verdade das regras. Este plano só decide **como** implementar. Sugestões abertas a ajuste.

## Stack

- **Next.js (App Router) + TypeScript**, já em uso no projeto.
- **Supabase (Postgres + Auth)** para dados e login da dona. Um único usuário; sem cadastro público.
- UI em **pt-BR**, mobile-first (a Shirley usa no celular).
- Regras de negócio em um **módulo puro** (`src/lib/indicacao/`), sem dependência de banco ou framework, para testar fácil.

## Modelo de dados

Valores monetários em **centavos (integer)**; percentuais em **basis points** ou `numeric(5,2)`.

| Tabela | Campos principais |
|---|---|
| `indicadores` | id, nome, whatsapp (opcional), ativo, created_at |
| `clientes` | id, nome, whatsapp (único), indicador_id (nullable; vínculo, RN5), created_at |
| `codigos` | id, codigo (único, guardado em minúsculas), indicador_id, tipo (`normal`\|`primeira_compra`), desconto_pct, comissao_pct, valido_ate (nullable), ativo, created_at |
| `vendas` | id, cliente_id, codigo_id (nullable), valor_original, desconto_pct_aplicado, valor_desconto, valor_final, comissao_pct_aplicada, comissao_valor, status (`ativa`\|`cancelada`), created_at |
| `pagamentos_indicador` | id, indicador_id, tipo (`dinheiro`\|`credito_produtos`), valor, observacao, status, created_at |

Saldo do indicador = soma de `vendas.comissao_valor` (status ativa, via código do indicador) − soma de `pagamentos_indicador.valor` (status ativo). Calculado em **view** ou query, sem coluna redundante.

## Módulo de regras (`src/lib/indicacao/`)

- `normalizarCodigo(texto)` → minúsculas, sem espaços nas pontas.
- `validarCodigo({ codigo, cliente, agora })` → implementa RN1–RN5, retorna erro tipado em português.
- `calcularVenda({ valorOriginal, descontoPct, comissaoPct })` → RN6, arredondamento half-up em centavos.
- `gerarMensagem({ nome, desconto, codigo, valorOriginal, valorFinal })` → formato da seção 8 da spec.
- `calcularSaldo(comissoes, pagamentos)` → RN8.

## Segurança

- Row Level Security habilitado em todas as tabelas; acesso só para o usuário autenticado da dona.
- Gravação de venda e pagamento por **rota de servidor / função no banco** em transação, nunca confiando em valores calculados no cliente.

## Testes

- Testes unitários do módulo de regras cobrindo a tabela de critérios de aceite da spec (seção 11).
- Teste de integração simples para o fluxo "lançar venda" (validar → gravar → mensagem).

## Decisões em aberto

- Percentual em `numeric` ou basis points (decidir na implementação, mas ser consistente).
- Se RN9 (cancelamento) for confirmada, adicionar estorno na view de saldo.
