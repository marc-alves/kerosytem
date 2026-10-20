# Spec 001 — Sistema de Indicação (MVP)

> Status: **aprovada para implementação** (decisões fechadas em 2026-10-20; revisada no mesmo dia: sem comissão nem pagamento ao indicador, e telas detalhadas na seção 10; revisada de novo no mesmo dia: o produto passa a ser o **Kero System**, para várias empresas, ver `specs/000-empresas/`). Qualquer mudança de regra deve ser feita aqui **antes** do código.

## 1. Contexto

O **Kero System** é um app para pequenos negócios; cada empresa tem sua conta e usa os módulos do sistema (`specs/000-empresas/`). Este é o módulo de **Indicação**: o responsável pela empresa autoriza pessoas a terem um código de desconto; quando um cliente usa esse código, a venda fica registrada como indicação daquela pessoa. A recompensa do indicador é **combinada pelo responsável diretamente com ele, fora do sistema**; o sistema só mostra quem indicou quem e quanto cada indicador gerou em vendas.

Tudo nesta spec vale **dentro de uma empresa**: indicadores, clientes, códigos e vendas pertencem à empresa logada e nunca aparecem para outra (RE3 e RE4 da spec 000).

## 2. Problema

Hoje não há como saber quem indicou quem nem quanto cada indicador gerou em vendas. Também não existe um jeito padronizado de avisar o cliente do desconto que ele ganhou.

## 3. Usuário e acesso

- **Usuário: o responsável pela empresa** (dono ou dona do negócio), operando pelo celular, com login via **Supabase Auth**. A conta é criada pelo cadastro de empresa (spec 000); um usuário por empresa no MVP.
- Indicadores e clientes **não têm acesso** ao sistema. São apenas registros.
- **Futuro previsto (fora do MVP):** tela somente de visualização para o indicador (ver os usos dos seus códigos). Nada disso deve ser implementado agora; o modelo já é compatível porque o indicador é identificado por telefone único.

## 4. Objetivo do MVP e critérios de sucesso

Validar que o responsável por uma empresa consegue operar o programa de indicação sozinho, sem planilha.

- Lançar uma venda com código em **menos de 30 segundos**.
- A mensagem para o cliente é gerada pronta para colar no WhatsApp.
- As vendas de cada indicador estão sempre corretas e auditáveis (histórico de vendas, com lançamento, confirmação e cancelamento).

## 5. Escopo

### Dentro do MVP
- Login do responsável pela empresa (Supabase Auth); a criação da conta está na spec 000.
- Cadastro de indicadores (nome + telefone).
- Geração de códigos configuráveis (normal e de primeira compra), com validade opcional e limite de usos (aviso); desativar e reativar código (sem edição).
- Clientes identificados por telefone (nome + telefone).
- Lançamento de venda com código e cálculo automático do desconto.
- Confirmação de recebimento da venda.
- Mensagem pronta para copiar e colar (formato WhatsApp).
- Resumo por indicador: códigos ativos, vendas pagas e total vendido.
- Cancelamento de vendas (sem edição).

### Fora do MVP (não implementar)
- **Comissão e pagamento ao indicador**: combinados pelo responsável fora do sistema; o sistema não calcula, não guarda e não exibe comissão.
- Cartão fidelidade (será a spec `002-fidelidade`).
- Tela/login de indicador e de cliente (ver "Futuro previsto" na seção 3).
- Cardápio, itens da venda, estoque.
- Pagamento online, integração com WhatsApp API, envio automático de mensagens.
- Vários usuários por empresa e permissões (ver spec 000), relatórios avançados.

## 6. Glossário

- **Indicador**: pessoa autorizada pelo responsável da empresa a ter códigos (ex.: Camila, Amanda).
- **Cliente**: quem compra e usa o código (ex.: João).
- **Código normal**: ex. `camila5`; pode ser usado várias vezes enquanto válido.
- **Código de primeira compra**: ex. `primeiraamanda`; desconto maior, só vale para cliente sem nenhuma venda confirmada.
- **Venda pendente**: lançada, com a mensagem enviada, mas ainda sem confirmação de que o cliente pagou.
- **Venda confirmada**: o responsável confirmou o recebimento. Só vendas confirmadas contam para uso do código, vínculo, "primeira compra" e resumo do indicador.
- **Confirmar recebimento**: registrar que o cliente pagou a compra.
- **Uso do código**: cada venda **confirmada** (e não cancelada) feita com ele.

