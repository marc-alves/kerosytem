# Spec 002 — Cartão fidelidade

> Status: **aprovada para implementação** (criada em 2026-10-20; decisões da seção 13 fechadas no mesmo dia). Qualquer mudança de regra deve ser feita aqui **antes** do código.

## 1. Contexto

O **Kero System** é um app para pequenos negócios; cada empresa tem sua conta e usa os módulos do sistema (`specs/000-empresas/`). Este é o módulo de **Fidelidade**: a cada compra paga, o cliente ganha um **carimbo** no cartão da empresa; ao juntar a quantidade combinada, ganha um **prêmio** (ex.: "1 salgado grátis").

O cartão é digital e tem duas visões:

- **Visão da empresa**: o responsável configura o programa, acompanha os cartões dos clientes e registra a entrega do prêmio.
- **Visão do cliente**: uma página só de leitura, aberta por um link pessoal que o cliente recebe pelo WhatsApp, onde ele vê os carimbos que já tem e quanto falta para o prêmio.

O módulo usa as **vendas e os clientes da base comum** (spec 000, RE7): não existe lançamento de venda próprio da fidelidade. É **independente** do módulo de Indicação: funciona com ou sem ele. Tudo vale **dentro de uma empresa** (RE3 e RE4 da spec 000).

## 2. Problema

O cartão de papel se perde, é fácil de falsificar e não diz ao responsável quem são os clientes mais fiéis. O cliente, por sua vez, não sabe quantos carimbos já tem sem estar com o cartão na mão.

## 3. Usuários e acesso

- **Responsável pela empresa**: o mesmo usuário da spec 000, com login. Configura o programa, vê todos os cartões e registra resgates.
- **Cliente**: **sem login**. Acessa somente o **próprio cartão**, pelo link pessoal (RF8). Não vê nada além disso: nem outros clientes, nem vendas, nem valores.
- Indicadores continuam sem acesso.

## 4. Objetivo do MVP e critérios de sucesso

Substituir o cartão de papel sem trabalho extra para o responsável.

- O carimbo é dado **sozinho** ao confirmar o recebimento de uma venda: nenhum toque a mais no fluxo de venda.
- Registrar a entrega de um prêmio leva **menos de 15 segundos**.
- O cliente abre o próprio cartão pelo celular, sem criar conta, e entende em uma olhada quantos carimbos tem e quanto falta.

## 5. Escopo

### Dentro do MVP
- Um programa de fidelidade por empresa: meta de carimbos, prêmio, valor mínimo da compra (opcional) e prazo para liberar o carimbo.
- Carimbo automático por venda confirmada (com ou sem código de indicação).
- Lista de cartões dos clientes, com busca.
- Cartão do cliente na visão da empresa: carimbos, histórico, registrar resgate e desfazer resgate.
- Link pessoal do cartão e mensagem pronta para o WhatsApp.
- Página do cartão na visão do cliente (somente leitura, sem login).

### Fora do MVP (não implementar)
- Mais de um programa ao mesmo tempo, ou prêmios diferentes por quantidade de carimbos.
- Carimbo manual (dar carimbo sem venda) e carimbos proporcionais ao valor (ex.: 1 carimbo a cada R$ 20).
- Validade dos carimbos (decidido em 2026-10-20: carimbo não vence).
- Login do cliente, cadastro feito pelo próprio cliente, cliente ver cartões de várias empresas juntos.
- Envio automático de mensagens, integração com WhatsApp API, notificações.
- QR code, cartão para carteira digital (Google/Apple Wallet).
- Relatórios de fidelidade (ranking, clientes sumidos etc.).

## 6. Glossário

- **Programa**: a regra do cartão da empresa (meta, prêmio, valor mínimo, prazo de liberação).
- **Carimbo**: o ponto que o cliente ganha por uma venda confirmada que vale para o programa.
- **Meta**: quantos carimbos completam um cartão (ex.: 10).
- **Prazo de liberação**: quantos dias, depois da confirmação do pagamento, o carimbo espera antes de poder ser usado em um resgate (o prazo de devolução da empresa).
- **Carimbo a liberar**: carimbo ganho, ainda dentro do prazo de liberação. Conta no cartão, mas não pode ser usado em resgate.
- **Carimbo liberado**: carimbo que já passou do prazo de liberação.
- **Carimbos no cartão**: carimbos ganhos que não foram retirados nem usados em um resgate (liberados + a liberar).
- **Cartão completo**: carimbos no cartão iguais ou maiores que a meta.
- **Resgate**: a entrega do prêmio ao cliente, registrada pelo responsável; usa a quantidade de carimbos **liberados** da meta.
- **Link do cartão**: endereço pessoal e secreto de cada cliente para ver o próprio cartão.

