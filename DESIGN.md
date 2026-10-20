# DESIGN.md — Kerosystem

Diretrizes de aparência e experiência (UI/UX) do app da **Kero Salgados**. Vale para todas as funcionalidades (indicação, fidelidade etc.).

**Como usar:** ao criar ou alterar qualquer tela, siga este arquivo. O **comportamento** de cada tela está na `spec.md` da funcionalidade; aqui está **como ela parece e se comporta visualmente**. Em conflito sobre comportamento, a spec vence. Os valores reais (cores, tamanhos, espaçamentos) ficam nos tokens do código (ex.: config do Tailwind); este arquivo descreve a intenção.

> A paleta parte da identidade da Kero no Instagram (creme, laranja e marrom), com cores amostradas do perfil. Se houver o arquivo oficial do logo ou um manual de marca, confirme os valores e ajuste os tokens e a seção 4.

## 1. Contexto de uso

O app é usado **somente no celular**, por uma pessoa idosa ou pouco habituada a aplicativos, geralmente em pé, atendendo cliente, às vezes com a mão ocupada ou suja e com a vista cansada. Ela **não pode precisar de treinamento nem de ajuda**. Trate essa usuária como o caso padrão, não como exceção. Prioridade absoluta: **lançar uma venda rápido, sem errar**.

## 2. Princípios

1. **Mobile-first total.** O celular (360 a 430px de largura) é o único alvo de projeto. Telas maiores só não podem quebrar.
2. **Simplicidade extrema.** Uma ação principal por tela, no máximo **3 campos visíveis** por vez. Se precisar de mais, divida em passos.
3. **Tudo visível e escrito.** Nada de menus escondidos, ícones sem texto ou gestos. Toda ação é um botão grande com o nome da ação.
4. **Sem gestos.** Não usar arrastar, deslizar, toque longo, toque duplo, pinça ou "puxar para atualizar". Só toque simples.
5. **Nada some sozinho.** Mensagens, avisos e resultados ficam na tela até a pessoa tocar para sair.
6. **Fácil de desfazer, difícil de errar.** Confirmação clara em ações que mexem em dinheiro e caminho visível para cancelar um engano.
7. **Sempre igual.** Mesmos botões nos mesmos lugares, com os mesmos nomes, em todas as telas.
8. **Nunca esconda um erro nem finja que salvou.** Se algo falhou, diga em palavras simples e diga o que fazer.

## 3. Contexto técnico de tamanho e toque

- Texto base **18px** (nunca abaixo de 16px em nenhum lugar). Respeitar o aumento de fonte do sistema (usar `rem`, não `px` fixo para texto).
- Alvos de toque: botões e campos com altura mínima de **56px**; espaço de pelo menos **12px** entre botões. Botões de ação perigosa (cancelar) ficam **afastados** do botão principal.
- Sem tabelas: listas de **cartões** em coluna única. Sem rolagem horizontal; reduzir ao mínimo a rolagem vertical por tela.

## 4. Marca e cores

Tema **claro** apenas no MVP. Visual da Kero: fundo creme, laranja e marrom, tom quente de comida, sem exagero.

**Logo:** usar o arquivo original (guardar em `public/`), sem recriar nem distorcer. No app, só no login e no cabeçalho, em tamanho pequeno. O rosa do chapéu de chef pode aparecer como acento pontual, usando a cor exata do logo; não é cor de interface.

| Token | Valor | Uso |
|---|---|---|
| `fundo` | `#FBF5E8` | fundo das telas (tom mais claro do creme da marca) |
| `creme` | `#F2E1BC` | creme da marca: faixas, cabeçalhos, destaques suaves |
| `superficie` | `#FFFFFF` | cartões, campos |
| `texto` | `#2B1608` | texto principal (marrom bem escuro) |
| `texto-suave` | `#6B4F3A` | textos secundários, legendas |
| `laranja` | `#E68127` | laranja da marca: botão principal, **com texto `texto`** (não branco) |
| `laranja-pressionado` | `#C96A12` | estado pressionado do botão principal |
| `laranja-escuro` | `#A04A00` | links, texto laranja sobre fundo claro e borda de 1px do botão principal |
| `borda` | `#E8DCC4` | divisores e bordas decorativas |
| `borda-campo` | `#8C6F58` | borda de campos e controles (precisa ser visível) |

