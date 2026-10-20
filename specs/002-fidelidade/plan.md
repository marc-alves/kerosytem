# Plano técnico — 002 Fidelidade

> Referência: `spec.md` nesta pasta é a fonte de verdade das regras; `specs/design/DESIGN.md` define a aparência das telas. Este plano só decide **como** implementar. Base de empresas, RLS, módulos e base comum de vendas: `specs/000-empresas/plan.md` e spec 000 (RE5, RE7); vendas e clientes: `specs/001-indicacao/plan.md`.

## Stack

A mesma da `001-indicacao/plan.md`: Next.js 16 (App Router) + TypeScript, Supabase (Postgres + Auth), Tailwind v4, Jest. Sem `src/`. Regras puras em `lib/fidelidade/`.

## Modelo de dados

Todas as tabelas com `empresa_id` (não nulo, FK para `empresas`) e RLS por `empresa_atual()`, como no `000-empresas/plan.md`. Referências entre tabelas checam a mesma empresa (FK composta `(empresa_id, id)`).

| Tabela | Campos principais |
|---|---|
| `fidelidade_programas` | empresa_id (**chave**: um por empresa, RF1), meta (2 a 50), premio (1 a 60 caracteres, sem espaços nas pontas), valor_minimo (centavos, nullable, `> 0`), dias_liberacao (0 a 90, padrão 7), created_at, updated_at |
| `fidelidade_carimbos` | id, empresa_id, cliente_id, venda_id (**único**: uma venda dá no máximo 1 carimbo), valor_minimo_aplicado (nullable), created_at (= `confirmada_em` da venda), liberado_em (`timestamptz`, RF4), resgate_id (nullable: o resgate que usou o carimbo, RF6), retirado_em (nullable: venda cancelada, RF5) |
| `fidelidade_resgates` | id, empresa_id, cliente_id, meta, premio (gravados da época, RF6), created_at, desfeito_em (nullable, RF7) |
| `fidelidade_cartoes` | empresa_id, cliente_id (chave composta), chave (**única no sistema todo**, RF8), created_at, chave_trocada_em (nullable) |

- **Carimbo gravado, não derivado:** a linha é criada na confirmação, porque depende do programa, do valor mínimo e do prazo **daquele momento** (RF2, RF3, RF4). Retirar é preencher `retirado_em`; nada é apagado.
- **`liberado_em`:** com `dias_liberacao = 0`, igual a `created_at`; senão, 00h00 de Brasília do dia (data da confirmação em Brasília + `dias_liberacao`). Calculado uma vez, na confirmação.
- **Resgate ligado aos carimbos:** `resgate_id` diz quais carimbos o resgate usou (os liberados mais antigos). Desfazer o resgate limpa o `resgate_id` desses carimbos (o resgate fica com `desfeito_em`). Isso também diz quais vendas não podem ser canceladas (RF5).
- **Restrições:** `retirado_em` e `resgate_id` nunca preenchidos juntos; carimbo só ligado a resgate da mesma empresa e do mesmo cliente.
- **Carimbos no cartão** (view `fidelidade_cartoes_resumo`, sem coluna redundante): por cliente, carimbos com `retirado_em` e `resgate_id` nulos, separados em liberados (`liberado_em <= now()`) e a liberar. Nunca fica negativo (RF5).
- **Chave do link:** 32 bytes aleatórios do servidor (`crypto.randomBytes` / `gen_random_bytes`), em base64url (43 caracteres). Nunca derivada de telefone, nome ou id. Criada no primeiro carimbo do cliente.
- **Vendas anteriores ao programa:** `ganhaCarimbo` compara `vendas.created_at >= fidelidade_programas.created_at` (RF3).

## Módulo de regras (`lib/fidelidade/`)

Funções puras, sem banco; recebem os dados já carregados e o `agora`.