## 7. Regras de negócio

**RN1 — Código.** Cada código pertence a um indicador e define, na criação: `desconto_pct` (para o cliente), tipo (`normal` ou `primeira_compra`), validade opcional e `limite_usos` (padrão **10**). Esses valores são **definidos na criação** e não podem ser editados depois; para renovar ou mudar condições, cria-se um novo código. Códigos são únicos **dentro da empresa** (outra empresa pode ter o mesmo código) e **não diferenciam maiúsculas de minúsculas** (`Camila5` = `camila5`); são guardados em minúsculas, sem espaços. O desconto vai de 0% a 100%.

**RN2 — Validade.** Um código é válido quando está ativo e (não tem data de validade ou a data não passou). A validade é um dia: o código vale **até 23h59 desse dia, no horário de Brasília**. Pode ser desativado e reativado a qualquer momento (único ajuste permitido depois da criação). Código inválido é recusado com mensagem clara.

**RN3 — Uso e limite (apenas aviso).** O cliente pode usar o mesmo código quantas vezes quiser enquanto ele for válido. Cada venda **confirmada** com o código conta como um uso; vendas pendentes e canceladas não contam. Quando os usos atingem `limite_usos`, o sistema exibe um **aviso visual destacado** ("este código atingiu N usos, considere gerar um novo código para {indicador}") no detalhe do indicador e na tela de Nova venda ao validar o código. No detalhe do indicador, o aviso traz o botão **Criar novo código**. **O limite não bloqueia a venda**: seu objetivo é lembrar o responsável de renovar ou repensar o código do indicador.

**RN4 — Telefone.** O cliente é identificado pelo **telefone normalizado**: apenas dígitos, com DDI 55 acrescentado quando ausente, resultando em 12 ou 13 dígitos. Formatos diferentes do mesmo número (`61 99999-9999`, `+55 (61) 99999-9999`) são o mesmo cliente. O telefone é único por cliente **dentro da empresa** (a mesma pessoa pode ser cliente de duas empresas, como registros independentes). O indicador também tem telefone **obrigatório** e único dentro da empresa. Telefone fora do padrão é recusado.

**RN5 — Primeira compra.** Código do tipo `primeira_compra` só é aceito se o cliente **não possui nenhuma venda confirmada**. Se o cliente tem venda pendente, o código é aceito, mas a prévia exibe o aviso "este cliente tem venda aguardando confirmação". Ao **confirmar** uma venda feita com código de primeira compra, o sistema revalida: se o cliente já tem outra venda confirmada, a confirmação é recusada com mensagem clara (a venda deve ser cancelada e refeita com outro código ou sem código).

**RN6 — Vínculo do cliente.** O vínculo cliente→indicador nasce na **primeira venda confirmada** feita com um código, ligando o cliente ao indicador dono do código. Depois disso, só são aceitos códigos **desse mesmo indicador**; códigos de outros são recusados. Enquanto não existe venda confirmada, o cliente não tem vínculo. Ao **confirmar** uma venda, o sistema revalida: se o cliente já tem vínculo com **outro** indicador, a confirmação é recusada com mensagem clara (a venda deve ser cancelada e refeita com um código do indicador vinculado). O vínculo **não é desfeito** por cancelamento de venda **[a confirmar]**.

**RN7 — Autoindicação.** É recusada a venda em que o telefone do cliente é igual ao telefone do indicador dono do código.

**RN8 — Cálculo da venda.**
- `valor_desconto = valor_original × desconto_pct`
- `valor_final = valor_original − valor_desconto`
- Todos os valores em **centavos inteiros**; arredondamento ao centavo, metade para cima.
- O percentual aplicado fica **gravado na venda** (mudanças futuras no código não alteram vendas passadas).

**RN9 — Venda sem código.** O código é opcional. Venda sem código não gera desconto, mas fica registrada e segue o mesmo ciclo da RN10 (necessário para a fidelidade na v2). Venda sem código **não gera mensagem** para o cliente (ver seção 9).