## 7. Regras de negócio

**RF1 — Programa.** Cada empresa tem **no máximo um** programa. Ele define: `meta` (número inteiro de **2 a 50**, sugestão 10), `premio` (texto obrigatório, sem espaços nas pontas, até 60 caracteres, ex.: "1 salgado grátis"), `valor_minimo` (opcional, em centavos; vazio = qualquer valor) e `dias_liberacao` (inteiro de **0 a 90**, padrão **7**; 0 = libera na hora). Enquanto o programa não é criado, o módulo não dá carimbos.

**RF2 — Ajustar o programa.** Meta, prêmio, valor mínimo e prazo de liberação podem ser alterados a qualquer momento (decidido em 2026-10-20). A mudança vale **daqui para frente**: carimbos já ganhos continuam valendo, com o valor mínimo e a data de liberação que tinham; os cartões passam a ser comparados com a meta nova. Resgates passados guardam a meta e o prêmio da época e não mudam.

**RF3 — Quem ganha carimbo.** Ganha **1 carimbo** cada venda que:
- está **confirmada** (spec 001, RN10);
- foi **lançada a partir da criação do programa**; vendas lançadas antes não dão carimbo, mesmo se confirmadas depois (decidido em 2026-10-20);
- tem `valor_final` igual ou maior que o `valor_minimo` em vigor **no momento da confirmação** (quando há valor mínimo).

Vale para venda **com ou sem código** de indicação. Uma venda dá no máximo 1 carimbo. O carimbo fica gravado com a venda, a data da confirmação, o valor mínimo aplicado e a **data de liberação** (RF4).

**RF4 — Liberação do carimbo.** O carimbo é **liberado** a partir de 00h00 (horário de Brasília) do dia `data da confirmação + dias_liberacao`; com `dias_liberacao = 0`, é liberado na hora da confirmação. A data de liberação é calculada na confirmação e não muda se o prazo do programa for ajustado depois. Só carimbos liberados podem entrar em um resgate (RF6): assim, o prêmio só sai de vendas pagas e já sem prazo de devolução.

**RF5 — Venda cancelada.**
- Venda cujo carimbo **ainda não foi usado em resgate** (a liberar ou liberado): o cancelamento é aceito e o carimbo é **retirado** do cartão.
- Venda cujo carimbo **já foi usado em um resgate** (não desfeito): o cancelamento é **recusado** (decidido em 2026-10-20). Para cancelar, o responsável desfaz o resgate antes (RF7). Esta é a única exceção ao cancelamento livre da spec 001 (RN12).

Com isso, os carimbos no cartão nunca ficam negativos.

**RF6 — Resgate.** Só pode ser registrado quando o cliente tem **carimbos liberados** em quantidade igual ou maior que a meta. O resgate usa os carimbos liberados **mais antigos**, na quantidade da meta em vigor, e grava a meta, o prêmio, a data e hora e quais carimbos usou. Com carimbos liberados de duas metas ou mais, cada resgate é registrado separadamente. Apenas o responsável registra resgates. Com o cartão completo mas sem carimbos liberados suficientes, o sistema mostra a data em que o prêmio fica liberado.

**RF7 — Desfazer resgate.** Um resgate pode ser desfeito (ex.: registrado por engano); os carimbos usados voltam ao cartão. Fica no histórico como "Resgate desfeito", com data e hora. Resgate não é editado nem apagado.

**RF8 — Link do cartão.** Cada cliente da empresa tem um link pessoal: `/cartao/{chave}`, em que a chave é aleatória, longa e impossível de adivinhar (não usa telefone, nome nem número sequencial). A chave é criada junto com o primeiro carimbo do cliente. O responsável pode **gerar um novo link**; o anterior para de funcionar na hora. Um link que não existe ou foi trocado mostra "Este cartão não foi encontrado."