O laranja da marca com texto branco **não** tem contraste suficiente; por isso o botão principal usa texto marrom escuro (contraste cerca de 6:1) e uma borda `laranja-escuro`, que também o separa do fundo.

**Cores de status** (sempre com **ícone + texto**, nunca só a cor):

| Estado | Texto | Fundo | Ícone sugerido |
|---|---|---|---|
| Aguardando pagamento / aviso | `#92400E` | `#FEF3C7` | relógio / alerta |
| Pago | `#166534` | `#DCFCE7` | check |
| Cancelada / erro | `#991B1B` | `#FEE2E2` | x |

Todos os pares de texto acima passam no contraste AA (mínimo 4,5:1). Ao trocar a paleta, valide de novo.

## 5. Tipografia e números

- Fonte do sistema (`system-ui`) ou uma única família via `next/font`. Sem fontes decorativas.
- Texto base 18px; títulos de tela 24 a 28px, semibold; texto de botão 18 a 20px, semibold; entrelinha 1,5.
- **Valores em reais** bem grandes (24px ou mais, semibold) e com `font-variant-numeric: tabular-nums`.
- Sempre formatar via **uma única função utilitária**: `R$ 1.234,56`. Nunca montar o texto na mão em cada tela.
- Percentuais: `5%`; com decimal, vírgula (`7,5%`).

## 6. Layout e navegação

- Coluna única, largura máxima ~480px, centralizada em telas grandes. Margem lateral de 16px; cantos arredondados de 12px; espaçamento em múltiplos de 4px.
- **Navegação inferior fixa** com três destinos, cada um com **ícone grande e nome escrito sempre visível**: **Nova venda** (em destaque), **Vendas** e **Indicadores**. O destino atual fica claramente marcado.
- Cada tela tem **título claro** no topo e, quando não for um dos três destinos, um botão **"Voltar"** escrito (não só uma seta).
- O botão principal da tela fica fixo na parte de baixo, ao alcance do polegar, quando houver rolagem.

## 7. Componentes

- **Botão:** largura total no celular, altura mínima 56px, texto com o nome da ação ("Lançar venda", "Copiar mensagem", "Sim, confirmar recebimento"). Variantes: primário (`laranja`, texto `texto`, borda `laranja-escuro`), secundário (contorno), perigo (vermelho, só para cancelar). **Um único primário por tela.**
- **Campo:** rótulo **sempre visível** acima, em texto grande, com **exemplo** do que digitar ("Ex.: (61) 99999-9999"). Erro logo abaixo, com ícone e texto. Teclado adequado: `inputMode="tel"` para telefone e `inputMode="decimal"` para valor. Máscara de telefone enquanto digita. O primeiro campo da tela já abre com o cursor. O botão de avançar do teclado deve passar para o próximo campo.
- **Cartão:** superfície branca, borda `borda`, para cada item de lista, com o essencial em poucas linhas.
- **Selo de status:** pílula com ícone + texto. Rótulos na tela: `pendente` = **"Aguardando pagamento"**, `confirmada` = **"Pago"**, `cancelada` = **"Cancelada"**.
- **Aviso:** faixa com ícone, frase curta e, se fizer sentido, um botão de ação (ex.: limite de usos atingido, com "Criar novo código"). Não desaparece sozinho.
- **Diálogo de confirmação:** título com a ação, resumo (nome e valor) e **dois botões escritos com a ação completa**, por exemplo "Sim, confirmar recebimento" e "Não, voltar". O botão seguro ("Não, voltar") é sempre fácil de achar.

## 8. Padrões de interação

**Lançar venda.** Formulário curto com **três campos em ordem**: telefone do cliente, código (opcional) e valor. O nome do cliente só aparece se ele for novo. Em seguida, uma tela de **conferência** com um único botão grande "Lançar venda". O campo de código aceita maiúscula, minúscula e espaços sem reclamar. O campo de valor aceita "110" e mostra "R$ 110,00".

**Prévia da venda.** Valor original riscado, valor final em destaque e o desconto aplicado, tudo em letras grandes para conferir antes de lançar. **Não** exibir a comissão do indicador (ela só aparece no detalhe do indicador). Avisos relevantes (limite de usos, cliente com venda pendente) aparecem logo abaixo, antes do botão.

