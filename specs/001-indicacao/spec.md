# Spec 001 — Sistema de Indicação (MVP)

> Status: **aprovada para implementação** (decisões fechadas em 2026-10-20). Qualquer mudança de regra deve ser feita aqui **antes** do código.

## 1. Contexto

A **Kero Salgados** vende espetinhos de frango. A dona do negócio (Shirley) quer um sistema simples para controlar **indicações**: pessoas autorizadas por ela recebem um código de desconto; quando um cliente usa esse código e a compra é paga, o valor acumula para o indicador, e a Shirley decide depois se paga o indicador em dinheiro ou converte em desconto em produtos.

## 2. Problema

Hoje não há como saber quem indicou quem, quanto cada indicador gerou em vendas, nem quanto já foi pago a ele. Também não existe um jeito padronizado de avisar o cliente do desconto que ele ganhou.

## 3. Usuário e acesso

- **Único usuário no MVP: a dona do negócio (Shirley)**, operando pelo celular, com login via **Supabase Auth** (um usuário criado manualmente, sem cadastro público).
- Indicadores e clientes **não têm acesso** ao sistema. São apenas registros.
- **Futuro previsto (fora do MVP):** tela somente de visualização para o indicador (ver saldo e usos dos seus códigos). Nada disso deve ser implementado agora; o modelo já é compatível porque o indicador é identificado por telefone único.

## 4. Objetivo do MVP e critérios de sucesso

Validar que a Shirley consegue operar o programa de indicação sozinha, sem planilha.

- Lançar uma venda com código em **menos de 30 segundos**.
- A mensagem para o cliente é gerada pronta para colar no WhatsApp.
- O saldo de cada indicador está sempre correto e auditável (histórico de vendas e pagamentos).

## 5. Escopo

### Dentro do MVP
- Login da dona (Supabase Auth).
- Cadastro de indicadores (nome + telefone).
- Geração de códigos configuráveis (normal e de primeira compra), com validade opcional e limite de usos (aviso); desativar e reativar código (sem edição).
- Clientes identificados por telefone (nome + telefone).
- Lançamento de venda com código, cálculo automático de desconto e comissão.
- Confirmação de recebimento da venda.
- Mensagem pronta para copiar e colar (formato WhatsApp).
- Saldo por indicador e registro de pagamento ao indicador (dinheiro ou crédito em produtos).
- Cancelamento de vendas e pagamentos (sem edição).

### Fora do MVP (não implementar)
- Cartão fidelidade (será a spec `002-fidelidade`).
- Tela/login de indicador e de cliente (ver "Futuro previsto" na seção 3).
- Cardápio, itens da venda, estoque.
- Pagamento online, integração com WhatsApp API, envio automático de mensagens.
- Múltiplos usuários/permissões, relatórios avançados.

## 6. Glossário

- **Indicador**: pessoa autorizada pela Shirley a ter códigos (ex.: Camila, Amanda).
- **Cliente**: quem compra e usa o código (ex.: João).
- **Código normal**: ex. `camila5`; pode ser usado várias vezes enquanto válido.
- **Código de primeira compra**: ex. `primeiraamanda`; desconto maior, só vale para cliente sem nenhuma venda confirmada.
- **Venda pendente**: lançada, com a mensagem enviada, mas ainda sem confirmação de que o cliente pagou.
- **Venda confirmada**: a Shirley confirmou o recebimento. Só vendas confirmadas contam para saldo, uso do código, vínculo e "primeira compra".
- **Comissão**: valor que o indicador acumula por venda confirmada feita com seu código.
- **Pagamento ao indicador**: o que a Shirley paga ao indicador (dinheiro ou crédito em produtos). Não confundir com o cliente pagar a compra, que se chama **confirmar recebimento**.
- **Saldo do indicador**: comissões de vendas confirmadas menos pagamentos ao indicador.
- **Uso do código**: cada venda **confirmada** feita com ele.

## 7. Regras de negócio