**RN10 — Ciclo da venda.** Estados: `pendente` → `confirmada`, e `pendente` ou `confirmada` → `cancelada`. Toda venda nasce `pendente`. Apenas o responsável confirma, pelo botão **Confirmar recebimento**. Vendas não são editadas. A venda registra a data e hora do lançamento, da confirmação e do cancelamento. Na tela, os estados aparecem como **Aguardando pagamento** (`pendente`), **Pago** (`confirmada`) e **Cancelada** (`cancelada`).

**RN11 — (removida em 2026-10-20).** Saldo e pagamento ao indicador saíram do sistema (ver seção 5, "Fora do MVP"). O número fica reservado para não renumerar as demais regras.

**RN12 — Cancelamento e imutabilidade.** Vendas não são editadas; erros são corrigidos por **cancelamento**, preservando o histórico. Cancelar venda pendente ou confirmada é **livre** (não há bloqueio). Uma venda confirmada que é cancelada deixa de contar como uso do código e sai do resumo do indicador. Venda já cancelada não pode ser cancelada de novo.

## 8. Mensagem para o cliente

Formato WhatsApp (`*texto*` = negrito, `~texto~` = riscado). O botão **Copiar mensagem** copia o texto cru com esses marcadores. A mensagem é gerada no lançamento da venda (pendente) e só existe para venda **com código** (RN9).

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
1. **Tela 1 — Cliente.** O responsável abre "Nova venda" e digita o telefone do cliente. Se o cliente existe, o sistema mostra "Cliente: {nome}". Se é novo, o campo de nome aparece logo abaixo do telefone.
2. **Tela 2 — Compra.** Digita o código (opcional) e o valor da compra. O sistema valida o código (RN2 a RN7).
3. **Tela 3 — Conferência.** Prévia com desconto e valor final, mais os avisos aplicáveis (limite de usos atingido, cliente com venda pendente). O responsável toca em **Lançar venda**; a venda é gravada como **pendente**.
4. **Sucesso.**
   - Venda **com código**: o sistema exibe a mensagem pronta com botão **Copiar mensagem**.
   - Venda **sem código**: o sistema exibe "Venda lançada" e o valor, sem mensagem.
   - Nos dois casos, a tela tem o botão **Nova venda** e o link **Desfazer esta venda** (cancela a venda pendente recém-lançada, RN12).

**Confirmar recebimento**
5. Quando o cliente paga, o responsável toca em **Confirmar recebimento** (no detalhe do indicador ou na lista de vendas). O sistema revalida o vínculo (RN6) e, se o código for de primeira compra, a RN5. A venda vira `confirmada`: o uso do código é contado e, se for a primeira, o vínculo é criado (RN6).

## 10. Telas do MVP

Regras comuns a todas as telas (detalhes visuais no `DESIGN.md` desta pasta):

- Cabeçalho com o nome da empresa logada (spec 000, RE6).
- Navegação inferior fixa com **Nova venda** (em destaque), **Vendas** e **Indicadores** (destinos do módulo Indicação, mostrados porque ele está ativo; spec 000, RE5). Telas fora desses três destinos têm o botão **Voltar** escrito.
- Toda tela trata **Carregando** ("Carregando…"), **Erro** (mensagem clara + "Tentar de novo") e **Sem conexão** ("Sem internet. Nada foi salvo."). Nada é mostrado como salvo antes de o servidor confirmar.
- Erros de formulário aparecem embaixo do campo, sem apagar o que foi digitado.
- Estados da venda sempre com os rótulos **Aguardando pagamento**, **Pago** e **Cancelada**.
- Sem tela, botão ou texto de comissão ou de pagamento ao indicador.

### 10.1 Login

- **Objetivo:** entrar no app.
- **Mostra:** logo do **Kero System** e título "Entrar".
- **Campos:** E-mail; Senha (com botão **Mostrar senha**). Aceita o preenchimento automático do celular.
- **Ação:** **Entrar**. Abaixo, o link **Criar conta da empresa** (spec 000, seção 9).
- **Erros:** "E-mail ou senha incorretos. Tente de novo."
- **Regras:** sem "esqueci a senha" no MVP (spec 000, seção 5). Quem abre qualquer tela sem sessão vem para cá; quem já tem sessão e abre o login vai para **Nova venda**. A sessão fica aberta por longo período.