- `validarPrograma({ meta, premio, valorMinimo, diasLiberacao })` → valores e mensagens da spec 10.4, ou erro por campo. O valor mínimo usa o `lerReais` de `lib/formato/`.
- `ganhaCarimbo({ venda, programa })` → `true` se a venda está confirmada, foi lançada depois da criação do programa e `valorFinal >= valorMinimo` (RF3).
- `dataLiberacao({ confirmadaEm, diasLiberacao })` → `liberado_em` (RF4), no fuso `America/Sao_Paulo`, reaproveitando o que a `lib/indicacao/periodo.ts` já faz com datas de Brasília.
- `estadoCartao({ carimbos, meta, agora })` → `{ noCartao, liberados, aLiberar, exibido, completo, sobra, faltam, podeResgatar, premioLiberadoEm, proximaLiberacao }`: `exibido` vai de 0 à meta; `premioLiberadoEm` é a data em que o carimbo de número `meta` (em ordem de liberação) é liberado, quando o cartão está completo e ainda não dá para resgatar (RF6).
- `escolherCarimbosDoResgate({ carimbos, meta, agora })` → os `meta` liberados mais antigos, ou erro com a mensagem da spec 10.2 (RF6).
- `podeDesfazerResgate(resgate)` → recusa resgate já desfeito (RF7).
- `podeCancelarPorFidelidade(carimbo)` → recusa se o carimbo da venda está num resgate não desfeito (RF5), com a mensagem da spec 10.3.
- `primeiroNome(nome)` → primeira palavra do nome (RF9, seção 8).
- `gerarMensagemCarimbo`, `gerarMensagemCompleto`, `gerarMensagemCompletoALiberar` e `gerarMensagemLink` → textos da seção 8, com `formatarReais` e datas `dd/mm/aaaa`; `escolherMensagem(estado)` decide qual o botão **Copiar mensagem** usa.
- `ordenarCartoes(lista)` → completos primeiro, depois carimbos no cartão do maior para o menor, empate por nome (spec 10.1).
- `historicoPublico(carimbos, resgates)` → só carimbos não retirados e resgates não desfeitos, sem valores (spec 11.1).

## Gravações

Mesmo padrão da 001: Server Action → regras puras → RPC no Postgres, em transação, sem receber `empresa_id`, sempre repetindo as checagens no servidor.

- `salvar_programa(meta, premio, valor_minimo, dias_liberacao)`: cria ou atualiza o programa da empresa (RF1, RF2).
- **`confirmar_recebimento` (da base comum) dá o carimbo** na mesma transação, só com o módulo `fidelidade` ativo e o programa criado: com `ganhaCarimbo`, insere o carimbo com `liberado_em` e cria `fidelidade_cartoes` se ainda não existe. Devolve o estado do cartão para a frase de sucesso (spec 10.3).
- **`cancelar_venda` (da base comum):** com `select ... for update` no carimbo da venda, **recusa** se ele está num resgate não desfeito (RF5); senão, cancela e preenche `retirado_em`. Essa checagem vale mesmo com o módulo desligado, para o histórico não ficar inconsistente se ele for religado.
- `registrar_resgate(cliente_id)`: `select ... for update` nos carimbos do cliente, escolhe os `meta` liberados mais antigos, recusa se não houver; cria o resgate com meta e prêmio do programa e liga os carimbos (RF6).
- `desfazer_resgate(resgate_id)`: recusa se já desfeito; grava `desfeito_em` e solta os carimbos (RF7).
- `gerar_novo_link(cliente_id)`: troca a chave e grava `chave_trocada_em` (RF8).

Toda action devolve `{ ok: true, ... }` ou `{ ok: false, mensagem }` com o texto da spec. As actions e telas de fidelidade recusam ("não encontrado") quando o módulo está desligado.

## Página do cliente (sem login)

- Rota `app/cartao/[chave]/page.tsx`, **fora** do grupo `(app)`: sem cabeçalho do app, sem navegação e sem sessão. Liberar `/cartao/` no `proxy.ts`.
- Leitura pela RPC `cartao_publico(chave)`, `security definer`, com `search_path` fixo e `grant execute` para `anon`. É a **única** porta do anônimo: as tabelas continuam sem acesso para `anon`. Devolve **só** os campos da RF9 (nome da empresa, primeiro nome, meta, prêmio, valor mínimo, carimbos no cartão, completo, faltam, data do prêmio liberado, histórico sem valores), ou nada quando a chave não existe, foi trocada ou o módulo está desligado.
- A mesma resposta vazia para todos os casos de "não encontrado", para não revelar se o cliente ou a empresa existem.
- `metadata.robots = { index: false, follow: false }` e `referrer: "no-referrer"`. Página dinâmica (sem cache), para mostrar o cartão do momento.
- Ler em `node_modules/next/dist/docs/` os guias de `metadata`, `params` assíncrono e `proxy.ts` antes de implementar.

## Endereço do link

O link completo (`https://…/cartao/{chave}`) é montado no servidor a partir da variável `APP_URL`. Sem ela (desenvolvimento), usa o `host` e o `x-forwarded-proto` da requisição, para funcionar também pelo celular na rede local.

## Módulos independentes e base comum (spec 000, RE5 e RE7)

- `criar_empresa` e a semente ativam **todos** os módulos do catálogo; uma migration ativa `fidelidade` nas empresas que já existem. Desligar = `empresa_modulos.ativo = false`, pelo painel do Supabase.
- Função única `moduloAtivo(empresa, modulo)` (em `lib/dados/empresa.ts`, junto da E9) usada pelo layout, pelas telas e pelas actions. Nada de checagem espalhada com o nome do módulo em texto.
- **Navegação** (`components/destinos.ts`): lista montada a partir dos módulos ativos: **Nova venda** e **Vendas** sempre que houver algum módulo; **Indicadores** com `indicacao`; **Fidelidade** com `fidelidade`. Teste com as combinações (só indicação, só fidelidade, os dois, nenhum).
- **Sem Indicação ativa:** a Nova venda esconde o campo Código e a `previaVenda`/`lancarVenda` recusam código; a Lista de vendas esconde o filtro Indicador; os cartões de venda não mostram código.
- **Sem Fidelidade ativa:** `confirmar_recebimento` não dá carimbo; rotas `/fidelidade/*` redirecionam para `/`; `cartao_publico` não devolve nada.
- **Nenhum módulo ativo:** o layout mostra só "Nenhum módulo ativo. Fale com o Kero System."

