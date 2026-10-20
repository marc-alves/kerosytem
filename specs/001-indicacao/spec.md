# Spec 001 — Sistema de Indicação (MVP)

> Status: rascunho para revisão. Itens marcados **[a confirmar]** são defaults assumidos e precisam de validação com a Shirley/Márcio antes da implementação.

## 1. Contexto

A **Kero Salgados** vende espetinhos de frango. A dona do negócio (Shirley) quer um sistema simples para controlar **indicações**: pessoas autorizadas por ela recebem um código de desconto; quando um cliente usa esse código, a compra fica vinculada ao indicador, o valor acumula para ele, e a Shirley decide depois se paga o indicador em dinheiro ou converte em desconto em produtos.

## 2. Problema

Hoje não há como saber quem indicou quem, quanto cada indicador gerou em vendas, nem quanto já foi pago a ele. Também não existe um jeito padronizado de avisar o cliente do desconto que ele ganhou.

## 3. Usuário

- **Único usuário no MVP: a dona do negócio (Shirley)**, operando pelo celular. Ela cria indicadores, gera códigos, lança vendas e registra pagamentos.
- Indicadores e clientes **não têm acesso** ao sistema no MVP. São apenas registros.

## 4. Objetivo do MVP e critérios de sucesso

Validar que a Shirley consegue operar o programa de indicação sozinha, sem planilha.

- Lançar uma venda com código em **menos de 30 segundos**.
- A mensagem para o cliente é gerada pronta para colar no WhatsApp.
- O saldo de cada indicador está sempre correto e auditável (histórico de vendas e pagamentos).

## 5. Escopo

### Dentro do MVP
- Login da dona (um único usuário).
- Cadastro de indicadores.
- Geração de códigos de desconto configuráveis (normal e de primeira compra).
- Cadastro de clientes (nome + WhatsApp).
- Lançamento de venda com código, cálculo automático de desconto e comissão.
- Mensagem pronta para copiar e colar (formato WhatsApp).
- Saldo por indicador e registro de pagamento (dinheiro ou crédito em produtos).

### Fora do MVP (não implementar)
- Cartão fidelidade (será a spec `002-fidelidade`).
- Tela/login de indicador e de cliente.
- Cardápio, itens da venda, estoque.
- Pagamento online, integração com WhatsApp API, envio automático de mensagens.
- Múltiplos usuários/permissões, relatórios avançados.

## 6. Glossário

- **Indicador**: pessoa autorizada pela Shirley a ter códigos (ex.: Camila, Amanda).
- **Cliente**: quem compra e usa o código (ex.: João).
- **Código normal**: ex. `camila5`; pode ser usado várias vezes enquanto válido.
- **Código de primeira compra**: ex. `primeiraamanda`; desconto maior, só vale se o cliente ainda não tem nenhuma venda.
- **Comissão**: valor que o indicador acumula a cada venda feita com seu código.
- **Saldo do indicador**: soma das comissões menos o que já foi pago/convertido.

## 7. Regras de negócio

**RN1 — Código.** Cada código pertence a um indicador e define, no momento da criação: `desconto_pct` (para o cliente), `comissao_pct` (para o indicador), tipo (`normal` ou `primeira_compra`) e validade opcional. Códigos são únicos e **não diferenciam maiúsculas de minúsculas** (`Camila5` = `camila5`).

**RN2 — Validade.** Um código é válido quando está ativo e (não tem data de validade ou a data não passou). Pode ser desativado a qualquer momento. Não há limite de usos. **[a confirmar: limite de usos não necessário]**

**RN3 — Uso repetido.** O cliente pode usar o mesmo código quantas vezes quiser enquanto ele for válido.

**RN4 — Primeira compra.** Código do tipo `primeira_compra` só é aceito se o cliente **não possui nenhuma venda registrada**. Caso contrário o sistema recusa com mensagem clara. **[a confirmar]**

**RN5 — Vínculo do cliente.** No primeiro uso de um código, o cliente fica vinculado ao indicador dono do código. Depois disso, só são aceitos códigos **desse mesmo indicador**; códigos de outros indicadores são recusados. **[a confirmar]**

