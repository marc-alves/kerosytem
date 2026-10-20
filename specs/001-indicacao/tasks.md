# Tarefas — 001 Indicação

Ordem sugerida. Cada tarefa é pequena e entregável sozinha; "depende de" indica a ordem mínima. As referências RN e seções apontam para `spec.md`; "checklist" é a seção 13 do `DESIGN.md`. Tarefas acrescentadas depois da primeira versão começam em T26, para não renumerar as existentes.

**Definição de pronto (vale para toda tarefa):** testes passando (`npm test`), `npm run lint` sem erros, critério da spec citado na tarefa atendido, checkbox marcado `[x]` e um commit só para a tarefa. **Tarefas de tela:** checklist do `DESIGN.md` atendido, conferido em ~360px de largura e com a fonte do sistema aumentada.

## Fase 0 — Sincronizar o plano
- [x] T0. Atualizar o `plan.md` para refletir a spec aprovada: status da venda (`pendente|confirmada|cancelada`), `limite_usos` no código, telefone normalizado único (cliente e indicador), vínculo criado na confirmação, saldo só com vendas confirmadas, login Supabase Auth. Verificação: revisão sua do `plan.md`. **Bloqueia a Fase 2 em diante.**

## Fase 1 — Regras puras (sem banco, sem tela, em `lib/`)
- [x] T1. Configurar Jest e o script `npm test` (verificação: um teste de exemplo em `lib/indicacao/` passa)
- [x] T2. `normalizarCodigo` e `normalizarTelefone` (RN1, RN4): maiúsculas/minúsculas; formatos de telefone equivalentes; telefone inválido recusado (depende de T1)
- [x] T3. `calcularVenda` (RN8): centavos inteiros, percentuais em centésimos de ponto, arredondamento metade para cima; caso 110,00 / 5% / 3% → desconto 5,50, final 104,50, comissão 3,14 (depende de T1)
- [x] T4. `validarCodigo` — código (RN2, RN3): ativo e validade recusam (válido até 23h59 de Brasília do dia de validade); limite de usos **não recusa**, apenas devolve o aviso (`limiteAtingido`); só vendas confirmadas contam (9 confirmadas + 5 pendentes = sem aviso) (depende de T2)
- [x] T5. `validarCodigo` — cliente (RN5, RN6, RN7): primeira compra só sem venda confirmada, com aviso se houver venda pendente; vínculo ao indicador; recusa de autoindicação por telefone (depende de T4)
- [x] T26. `formatarReais` e `formatarPercentual` em `lib/formato/` (seção 8, `DESIGN.md` seção 5): `R$ 1.234,56` com espaço comum (o `Intl` do pt-BR usa espaço não separável: trocar); `5%` e `7,5%` (depende de T1)
- [ ] T6. `gerarMensagem` (seção 8): `*nome*`, `~riscado~`, `*final*`, usando T26; só existe para venda com código (RN9) (depende de T26)
- [ ] T7. `calcularSaldo` (RN11): só vendas confirmadas entram; pendentes saem à parte como "a confirmar"; pagamento ao indicador não pode passar do saldo (depende de T3)
- [ ] T8. Transições de status (RN10, RN12, RN6, RN5): pendente→confirmada, pendente/confirmada→cancelada; confirmar recusa quando o cliente já tem vínculo com outro indicador **e** quando a venda é de primeira compra e o cliente já tem outra venda confirmada; cancelar venda confirmada é bloqueado se o saldo ficaria negativo (depende de T5, T7)

## Fase 2 — Fundação (banco e acesso)
- [ ] T9. Criar projeto Supabase e `.env.local` (feito por você; nunca colar chaves no chat nem commitar)
- [ ] T10. Login com Supabase Auth (um usuário criado à mão, sem cadastro público), sessão longa e proteção das rotas no `proxy.ts`; tela de login conforme `DESIGN.md` seção 8 ("Mostrar senha", erro em linguagem simples) e checklist (depende de T9, T27, T30)
- [ ] T11. Migration: `indicadores` (telefone obrigatório e único), `clientes` (telefone normalizado único, vínculo nulo até a primeira confirmação), `codigos` (com `limite_usos`, percentuais em centésimos de ponto, `valido_ate` como data; só `ativo` muda depois de criado), `vendas` (status `pendente|confirmada|cancelada`, percentuais e valores gravados, `confirmada_em`, `cancelada_em`), `pagamentos_indicador` (com `cancelado_em`); views de saldo, "a confirmar" e usos do código (depende de T0, T9)
- [ ] T12. RLS ativa em todas as tabelas; verificação: consulta sem login não retorna dados (depende de T11)
- [ ] T13. Seed de desenvolvimento com **telefones fictícios**: Camila, Amanda, `camila5`, `primeiraamanda`, João (depende de T11)