**RF9 — O que o cliente vê.** Pelo link, o cliente vê **somente**: nome da empresa, o **primeiro nome** dele, a meta, o prêmio, o valor mínimo (se houver), os carimbos no cartão, a data em que o prêmio fica liberado (se for o caso) e a lista de carimbos e resgates com as datas. **Não** vê telefone, valores das compras, códigos de indicação, indicador nem dados de outros clientes. A página não é indexada por buscadores e funciona sem login.

**RF10 — Módulo.** O módulo `fidelidade` é **independente** (spec 000, RE5): pode estar ativo sem o de Indicação, e vice-versa. Com ele ativo, aparece o destino **Fidelidade** na navegação e as vendas confirmadas dão carimbo. Com ele **desligado** na empresa: as telas de fidelidade somem, as vendas não dão carimbo, a página do cliente mostra "Este cartão não foi encontrado." e os dados já gravados ficam guardados (voltam se o módulo for religado).

## 8. Mensagens para o cliente

Formato WhatsApp, igual à spec 001, seção 8 (`*texto*` = negrito; valores em `R$ 1.234,56` com espaço comum). O botão **Copiar mensagem** copia o texto cru. Nenhuma mensagem é enviada sozinha.

**Carimbo ganho** (cartão ainda não completo):

```
*{nome}*, sua compra na {empresa} valeu 1 carimbo!
Você tem {carimbos} de {meta}. Faltam {faltam} para ganhar *{premio}*.
Veja seu cartão: {link}
```

**Cartão completo** (com carimbos liberados suficientes):

```
*{nome}*, seu cartão da {empresa} está completo!
Você ganhou *{premio}*. É só pedir na próxima visita.
Veja seu cartão: {link}
```

**Cartão completo, prêmio ainda a liberar:**

```
*{nome}*, seu cartão da {empresa} está completo!
Você ganhou *{premio}*. Pode pedir a partir de {data}.
Veja seu cartão: {link}
```

**Só o link** (quando o cliente pede para ver o cartão):

```
*{nome}*, este é o seu cartão fidelidade da {empresa}:
{link}
```

Exemplo (João, Lanchonete da Maria, 4 de 10, prêmio "1 salgado grátis"):

```
*João*, sua compra na Lanchonete da Maria valeu 1 carimbo!
Você tem 4 de 10. Faltam 6 para ganhar *1 salgado grátis*.
Veja seu cartão: https://…/cartao/9f3k…
```

`{nome}` é o primeiro nome do cliente; `{link}` é o endereço completo do cartão (RF8); `{data}` em `dd/mm/aaaa`.

## 9. Fluxos principais

**Configurar o programa (uma vez)**
1. O responsável abre **Fidelidade** pela primeira vez e vê "Configure seu cartão fidelidade".
2. Preenche meta, prêmio, valor mínimo (opcional) e prazo de liberação, e toca em **Criar cartão fidelidade**.
3. A partir daí, as vendas lançadas e confirmadas dão carimbo (RF3).

**Carimbo na confirmação da venda**
4. O responsável confirma o recebimento de uma venda (spec 001, seção 9, passo 5), como já faz hoje.
5. Se a venda vale carimbo (RF3), a frase de sucesso da confirmação ganha uma linha: "João ganhou 1 carimbo: 4 de 10." (ou "João completou o cartão!"), com o botão **Copiar mensagem do cartão** (seção 8).
6. Se não vale (ex.: abaixo do valor mínimo), nada muda na confirmação.

**Entregar o prêmio**
7. O cliente pede o prêmio. O responsável abre **Fidelidade**, encontra o cliente (os cartões completos aparecem primeiro) e abre o cartão.
8. Se os carimbos já estão liberados, toca em **Registrar resgate** e confirma. Os carimbos usados saem do cartão; o histórico mostra o resgate. Se não, a tela mostra "Prêmio liberado a partir de dd/mm/aaaa".

**Cliente vê o cartão**
9. O cliente toca no link recebido pelo WhatsApp e vê o cartão (seção 11).

## 10. Telas da visão da empresa

Regras comuns: as mesmas da spec 001, seção 10 (cabeçalho com o nome da empresa, estados Carregando / Erro / Sem conexão, erros embaixo do campo, nada mostrado como salvo antes de o servidor confirmar) e o `specs/design/DESIGN.md`.