**RN1 — Código.** Cada código pertence a um indicador e define, na criação: `desconto_pct` (para o cliente), `comissao_pct` (para o indicador), tipo (`normal` ou `primeira_compra`), validade opcional e `limite_usos` (padrão **10**). Esses valores são **definidos na criação** e não podem ser editados depois; para renovar ou mudar condições, cria-se um novo código. Códigos são únicos e **não diferenciam maiúsculas de minúsculas** (`Camila5` = `camila5`); são guardados em minúsculas.

**RN2 — Validade.** Um código é válido quando está ativo e (não tem data de validade ou a data não passou). A validade é um dia: o código vale **até 23h59 desse dia, no horário de Brasília**. Pode ser desativado e reativado a qualquer momento (único ajuste permitido depois da criação). Código inválido é recusado com mensagem clara.

**RN3 — Uso e limite (apenas aviso).** O cliente pode usar o mesmo código quantas vezes quiser enquanto ele for válido. Cada venda **confirmada** com o código conta como um uso; vendas pendentes não contam. Quando os usos atingem `limite_usos`, o sistema exibe um **aviso visual destacado** ("este código atingiu N usos, considere gerar um novo código para {indicador}") no detalhe do indicador, na lista de códigos e na tela de Nova venda ao digitar o código. No detalhe do indicador e na lista de códigos, o aviso traz o botão **Criar novo código**. **O limite não bloqueia a venda**: seu objetivo é lembrar a dona de renovar ou repensar o código do indicador.

**RN4 — Telefone.** O cliente é identificado pelo **telefone normalizado**: apenas dígitos, com DDI 55 acrescentado quando ausente, resultando em 12 ou 13 dígitos. Formatos diferentes do mesmo número (`61 99999-9999`, `+55 (61) 99999-9999`) são o mesmo cliente. O telefone é único por cliente. O indicador também tem telefone **obrigatório** e único. Telefone fora do padrão é recusado.

**RN5 — Primeira compra.** Código do tipo `primeira_compra` só é aceito se o cliente **não possui nenhuma venda confirmada**. Se o cliente tem venda pendente, o código é aceito, mas a prévia exibe o aviso "este cliente tem venda aguardando confirmação". Ao **confirmar** uma venda feita com código de primeira compra, o sistema revalida: se o cliente já tem outra venda confirmada, a confirmação é recusada com mensagem clara (a venda deve ser cancelada e refeita com outro código ou sem código).

**RN6 — Vínculo do cliente.** O vínculo cliente→indicador nasce na **primeira venda confirmada** feita com um código, ligando o cliente ao indicador dono do código. Depois disso, só são aceitos códigos **desse mesmo indicador**; códigos de outros são recusados. Enquanto não existe venda confirmada, o cliente não tem vínculo. Ao **confirmar** uma venda, o sistema revalida: se o cliente já tem vínculo com **outro** indicador, a confirmação é recusada com mensagem clara (a venda deve ser cancelada e refeita com um código do indicador vinculado).

**RN7 — Autoindicação.** É recusada a venda em que o telefone do cliente é igual ao telefone do indicador dono do código.

**RN8 — Cálculo da venda.**
- `valor_desconto = valor_original × desconto_pct`
- `valor_final = valor_original − valor_desconto`
- `comissao = valor_final × comissao_pct` (sobre o valor efetivamente pago)
- Todos os valores em **centavos inteiros**; arredondamento ao centavo, metade para cima.
- Os percentuais aplicados ficam **gravados na venda** (mudanças futuras no código não alteram vendas passadas).
- A comissão é calculada e gravada no lançamento, mas **só entra no saldo quando a venda é confirmada**.

**RN9 — Venda sem código.** O código é opcional. Venda sem código não gera desconto nem comissão, mas fica registrada e segue o mesmo ciclo da RN10 (necessário para a fidelidade na v2). Venda sem código **não gera mensagem** para o cliente (ver seção 9).