**RN6 — Cálculo da venda.**
- `valor_desconto = valor_original × desconto_pct`
- `valor_final = valor_original − valor_desconto`
- `comissao = valor_final × comissao_pct` (calculada sobre o valor efetivamente pago) **[a confirmar: sobre valor final, não sobre o original]**
- Todos os valores em **centavos inteiros**; arredondamento ao centavo, metade para cima.
- Os percentuais aplicados ficam **gravados na venda** (mudanças futuras no código não alteram vendas passadas).

**RN7 — Venda sem código.** O campo código é opcional; venda sem código não gera desconto nem comissão, mas fica registrada (necessário para a fidelidade na v2). **[a confirmar]**

**RN8 — Saldo e pagamentos.** `saldo = Σ comissões − Σ pagamentos`. Um pagamento tem tipo `dinheiro` ou `credito_produtos`, valor e observação opcional. Não é permitido pagar mais que o saldo.

**RN9 — Imutabilidade.** Vendas e pagamentos não são editados; erros são corrigidos por **cancelamento** (marca como cancelado, estorna do saldo), preservando histórico. **[a confirmar]**

## 8. Mensagem para o cliente

Formato WhatsApp (`*texto*` = negrito, `~texto~` = riscado). O botão **Copiar** copia o texto cru com esses marcadores.

```
*{nome}*, você ganhou {desconto}% de desconto com o código {codigo}!
~R$ {valor_original}~ por *R$ {valor_final}*
```

Exemplo (João, `camila5`, 5%, compra de R$ 110,00):

```
*João*, você ganhou 5% de desconto com o código camila5!
~R$ 110,00~ por *R$ 104,50*
```

Valores em formato brasileiro (`R$ 1.234,56`); percentual sem casas decimais quando inteiro.

## 9. Fluxo principal (lançar venda)

1. Shirley abre "Nova venda" e escolhe/cadastra o cliente (nome + WhatsApp).
2. Digita o código e o valor da compra.
3. Sistema valida o código (RN1–RN5) e mostra a prévia: desconto, valor final, comissão do indicador.
4. Shirley confirma; a venda é gravada.
5. Sistema exibe a mensagem pronta com botão **Copiar**.

## 10. Telas do MVP

1. Login
2. Lista de indicadores (com saldo) + cadastro
3. Detalhe do indicador: códigos, vendas vinculadas, pagamentos, botão "Registrar pagamento"
4. Criar código
5. Nova venda (com prévia e mensagem)
6. Lista de vendas (filtro por indicador/período)

## 11. Critérios de aceite (exemplos)

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Venda com código normal | João, `camila5` (desc. 5%, com. 3%), R$ 110,00 | desconto R$ 5,50; final R$ 104,50; comissão R$ 3,14; vínculo João→Camila |
| Código em maiúsculas | `CAMILA5` | aceito, igual ao caso acima |
| Reuso do código | João usa `camila5` de novo | aceito |
| Primeira compra válida | Cliente novo, `primeiraamanda` | aceito; vincula à Amanda |
| Primeira compra inválida | Cliente com venda anterior, `primeiraamanda` | recusado com mensagem clara |
| Código de outro indicador | João (vinculado à Camila) usa código da Amanda | recusado |
| Código vencido/inativo | `camila5` desativado | recusado |
| Pagamento acima do saldo | saldo R$ 10,00, pagamento R$ 15,00 | recusado |
| Alteração de código | muda o desconto de `camila5` depois | vendas antigas mantêm os valores gravados |

## 12. Pontos em aberto

- [ ] Comissão: percentual sobre o valor final (assumido) ou valor fixo por compra?
- [ ] Limite de usos por código é necessário?
- [ ] Confirmar RN4 (primeira compra = cliente sem nenhuma venda) e RN5 (vínculo fixo).
- [ ] Confirmar RN7 (venda sem código permitida) e RN9 (cancelamento em vez de edição).