- **Navegação inferior** (decidido em 2026-10-20): os destinos dependem dos módulos ativos (spec 000, RE5 e RE7), na ordem **Nova venda** (em destaque), **Vendas**, **Indicadores** (só com Indicação) e **Fidelidade** (só com Fidelidade). Segue a prática comum de barra inferior com **3 a 5 destinos**, todos com ícone e nome; com os módulos de hoje, são no máximo 4. Se um dia passar de 5, o último vira **Mais**. Conferir em telas de 360px e com a fonte aumentada.

### 10.1 Fidelidade (início)

- **Sem programa:** título "Configure seu cartão fidelidade", uma frase ("A cada compra paga, o cliente ganha um carimbo. Ao completar o cartão, ganha um prêmio.") e o formulário da 10.4 com o botão **Criar cartão fidelidade**.
- **Com programa:**
  - No topo, o resumo do programa: "{meta} carimbos = {premio}", se houver "Compras a partir de R$ X" e "Carimbo liberado {N} dias depois do pagamento" (ou "Carimbo liberado na hora"). Link **Ajustar cartão** (abre a 10.4).
  - Campo de busca por nome ou telefone ("Buscar cliente").
  - Um cartão por cliente com pelo menos 1 carimbo ou 1 resgate: nome, telefone formatado, "N de M carimbos" com uma barra de progresso e, se completo, o selo **Cartão completo** (ou **Prêmio liberado em dd/mm** quando os carimbos ainda não foram liberados). Ordem: completos primeiro; depois por carimbos no cartão, do maior para o menor; empate por nome.
  - Tocar no cartão abre o **Cartão do cliente** (10.2).
  - Vazio: "Nenhum cliente com carimbo ainda. Os carimbos aparecem quando você confirma o recebimento de uma venda."
  - Busca sem resultado: "Nenhum cliente encontrado."

### 10.2 Cartão do cliente

- **Objetivo:** ver o cartão de um cliente, entregar o prêmio e enviar o link.
- **Mostra:** nome e telefone no topo; o cartão com os carimbos desenhados (M espaços, preenchidos até a meta; os a liberar com aparência diferente dos liberados, com ícone e não só cor), "N de M carimbos" e o prêmio. Se houver a liberar: "X a liberar" com a data do próximo. Acima da meta: "+ X carimbos para o próximo cartão".
- **Ações:**
  - **Registrar resgate** (botão principal, só com carimbos liberados ≥ meta). Diálogo: "Entregar {premio} para João? O cartão volta para {carimbos − meta} de {meta}." / "Sim, entregar prêmio" e "Não, voltar". Depois: "Prêmio entregue." (não some sozinha).
  - Cartão completo sem carimbos liberados suficientes: no lugar do botão, o aviso "Prêmio liberado a partir de dd/mm/aaaa. Antes disso, as vendas ainda estão no prazo de devolução."
  - **Copiar mensagem**: copia a mensagem da seção 8 adequada ao cartão; vira "✓ Copiado".
  - **Gerar novo link** (botão discreto, no fim da tela). Diálogo: "Gerar um novo link para o cartão de João? O link antigo para de funcionar." / "Sim, gerar novo link" e "Não, voltar".
- **Histórico** (mais novos primeiro):
  - carimbo: "+1 carimbo", data, valor final da venda e "Liberado" ou "Libera em dd/mm/aaaa"; se a venda foi cancelada, "Carimbo retirado: venda cancelada em dd/mm/aaaa";
  - resgate: "Resgate: {premio}", data e hora, e o link **Desfazer resgate** (diálogo: "Desfazer o resgate de dd/mm/aaaa? Os {meta} carimbos voltam para o cartão de João." / "Sim, desfazer resgate" e "Não, voltar"); se desfeito, "Resgate desfeito em dd/mm/aaaa" e sem o link.
- **Erros:** resgate recusado porque o cartão mudou (ex.: venda cancelada em outra aba): "O cartão de João não tem mais carimbos liberados suficientes. Nada foi registrado."

### 10.3 Ajustes nas telas de venda

- **Confirmar recebimento** (spec 001, 10.8): quando a venda dá carimbo, a frase de sucesso inclui "João ganhou 1 carimbo: N de M." ou "João completou o cartão!", com o botão **Copiar mensagem do cartão**.
- **Cancelar venda** paga com carimbo ainda não usado: o diálogo acrescenta "O carimbo desta venda sai do cartão de João."
- **Cancelar venda** cujo carimbo já foi usado em resgate (RF5): recusado com "Esta venda já entrou no prêmio que João resgatou. Para cancelar, desfaça o resgate no cartão de João." e o link **Abrir cartão de João**.
- Sem outras mudanças no fluxo de venda (nenhum campo novo).