**RN10 — Ciclo da venda.** Estados: `pendente` → `confirmada`, e `pendente` ou `confirmada` → `cancelada`. Toda venda nasce `pendente`. Apenas a dona confirma, pelo botão **Confirmar recebimento**. Vendas não são editadas. A venda registra a data e hora do lançamento, da confirmação e do cancelamento. Na tela, os estados aparecem como **Aguardando pagamento** (`pendente`), **Pago** (`confirmada`) e **Cancelada** (`cancelada`).

**RN11 — Saldo e pagamentos ao indicador.** `saldo = Σ comissões das vendas confirmadas dos códigos do indicador − Σ pagamentos ao indicador não cancelados`. Comissões de vendas pendentes aparecem à parte, como "a confirmar", e não entram no saldo. Um pagamento tem tipo `dinheiro` ou `credito_produtos`, valor e observação opcional. Não é permitido pagar mais que o saldo.

**RN12 — Cancelamento e imutabilidade.** Vendas e pagamentos não são editados; erros são corrigidos por **cancelamento**, preservando o histórico. Cancelar venda pendente é livre. Cancelar venda confirmada estorna a comissão do saldo, mas é **bloqueado se o saldo ficaria negativo** (comissão já paga ao indicador). Pagamentos ao indicador podem ser cancelados, devolvendo o valor ao saldo.

## 8. Mensagem para o cliente

Formato WhatsApp (`*texto*` = negrito, `~texto~` = riscado). O botão **Copiar** copia o texto cru com esses marcadores. A mensagem é gerada no lançamento da venda (pendente) e só existe para venda **com código** (RN9).

```
*{nome}*, você ganhou {desconto}% de desconto com o código {codigo}!
~R$ {valor_original}~ por *R$ {valor_final}*
```

Exemplo (João, `camila5`, 5%, compra de R$ 110,00):

```
*João*, você ganhou 5% de desconto com o código camila5!
~R$ 110,00~ por *R$ 104,50*
```

Valores em formato brasileiro (`R$ 1.234,56`) com **espaço comum** (não usar espaço não separável) entre `R$` e o número; percentual sem casas quando inteiro (`5%`) e com vírgula quando não (`7,5%`).

## 9. Fluxo principal

**Lançar venda** (no máximo 3 campos por tela)
1. **Tela 1 — Cliente.** Shirley abre "Nova venda" e digita o telefone do cliente. Se o cliente existe, o sistema mostra "cliente existente: {nome}". Se é novo, o campo de nome aparece logo abaixo do telefone.
2. **Tela 2 — Compra.** Digita o código (opcional) e o valor da compra. O sistema valida o código (RN2 a RN7).
3. **Tela 3 — Conferência.** Prévia com desconto e valor final, mais os avisos aplicáveis (limite de usos atingido, cliente com venda pendente). **A prévia não exibe a comissão**; ela só aparece no detalhe do indicador. Shirley toca em **Lançar venda**; a venda é gravada como **pendente**.
4. **Sucesso.**
   - Venda **com código**: o sistema exibe a mensagem pronta com botão **Copiar mensagem**.
   - Venda **sem código**: o sistema exibe "Venda lançada" e o valor, sem mensagem.
   - Nos dois casos, a tela tem o botão **Nova venda** e o link **Desfazer esta venda** (cancela a venda pendente recém-lançada, RN12).

**Confirmar recebimento**
5. Quando o cliente paga, Shirley toca em **Confirmar recebimento** (no detalhe do indicador ou na lista de vendas). O sistema revalida o vínculo (RN6) e, se o código for de primeira compra, a RN5. A venda vira `confirmada`: a comissão entra no saldo, o uso do código é contado e, se for a primeira, o vínculo é criado (RN6).

**Pagar o indicador**
6. No detalhe do indicador, Shirley usa **Registrar pagamento** (dinheiro ou crédito em produtos), limitado ao saldo.

## 10. Telas do MVP