## Fase 3 — Casos de uso no servidor
- [ ] T14. `lancarVenda`: cria o cliente se for novo, valida (T4, T5), calcula (T3), grava como **pendente** numa transação e devolve a mensagem (venda com código) ou nada (venda sem código) (depende de T6, T8, T11)
- [ ] T15. `confirmarRecebimento` (revalida o vínculo e a primeira compra; cria o vínculo na primeira confirmação; grava `confirmada_em`) e `cancelarVenda` (grava `cancelada_em`) (depende de T14)
- [ ] T16. `registrarPagamentoIndicador` (dinheiro / crédito em produtos), recusando valor acima do saldo, e `cancelarPagamento` (depende de T7, T15)

## Fase 4 — Base visual (`DESIGN.md`)
- [ ] T27. Tema: tokens de cor, tamanhos e espaçamentos do `DESIGN.md` no `@theme` de `app/globals.css`; **remover o modo escuro**; `lang="pt-BR"` e título do app no `layout.tsx`; fonte única (`system-ui` ou `next/font`) com texto base 18px em `rem`; remover a página de exemplo do template
- [ ] T28. Logo: arquivo oficial em `public/` (você fornece o arquivo; não recriar) e conferência das cores da seção 4 do `DESIGN.md`
- [ ] T29. Máscara de telefone para o campo (enquanto digita), em `lib/formato/`, com testes (depende de T2)
- [ ] T30. Componentes base (`DESIGN.md` seções 7 e 9): botão (primário, secundário, perigo), campo com rótulo e exemplo, cartão, selo de status ("Aguardando pagamento", "Pago", "Cancelada" com ícone), aviso, diálogo de confirmação e estados carregando, vazio, erro e sem conexão (depende de T27)
- [ ] T31. Layout do app: navegação inferior fixa (**Nova venda**, **Vendas**, **Indicadores**), cabeçalho com logo pequeno, título e botão "Voltar" escrito; checklist (depende de T28, T30)

## Fase 5 — Telas (finas: só chamam os casos de uso; todas seguem o checklist do `DESIGN.md`)
- [ ] T17. Indicadores: lista com saldo confirmado e valor "a confirmar", mais cadastro com nome e telefone obrigatório; checklist (depende de T16, T31)
- [ ] T18. Criar código: desconto, comissão, tipo, validade, limite de usos (padrão 10); erro claro para código duplicado; sem edição depois de criado; checklist (depende de T11, T31)
- [ ] T32. Desativar e reativar código no detalhe do indicador (RN2), sem afetar vendas antigas; checklist (depende de T18, T21)
- [ ] T19. Nova venda em 3 telas (seção 9): tela 1 telefone do cliente (nome só se for novo), tela 2 código (opcional) e valor, tela 3 conferência **sem comissão** com avisos (limite de usos atingido, venda pendente do cliente) e botão "Lançar venda"; checklist (depende de T14, T26, T29, T31)
- [ ] T20. Tela de sucesso: venda com código mostra a mensagem com botão **Copiar mensagem** (texto cru com `*` e `~`; vira "✓ Copiado" e fica assim); venda sem código mostra "Venda lançada" e o valor; nos dois casos, botão **Nova venda**; checklist (depende de T19)
- [ ] T33. **Desfazer esta venda** na tela de sucesso: cancela a venda pendente recém-lançada, com diálogo de confirmação; checklist (depende de T15, T20)
- [ ] T21. Detalhe do indicador: códigos com contagem de usos e aviso de limite com botão **Criar novo código**, vendas ("Aguardando pagamento" e "Pago") com **Confirmar recebimento**, pagamentos e **Registrar pagamento**; checklist (depende de T15, T16, T31)
- [ ] T22. Lista de vendas com filtro por indicador, período (data de lançamento) e situação, e **Confirmar recebimento** nas que aguardam pagamento; checklist (depende de T15, T31)
- [ ] T34. Cancelar venda (detalhe do indicador e lista de vendas): diálogo de perigo com a consequência escrita ("A comissão de R$ 3,14 sai do saldo da Camila."); quando bloqueado (RN12), explicar o motivo e o que fazer; checklist (depende de T15, T21, T22)
- [ ] T35. Cancelar pagamento ao indicador no detalhe do indicador, com diálogo de confirmação; o valor volta ao saldo; checklist (depende de T16, T21)

## Fase 6 — Fechamento
- [ ] T23. Passada manual no celular por todos os cenários da seção 11 da spec, mais o **teste de uso com a Shirley**: ela faz sozinha, sem explicação, as tarefas de cada tela (lançar venda com e sem código, copiar a mensagem, confirmar recebimento, desfazer e cancelar venda, registrar pagamento, criar e desativar código); anotar onde ela travou e corrigir
- [ ] T24. Deploy (HTTPS, variáveis de produção) e 3 vendas reais com a Shirley
- [ ] T25. Atualizar o README e registrar no `spec.md` qualquer regra que mudou durante o uso