### 10.4 Configurar / ajustar cartão

- **Campos:**
  - Carimbos para completar (ex.: 10; teclado numérico).
  - Prêmio (ex.: 1 salgado grátis).
  - Valor mínimo da compra (opcional; ex.: 15; "15" vira "R$ 15,00"), com a dica "Compras abaixo deste valor não ganham carimbo. Deixe vazio para valer qualquer compra."
  - Dias para liberar o carimbo (já vem 7; teclado numérico), com a dica "Use o seu prazo de devolução. O prêmio só sai de compras que já passaram desse prazo. 0 = libera na hora."
- **Prévia** do cartão como o cliente verá, atualizada enquanto digita.
- **Ação:** **Criar cartão fidelidade** (primeira vez) ou **Salvar ajustes**. Ao ajustar, diálogo: "Salvar os ajustes? Vale para todos os cartões a partir de agora. Carimbos já ganhos continuam." / "Sim, salvar" e "Não, voltar".
- **Erros:** meta fora de 2 a 50: "O cartão precisa ter de 2 a 50 carimbos."; prêmio vazio: "Digite o prêmio. Ex.: 1 salgado grátis."; prêmio longo: "O prêmio pode ter até 60 letras."; valor mínimo inválido: "Digite um valor. Ex.: 15 ou 15,50."; prazo fora de 0 a 90: "O prazo precisa ser de 0 a 90 dias."

## 11. Tela da visão do cliente

### 11.1 Meu cartão (`/cartao/{chave}`)

- **Sem login, sem navegação inferior e sem cabeçalho do app.** Funciona em qualquer celular, aberta pelo link do WhatsApp.
- **Mostra:**
  - nome da empresa em destaque e "Cartão fidelidade";
  - "Olá, {primeiro nome}!";
  - o cartão com M carimbos desenhados, preenchidos conforme os carimbos no cartão;
  - "Você tem N de M carimbos" e "Faltam X para ganhar {premio}"; com cartão completo, "Cartão completo! Você ganhou {premio}. É só pedir na próxima visita." ou, se ainda não liberado, "Cartão completo! Você ganhou {premio}. Pode pedir a partir de dd/mm/aaaa.";
  - regra em uma frase: "A cada compra ganhe 1 carimbo." ou "A cada compra a partir de R$ 15,00 ganhe 1 carimbo.";
  - histórico curto (mais novos primeiro): "Carimbo · dd/mm/aaaa" e "Prêmio resgatado · dd/mm/aaaa" (sem valores; carimbos retirados e resgates desfeitos não aparecem);
  - rodapé discreto: "Feito com Kero System".
- **Não mostra:** telefone, valores de compra, códigos, indicador (RF9).
- **Link inválido ou trocado:** "Este cartão não foi encontrado. Peça um novo link para a empresa." (sem revelar se o cliente ou a empresa existem).
- **Módulo desligado na empresa:** a mesma mensagem de link inválido.
- **Carregando / sem conexão:** como nas regras comuns.
- **Atualização:** os dados são os do momento em que a página abre; recarregar mostra o cartão atual.

## 12. Critérios de aceite