**Mensagem pronta.** Cartão com o texto exatamente como será enviado e um botão grande **"Copiar mensagem"**. Ao tocar, o próprio botão muda para **"✓ Copiado"** e **permanece assim** enquanto a pessoa estiver na tela (sem aviso que some). Na mesma tela, ficam visíveis o botão "Nova venda" e um link claro **"Desfazer esta venda"** para corrigir um engano.

**Confirmar recebimento.** Diálogo com o resumo: "Confirmar recebimento de R$ 104,50 de João?". Botões: "Sim, confirmar recebimento" e "Não, voltar". Depois, o selo muda para "Pago".

**Cancelar.** Em estilo de perigo, com a consequência escrita: "Cancelar esta venda? A comissão de R$ 3,14 sai do saldo da Camila." Se o sistema bloquear o cancelamento, explicar o motivo em português simples e o que fazer.

**Formulários.** Validar ao sair do campo e ao enviar; erro ao lado do campo, dizendo o que corrigir ("O telefone precisa ter DDD"). Manter o que a pessoa já digitou quando houver erro. Nunca apagar o formulário por causa de um erro.

**Entrar no app.** Login com e-mail e senha, com botão **"Mostrar senha"** e suporte ao preenchimento automático do celular. Manter a sessão aberta por longo período, para que a pessoa quase nunca precise entrar de novo. Mensagem de login errado em linguagem simples ("E-mail ou senha incorretos. Tente de novo.").

## 9. Estados

- **Carregando:** indicador grande com a palavra "Carregando…"; nunca tela em branco.
- **Vazio:** frase curta e o botão para começar ("Nenhum indicador ainda. Cadastrar o primeiro").
- **Erro:** mensagem clara em texto grande + botão "Tentar de novo".
- **Sem conexão:** faixa fixa no topo, "Sem internet. Nada foi salvo.", enquanto durar. Nunca mostrar sucesso sem confirmação do servidor.

## 10. Texto e tom

- Tratamento por "você", **frases curtas**, palavras do dia a dia. Nada de siglas ou termos técnicos (sem "status", "ID", "cadastro inválido").
- Botões com verbo de ação ("Lançar venda", "Copiar mensagem", "Cadastrar indicador").
- Erros dizem o que aconteceu e o que fazer: "Este cliente já usa os códigos da Camila. Use um código dela."
- **Vocabulário fixo** (igual em todas as telas):
  - **Confirmar recebimento**: o cliente pagou a compra.
  - **Aguardando pagamento**: venda lançada ainda não paga (`pendente`).
  - **Pago**: venda com recebimento confirmado (`confirmada`).
  - **Pagamento ao indicador**: o que a Shirley paga ao indicador. Nunca chamar isso só de "pagamento".
  - **Indicador**, **cliente**, **código**.

## 11. Acessibilidade

- Contraste mínimo AA (4,5:1 para texto; 3:1 para bordas de campos e ícones). O texto principal tem contraste bem acima disso.
- Alvos de toque de pelo menos 56px, com espaço entre eles.
- Informação nunca só por cor: sempre ícone ou texto junto.
- Foco visível; ordem de foco lógica; rótulos em todos os campos.
- Tudo legível com zoom de 200% e fonte grande do sistema, sem cortar nem sobrepor.
- Respeitar `prefers-reduced-motion`; evitar animações, salvo as funcionais e curtas.

## 12. Fora do escopo visual (MVP)

Tema escuro, ilustrações elaboradas, animações decorativas, personalização de cores, qualquer interação por gesto, telas para desktop.

## 13. Checklist antes de dar uma tela como pronta

- [ ] Funciona e é confortável em ~360px de largura, com a fonte do sistema aumentada
- [ ] Uma ação principal óbvia, ao alcance do polegar, com botão de pelo menos 56px
- [ ] No máximo 3 campos visíveis; rótulo visível e exemplo em cada campo; teclado correto
- [ ] Nenhum gesto necessário; nada some sozinho
- [ ] Estados de carregando, vazio, erro e sem conexão tratados
- [ ] Valores formatados pela função utilitária de reais
- [ ] Status com ícone + texto, com os rótulos da seção 10
- [ ] Ações de dinheiro têm diálogo de confirmação com botões escritos por extenso
- [ ] Existe caminho visível para desfazer ou voltar
- [ ] **Teste de uso:** a Shirley consegue fazer a tarefa da tela sozinha, sem explicação