### 10.2 Lista de indicadores

- **Objetivo:** cadastrar indicadores e ver quanto cada um gerou em vendas.
- **Mostra, no topo, o bloco "Cadastrar indicador":**
  - Campos: Nome (ex.: Camila); Telefone (ex.: (61) 99999-9999, com máscara e teclado de telefone).
  - Ação: **Cadastrar indicador** (botão principal da tela).
  - Erros: telefone inválido (RN4): "O telefone precisa ter DDD e número. Ex.: (61) 99999-9999."; telefone já usado: "Este telefone já é de outro indicador."; nome vazio: "Digite o nome do indicador."
  - Depois de cadastrar, os campos são limpos e o novo indicador aparece na lista com a frase "{nome} cadastrado(a)." (não some sozinha).
- **Mostra, abaixo, um cartão por indicador** (ordem alfabética): nome, telefone formatado, "N códigos ativos", "N vendas pagas" e "Total vendido: R$ X" (soma do valor final das vendas confirmadas com códigos dele). Tocar no cartão abre o **Detalhe do indicador**.
- **Vazio:** "Nenhum indicador ainda. Cadastre o primeiro acima."

### 10.3 Detalhe do indicador

- **Objetivo:** acompanhar os códigos e as vendas de um indicador.
- **Mostra:** nome e telefone no topo, o mesmo resumo do cartão da lista (vendas pagas e total vendido) e duas seções.
- **Seção Códigos** (ativos primeiro, depois desativados; mais novos primeiro). Cada cartão:
  - código (ex.: `camila5`), tipo ("Normal" ou "Primeira compra"), desconto ("5% de desconto"), validade ("Sem validade", "Vale até 31/12/2026" ou "Venceu em 31/12/2026"), "Usos: N de L" e selo **Ativo** ou **Desativado**;
  - botão **Desativar código** (ou **Reativar código**), com diálogo: "Desativar o código camila5? Ele deixa de ser aceito em novas vendas. As vendas antigas não mudam." / "Sim, desativar código" e "Não, voltar" (e equivalente para reativar);
  - se o limite foi atingido (RN3): aviso destacado "Este código atingiu N usos, considere gerar um novo código para {indicador}." com o botão **Criar novo código**.
  - No fim da seção, sempre o botão **Criar código**.
  - Vazio: "Nenhum código ainda." com o botão **Criar código**.
- **Seção Vendas:** só **Aguardando pagamento** e **Pago** (as canceladas ficam na Lista de vendas), as que aguardam pagamento primeiro e, dentro de cada grupo, as mais novas primeiro. Cada cartão:
  - nome do cliente, código usado, valor final, data do lançamento e selo;
  - **Confirmar recebimento** (só nas que aguardam pagamento) e **Cancelar venda** (estilo de perigo, afastado do outro botão). Diálogos na 10.8.
  - Vazio: "Nenhuma venda com os códigos de {indicador} ainda."

### 10.4 Criar código

- **Objetivo:** criar um código para o indicador. Aberta pelo botão **Criar código** ou **Criar novo código** no detalhe do indicador; o título traz o nome ("Novo código para Camila").
- **Passo 1 de 2:**
  - Código (ex.: camila5): aceita maiúsculas e espaços, que são retirados; é mostrado como será guardado ("Fica assim: camila5").
  - Tipo: dois botões grandes de escolha, **Normal** (já marcado) e **Primeira compra**, cada um com uma frase de explicação ("Pode ser usado várias vezes" / "Só para quem nunca comprou").
  - Desconto (%) (ex.: 5): aceita vírgula ("7,5").
  - Botão **Continuar**.
- **Passo 2 de 2:**
  - Validade: **Sem validade** (já marcado) ou **Vale até** com uma data (o código vale até 23h59 desse dia, RN2).
  - Limite de usos: já vem 10, com a explicação "Quando chegar nesse número, o app avisa. Não bloqueia vendas."
  - Frase fixa acima do botão: "Depois de criado, o código não pode ser mudado. Só dá para desativar."
  - Botão **Criar código**; **Voltar** retorna ao passo 1 mantendo o que foi digitado.