1. **Login** (Supabase Auth).
2. **Lista de indicadores**: saldo confirmado e valor "a confirmar" de cada um, mais cadastro (nome + telefone).
3. **Detalhe do indicador**: códigos com contagem de usos, aviso de limite (com **Criar novo código**) e **Desativar**/**Reativar**; vendas vinculadas ("Aguardando pagamento" e "Pago") com o botão **Confirmar recebimento** nas que aguardam pagamento e **Cancelar venda**; pagamentos ao indicador com **Registrar pagamento** e **Cancelar pagamento**.
4. **Criar código**: desconto, comissão, tipo, validade, limite de usos (sem edição depois de criado).
5. **Nova venda**: tela 1 (cliente), tela 2 (código e valor), tela 3 (conferência) e tela de sucesso (mensagem ou "Venda lançada", com **Desfazer esta venda**), conforme a seção 9.
6. **Lista de vendas**: filtro por indicador, período (pela data de lançamento) e situação ("Aguardando pagamento", "Pago", "Cancelada"); com **Confirmar recebimento** nas que aguardam pagamento e **Cancelar venda**.

Os estados da venda aparecem sempre com os rótulos de exibição **Aguardando pagamento** (`pendente`), **Pago** (`confirmada`) e **Cancelada** (`cancelada`), conforme o `DESIGN.md`.

## 11. Critérios de aceite

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Venda com código normal | João, `camila5` (desc. 5%, com. 3%), R$ 110,00 | venda **pendente**; desconto R$ 5,50; final R$ 104,50; comissão R$ 3,14 gravada; mensagem gerada; saldo da Camila continua R$ 0,00 |
| Confirmar recebimento | confirmar a venda acima | saldo da Camila R$ 3,14; uso do código = 1; vínculo João→Camila criado |
| Código em maiúsculas | `CAMILA5` | aceito, igual ao caso acima |
| Telefone em outro formato | `61 99999-9999` e `+55 (61) 99999-9999` | mesmo cliente |
| Telefone inválido | `1234` | recusado com mensagem clara |
| Reuso do código | João usa `camila5` de novo | aceito |
| Primeira compra válida | cliente sem venda confirmada, `primeiraamanda` | aceito; ao confirmar, vincula à Amanda |
| Primeira compra inválida | cliente com venda confirmada, `primeiraamanda` | recusado com mensagem clara |
| Primeira compra com venda pendente | cliente só com venda pendente, `primeiraamanda` | aceito, com aviso de venda pendente na prévia |
| Código de outro indicador | João (vinculado à Camila) usa código da Amanda | recusado |
| Confirmação com vínculo conflitante | cliente com vínculo na Camila; venda pendente da Amanda | confirmação recusada com mensagem clara |
| Confirmação de primeira compra com venda já confirmada | cliente com duas vendas pendentes com `primeiraamanda`; confirma a primeira e tenta confirmar a segunda | segunda confirmação recusada com mensagem clara |
| Autoindicação | cliente com o mesmo telefone do indicador | recusado |
| Código inativo ou vencido | `camila5` desativado | recusado |
| Limite de usos | código com 10 vendas confirmadas | aviso visual destacado; a 11ª venda é **aceita** |
| Vendas pendentes e limite | 9 confirmadas + 5 pendentes | sem aviso (só confirmadas contam) |
| Pagamento acima do saldo | saldo R$ 10,00, pagamento R$ 15,00 | recusado |
| Cancelar venda pendente | qualquer venda pendente | cancelada, sem efeito no saldo |
| Cancelar confirmada com saldo já pago | comissão R$ 3,14 já paga | cancelamento bloqueado |
| Código desativado não afeta vendas antigas | `camila5` com vendas lançadas e confirmadas é desativado | vendas antigas mantêm valores, status e comissões; saldo da Camila não muda |
| Venda sem código | João, sem código, R$ 50,00 | venda **pendente** sem desconto nem comissão; tela "Venda lançada" sem mensagem |
| Acesso sem login | abrir qualquer tela sem sessão | redirecionado ao login; dados inacessíveis |

## 12. Pontos em aberto

Nenhum bloqueante para o MVP.

- Futuro: tela somente leitura para o indicador (seção 3).
- Futuro: cartão fidelidade (`002-fidelidade`).