## Telas (implementação)

| Rota | Spec | Como |
|---|---|---|
| `/fidelidade` | 10.1 | Server Component. Sem programa: frase e formulário da 10.4. Com programa: resumo, busca na URL (`?busca=`, nome ou telefone) e cartões ordenados por `ordenarCartoes`. |
| `/fidelidade/ajustar` | 10.4 | Client Component com prévia do cartão enquanto digita; action `salvarPrograma`; diálogo ao ajustar; volta para `/fidelidade`. |
| `/fidelidade/clientes/[id]` | 10.2 | Server Component lê cliente, estado do cartão e histórico; botões client com actions `registrarResgate`, `desfazerResgate` e `gerarNovoLink`, cada um com diálogo; **Copiar mensagem** com `navigator.clipboard`. |
| `/cartao/[chave]` | 11.1 | Ver "Página do cliente". |

- **Ajustes nas telas de venda (spec 10.3):** a action `confirmarRecebimento` devolve também `{ carimbo: { nome, exibido, meta, completo, mensagem } | null }`; o cartão de venda mostra a frase e o botão **Copiar mensagem do cartão**. `VendaListada` ganha `carimbo: { usadoEmResgate: boolean } | null`, para o diálogo de cancelar mostrar o aviso certo; a recusa do servidor (RF5) traz o id do cliente para o link **Abrir cartão de João**.
- Componente novo: **cartão de carimbos** (M espaços preenchidos até o exibido; liberado e a liberar com ícones diferentes, não só cor; "N de M" escrito ao lado), usado na prévia da 10.4, no cartão do cliente e na página pública.

## Dados mockados (enquanto o Supabase não existe)

Mesmo esquema da 001 ("Dados mockados"):

- `lib/dados/tipos.ts`: linhas `ProgramaFidelidade`, `Carimbo`, `Resgate`, `CartaoFidelidade` no `Banco`, e a interface `RepositorioFidelidade` (presa à empresa da sessão), com leituras (`programa`, `listarCartoes`, `cartaoCliente`) e gravações (`salvarPrograma`, `registrarResgate`, `desfazerResgate`, `trocarChave`).
- `RepositorioIndicacao.confirmarVenda` e `cancelarVenda` passam a aplicar o carimbo e a recusa do RF5, para continuarem numa única gravação (como as RPCs).
- `cartaoPublico(chave)` fica **fora** dos repositórios presos à empresa, numa função própria em `lib/dados/` (faz o papel da RPC `security definer`).
- `lib/dados/semente.ts`: as duas empresas com todos os módulos; programa na primeira (10 carimbos, "1 salgado grátis", 7 dias), com clientes no meio, completo a liberar, completo liberado e com resgate; a segunda empresa sem programa.
- Casos de uso em `lib/casos-de-uso/fidelidade.ts`, testados contra o banco em memória cobrindo a seção 12 da spec, com `agora` injetado para testar a liberação.

## Testes

- Unitários de `lib/fidelidade/` cobrindo a tabela da seção 12 da spec, inclusive datas de liberação na virada do dia em Brasília.
- Casos de uso contra o banco em memória: carimbo na confirmação, liberação, resgate com os mais antigos, desfazer, cancelamento recusado e aceito, ajuste de meta e de prazo, módulo desligado.
- Integração no banco de desenvolvimento com **duas empresas** e com o papel **anon**: o anônimo não lê nenhuma tabela; `cartao_publico` só devolve os campos da RF9; chave trocada ou inventada não devolve nada.
- Telas conferidas com o checklist da seção 13 do `DESIGN.md`.

## Decisões tomadas (deste plano)

- Carimbo gravado na confirmação (não derivado das vendas), com valor mínimo e data de liberação da época.
- Carimbos no cartão derivados em view; nada de contador guardado.
- Resgate ligado aos carimbos que usou (`resgate_id`), o que permite bloquear o cancelamento e soltar os carimbos ao desfazer.
- Uma chave por cliente em tabela própria, única no sistema todo, trocável.
- Página do cliente fora do `(app)`, lida por uma única RPC `security definer` liberada para `anon`.
- Link montado no servidor com `APP_URL` ou, sem ela, com o host da requisição.
- Checagem de módulo ativo num só lugar (`moduloAtivo`), usada por layout, telas e actions.