- **Erros:** código vazio: "Digite o código."; código já existe (em qualquer indicador da empresa): "Este código já existe. Escolha outro."; desconto fora de 0 a 100: "O desconto precisa ser de 0% a 100%."; data no passado: "Escolha uma data de hoje em diante."; limite menor que 1: "O limite precisa ser de pelo menos 1 uso."
- **Depois de criar:** volta ao detalhe do indicador, com a frase "Código {codigo} criado." (não some sozinha).

### 10.5 Nova venda

Fluxo da seção 9 em três telas, com "Passo N de 3" no topo. **Voltar** retorna ao passo anterior mantendo o que foi digitado.

- **Tela 1 — Cliente:**
  - Telefone do cliente (máscara, teclado de telefone, já abre com o cursor).
  - Ao sair do campo (ou ao tocar em **Continuar**): cliente existente → "Cliente: {nome}"; cliente novo → aparece o campo **Nome do cliente** (ex.: João).
  - Botão **Continuar**.
  - Erros: telefone inválido (RN4): "O telefone precisa ter DDD e número. Ex.: (61) 99999-9999."; nome vazio em cliente novo: "Digite o nome do cliente."
- **Tela 2 — Compra:**
  - Código (opcional; ex.: camila5; aceita maiúsculas e espaços); Valor da compra (teclado numérico; "110" vira "R$ 110,00").
  - Botão **Continuar**, que valida o código (RN2 a RN7) e o valor.
  - Recusas (o botão não avança; a mensagem fica embaixo do campo Código):
    - não encontrado: "Código não encontrado. Confira se foi digitado certo."
    - desativado: "O código {codigo} está desativado. Use outro código ou lance sem código."
    - vencido: "O código {codigo} venceu em dd/mm/aaaa. Use outro código ou lance sem código."
    - autoindicação (RN7): "Este telefone é o mesmo de {indicador}. Quem indica não pode usar o próprio código."
    - vínculo com outro indicador (RN6): "Este cliente já usa os códigos de {indicador}. Use um código de {indicador}."
    - primeira compra já feita (RN5): "O código {codigo} é só para a primeira compra, e este cliente já comprou. Use outro código."
  - Erro no valor: "Digite o valor da compra. Ex.: 110 ou 110,50." (valor deve ser maior que zero).
- **Tela 3 — Conferência:**
  - Cliente (nome e telefone); código e indicador ("camila5, da Camila") ou "Sem código"; valor original **riscado**; desconto ("5% de desconto: R$ 5,50"); **valor final em destaque**.
  - Avisos, logo abaixo, antes do botão: limite de usos (RN3) e "Este cliente tem venda aguardando confirmação." (RN5 / cliente com venda pendente).
  - Botão **Lançar venda**. Enquanto grava, o botão mostra "Lançando…" e não aceita um segundo toque.
  - Se o servidor recusar na gravação (algo mudou desde a tela 2), a mensagem aparece aqui com **Voltar** para corrigir.

### 10.6 Venda lançada

- **Objetivo:** mostrar o resultado e entregar a mensagem para o cliente.
- **Venda com código:** título "Venda lançada", cartão com a mensagem da seção 8 **exatamente como será enviada** e o botão **Copiar mensagem**, que vira "✓ Copiado" e fica assim enquanto a pessoa estiver na tela.
- **Venda sem código:** título "Venda lançada", nome do cliente e valor; sem mensagem.
- **Nos dois casos:** selo **Aguardando pagamento**, botão **Nova venda** e o link **Desfazer esta venda**.
  - Diálogo: "Desfazer esta venda de R$ X de {cliente}? Ela fica como cancelada." / "Sim, desfazer venda" e "Não, voltar".
  - Depois de desfeita: selo **Cancelada**, a mensagem e o link somem, e o botão **Nova venda** continua.
  - O link só aparece enquanto a venda está **Aguardando pagamento**.
- Recarregar a página mostra a mesma venda e a mesma mensagem (a tela pertence à venda, não ao formulário).

### 10.7 Lista de vendas