Exemplos com meta 10, prêmio "1 salgado grátis" e prazo de 7 dias, salvo quando dito.

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Sem programa | empresa nunca configurou | Fidelidade mostra "Configure seu cartão fidelidade"; vendas confirmadas não dão carimbo |
| Criar programa | meta 10, prêmio "1 salgado grátis", sem valor mínimo, prazo 7 | programa criado; tela mostra "10 carimbos = 1 salgado grátis" |
| Meta inválida | meta 1 ou 51 | recusado: "O cartão precisa ter de 2 a 50 carimbos." |
| Prazo inválido | 91 dias | recusado: "O prazo precisa ser de 0 a 90 dias." |
| Carimbo na confirmação | confirmar venda de João (R$ 104,50) em 01/11 | João ganha 1 carimbo, a liberar em 08/11; frase "João ganhou 1 carimbo: 1 de 10." |
| Prazo zero | prazo 0; confirmar venda | carimbo liberado na hora |
| Venda pendente | venda lançada e não confirmada | sem carimbo |
| Venda sem código | venda confirmada sem código | ganha carimbo |
| Abaixo do valor mínimo | mínimo R$ 15,00; venda confirmada de R$ 12,00 | sem carimbo; confirmação igual à de hoje |
| Mudança no valor mínimo | venda confirmada de R$ 12,00 sem mínimo; depois mínimo passa a R$ 15,00 | o carimbo antigo continua |
| Mudança no prazo | carimbo a liberar em 08/11; prazo passa de 7 para 30 | o carimbo continua liberando em 08/11 |
| Venda anterior ao programa | venda lançada antes de criar o programa e confirmada depois | sem carimbo |
| Completar cartão | João com 9 de 10 confirma mais uma venda | 10 de 10; "João completou o cartão!" |
| Completo, a liberar | 10 de 10, o 10º carimbo libera em 08/11; hoje 05/11 | sem **Registrar resgate**; aviso "Prêmio liberado a partir de 08/11/2026." |
| Resgate | 10 de 10, todos liberados | resgate registrado; cartão volta a 0 de 10 |
| Resgate com sobra | 12 de 10, todos liberados | resgate usa os 10 mais antigos; cartão vai a 2 de 10 |
| Resgate só com liberados | 12 de 10, 9 liberados | sem resgate até liberar o 10º |
| Resgate sem carimbos suficientes | tentar registrar com 9 liberados (ex.: pelo servidor) | recusado; nada registrado |
| Desfazer resgate | desfazer o resgate acima | carimbos voltam; histórico mostra "Resgate desfeito" |
| Cancelar venda com carimbo não usado | João com 4 de 10 cancela uma venda paga | 3 de 10; histórico mostra "Carimbo retirado" |
| Cancelar venda já usada em resgate | João resgatou; tenta cancelar uma das 10 vendas do resgate | recusado com a mensagem da 10.3; venda continua Paga |
| Cancelar depois de desfazer o resgate | desfaz o resgate e cancela a venda | aceito; carimbo retirado |
| Ajustar meta | meta muda de 10 para 8; Ana tem 8 carimbos liberados | Ana passa a ter cartão completo e pode resgatar; resgates antigos mantêm meta 10 |
| Link do cliente | abrir `/cartao/{chave}` de João | mostra empresa, "Olá, João!", N de M, prêmio, histórico sem valores |
| Privacidade | página do cliente | não aparece telefone, valor, código nem indicador |
| Link trocado | gerar novo link e abrir o antigo | "Este cartão não foi encontrado. Peça um novo link para a empresa." |
| Link inventado | `/cartao/abc` | mesma mensagem; nada é revelado |
| Mensagem | copiar mensagem com 4 de 10 | texto da seção 8, com o link do cartão |
| Só Fidelidade | empresa com Fidelidade e sem Indicação | navegação: Nova venda, Vendas, Fidelidade; venda sem campo de código ganha carimbo |
| Módulo desligado | Fidelidade desligada na empresa | destino Fidelidade some; vendas não dão carimbo; link do cliente mostra "não encontrado"; ao religar, os cartões voltam |
| Isolamento | empresa A abre o cartão de um cliente da B pelo app | "não encontrado"; nada da B aparece |
| Mesmo cliente em duas empresas | João é cliente de A e de B | dois cartões e dois links independentes |

## 13. Decisões tomadas (2026-10-20)

- RF2: o programa pode ser ajustado; vale daqui para frente.
- RF3: vendas lançadas antes da criação do programa não dão carimbo.
- RF4/RF5: o resgate só usa carimbos de vendas pagas e fora do prazo de devolução; o prazo é definido por cada empresa (padrão 7 dias). Venda já usada em resgate não pode ser cancelada sem desfazer o resgate antes. Não existe saldo negativo.
- RF10: módulos independentes. Por enquanto toda empresa nasce com todos os módulos ativos (fase de testes); a base já permite desligar um módulo por empresa (spec 000, RE5).
- Vendas e clientes viram base comum, usada por qualquer módulo (spec 000, RE7).
- Carimbos não vencem no MVP.
- Navegação: barra inferior com os destinos dos módulos ativos (3 a 5), Fidelidade como quarto destino.