- **Objetivo:** encontrar vendas, confirmar recebimento e cancelar.
- **Filtros** (no topo; o resultado muda ao escolher, sem botão "Filtrar"):
  - Indicador: Todos, Sem código, ou um indicador.
  - Período (pela data de lançamento, horário de Brasília): **Hoje**, **Últimos 7 dias**, **Últimos 30 dias**, **Tudo**.
  - Situação: Todas, Aguardando pagamento, Pago, Cancelada.
  - Padrão ao abrir: Todos / Últimos 7 dias / Todas **[a confirmar]**.
- **Cartões** (mais novas primeiro):
  - cliente, indicador e código ("camila5, da Camila") ou "Sem código", valor final, data e hora do lançamento e selo;
  - nas canceladas, "Cancelada em dd/mm/aaaa".
  - Ações iguais às do detalhe do indicador: **Confirmar recebimento** (só nas que aguardam) e **Cancelar venda** (não aparece nas canceladas).
- **Vazio:** "Nenhuma venda neste filtro." com o botão **Nova venda**.

### 10.8 Diálogos e recusas comuns

- **Confirmar recebimento:** "Confirmar recebimento de R$ 104,50 de João?" / "Sim, confirmar recebimento" e "Não, voltar". Depois, o selo vira **Pago**.
- **Recusas na confirmação** (a venda continua Aguardando pagamento):
  - RN6: "Este cliente já usa os códigos de {indicador}. Cancele esta venda e lance de novo com um código de {indicador}."
  - RN5: "Este cliente já tem uma compra paga, então o código {codigo} não vale mais. Cancele esta venda e lance de novo com outro código ou sem código."
- **Cancelar venda:** estilo de perigo. "Cancelar esta venda de R$ 104,50 de João?"; se estiver paga, acrescenta "Ela deixa de contar como uso do código." / "Sim, cancelar venda" e "Não, voltar". Depois, o selo vira **Cancelada**.

## 11. Critérios de aceite

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Venda com código normal | João, `camila5` (desc. 5%), R$ 110,00 | venda **pendente**; desconto R$ 5,50; final R$ 104,50; mensagem gerada; resumo da Camila não muda |
| Confirmar recebimento | confirmar a venda acima | uso do código = 1; vínculo João→Camila criado; Camila com 1 venda paga e total vendido R$ 104,50 |
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
| Cancelar venda pendente | qualquer venda pendente | cancelada; usos e resumo do indicador não mudam |
| Cancelar venda confirmada | venda paga com `camila5` | cancelada (sem bloqueio); o uso do código deixa de contar; sai do resumo da Camila |
| Código desativado não afeta vendas antigas | `camila5` com vendas lançadas e confirmadas é desativado | vendas antigas mantêm valores e status; resumo da Camila não muda |
| Venda sem código | João, sem código, R$ 50,00 | venda **pendente** sem desconto; tela "Venda lançada" sem mensagem |
| Código duplicado | criar `Camila5` quando `camila5` já existe na mesma empresa | recusado: "Este código já existe. Escolha outro." |
| Mesmo código em outra empresa | empresa B cria `camila5`, que já existe na empresa A | aceito; cada código só vale na sua empresa |
| Código de outra empresa na venda | empresa B lança venda com um código que só existe na A | "Código não encontrado. Confira se foi digitado certo." |
| Desfazer venda | tocar em "Desfazer esta venda" logo após lançar | venda cancelada; tela mostra selo "Cancelada" |
| Recarregar a tela de sucesso | recarregar após lançar venda com código | mesma mensagem continua na tela |
| Acesso sem login | abrir qualquer tela sem sessão | redirecionado ao login; dados inacessíveis |
| Dados de outra empresa | empresa A abre `/indicadores/{id}` de um indicador da B | "não encontrado"; nada da B aparece |

## 12. Pontos em aberto

Nenhum bloqueante para o MVP.

- **[a confirmar]** RN6: cancelar a única venda confirmada de um cliente mantém o vínculo com o indicador (proposta: sim, mantém).
- **[a confirmar]** 10.7: filtros padrão da Lista de vendas (proposta: Todos / Últimos 7 dias / Todas).
- Futuro: tela somente leitura para o indicador (seção 3).
- Futuro: cartão fidelidade (`002-fidelidade`).
