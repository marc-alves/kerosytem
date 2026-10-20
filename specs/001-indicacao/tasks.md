# Tarefas — 001 Indicação

Ordem sugerida. Cada tarefa é pequena e entregável sozinha; "depende de" indica a ordem mínima. As referências RN e seções apontam para `spec.md`; "checklist" é a seção 13 do `DESIGN.md` desta pasta. Tarefas acrescentadas depois da primeira versão começam em T26, para não renumerar as existentes.

**Revisão de 2026-10-20:** comissão e pagamento ao indicador saíram do sistema (spec, seção 5 e RN11 removida). Tarefas canceladas ficam riscadas; o código já feito com comissão/saldo é ajustado nas T36 e T37.

**Revisão de 2026-10-20 (Kero System):** o app deixa de ser de um único negócio e passa a atender qualquer empresa, com cadastro de empresa e módulos. As tarefas da base (cadastro, `empresa_id`, RLS por empresa, troca da marca) estão em `specs/000-empresas/tasks.md` com prefixo **E**; as tarefas daqui que dependem delas citam "depende de Ex". A troca do nome no código (E1, E2) pode ser feita já.

**Revisão de 2026-10-20 (dados mockados):** enquanto o Supabase não existe (T9), casos de uso e telas usam um banco em memória (T42, ver `plan.md`, "Dados mockados"). T39, T40, T14 e T15 são feitas sobre ele; a T43 troca pelo Supabase depois da T11/T12.

**Definição de pronto (vale para toda tarefa):** testes passando (`npm test`), `npm run lint` sem erros, critério da spec citado na tarefa atendido, checkbox marcado `[x]` e um commit só para a tarefa. **Tarefas de tela:** comportamento e textos da subseção da spec 10.x citada, checklist do `DESIGN.md` atendido, conferido em ~360px de largura e com a fonte do sistema aumentada.

## Fase 0 — Sincronizar o plano
- [x] T0. Atualizar o `plan.md` para refletir a spec aprovada: status da venda (`pendente|confirmada|cancelada`), `limite_usos` no código, telefone normalizado único (cliente e indicador), vínculo criado na confirmação, saldo só com vendas confirmadas, login Supabase Auth. Verificação: revisão sua do `plan.md`. **Bloqueia a Fase 2 em diante.**

## Fase 1 — Regras puras (sem banco, sem tela, em `lib/`)
- [x] T1. Configurar Jest e o script `npm test` (verificação: um teste de exemplo em `lib/indicacao/` passa)
- [x] T2. `normalizarCodigo` e `normalizarTelefone` (RN1, RN4): maiúsculas/minúsculas; formatos de telefone equivalentes; telefone inválido recusado (depende de T1)
- [x] T3. `calcularVenda` (RN8): centavos inteiros, percentuais em centésimos de ponto, arredondamento metade para cima; caso 110,00 / 5% → desconto 5,50, final 104,50 (depende de T1). *A comissão sai na T36.*
- [x] T4. `validarCodigo` — código (RN2, RN3): ativo e validade recusam (válido até 23h59 de Brasília do dia de validade); limite de usos **não recusa**, apenas devolve o aviso (`limiteAtingido`); só vendas confirmadas contam (9 confirmadas + 5 pendentes = sem aviso) (depende de T2)
- [x] T5. `validarCodigo` — cliente (RN5, RN6, RN7): primeira compra só sem venda confirmada, com aviso se houver venda pendente; vínculo ao indicador; recusa de autoindicação por telefone (depende de T4)
- [x] T26. `formatarReais` e `formatarPercentual` em `lib/formato/` (seção 8, `DESIGN.md` seção 5): `R$ 1.234,56` com espaço comum (o `Intl` do pt-BR usa espaço não separável: trocar); `5%` e `7,5%` (depende de T1)
- [x] T6. `gerarMensagem` (seção 8): `*nome*`, `~riscado~`, `*final*`, usando T26; só existe para venda com código (RN9) (depende de T26)
- [x] T7. `calcularSaldo` (antiga RN11). *Removida na T37: não há mais saldo.* (depende de T3)
- [x] T8. Transições de status (RN10, RN12, RN6, RN5): pendente→confirmada, pendente/confirmada→cancelada; confirmar recusa quando o cliente já tem vínculo com outro indicador **e** quando a venda é de primeira compra e o cliente já tem outra venda confirmada. *O bloqueio de cancelamento por saldo sai na T37.* (depende de T5, T7)
- [x] T36. Tirar a comissão do módulo de regras (RN1, RN8): `calcularVenda` só recebe `descontoBp` e devolve desconto e valor final; remover `comissaoBp` de `CodigoParaValidar` e de `CalculoVenda` em `tipos.ts`; ajustar os testes (caso 110,00 / 5% → 5,50 / 104,50) (depende de T3)
- [x] T37. Remover saldo (RN11 removida, RN12 nova): apagar `lib/indicacao/saldo.ts` e `saldo.test.ts`; tirar `Saldo`, `ResultadoPagamento`, `StatusPagamento` e `comissao` de `VendaParaTransicao` em `tipos.ts`; `podeCancelarVenda` só recusa venda já cancelada (cancelar venda confirmada é livre); ajustar os testes (depende de T8, T36)
- [x] T38. `lerReais` e `lerPercentual` em `lib/formato/`, com testes: "110" → 11000, "110,5" → 11050, "1.234,56" → 123456; "7,5" → 750; texto inválido, vazio ou zero dá erro com a mensagem da spec 10.5 / 10.4 (depende de T1)

## Fase 2 — Fundação (banco e acesso)
- [ ] T9. Criar projeto Supabase e `.env.local` (feito por você; nunca colar chaves no chat nem commitar)
- [ ] T10. Login com Supabase Auth, sessão longa e proteção das rotas no `proxy.ts` (`/login` e `/cadastro` liberados sem sessão); tela de login conforme **spec 10.1** e `DESIGN.md` seção 8 ("Mostrar senha", erro em linguagem simples); com sessão, `/login` vai para `/vendas/nova`; o link "Criar conta da empresa" entra na E12; checklist (depende de T9, T27, T30)
- [ ] T11. Migration (todas as tabelas com `empresa_id` e unicidades por empresa, spec 000 RE4): `indicadores` (telefone obrigatório e único na empresa), `clientes` (telefone normalizado único na empresa, vínculo nulo até a primeira confirmação), `codigos` (com `limite_usos >= 1`, `desconto_bp` de 0 a 10000, `valido_ate` como data; só `ativo` muda depois de criado; **sem comissão**), `vendas` (status `pendente|confirmada|cancelada`, percentual de desconto e valores gravados, `confirmada_em`, `cancelada_em`; **sem comissão**); views de usos do código e de resumo do indicador (códigos ativos, vendas pagas, total vendido). **Sem tabela de pagamentos ao indicador.** (depende de T0, T9, E5)
- [ ] T12. RLS ativa em todas as tabelas, por empresa (`empresa_id = empresa_atual()`); verificação: consulta sem login não retorna dados e a empresa A não lê nem grava dados da B (depende de T11, E5)
- [ ] T13. Seed de desenvolvimento com **duas empresas fictícias** (ex.: "Lanchonete da Maria" e "Pastelaria do Zé") e **telefones fictícios**: na primeira, Camila, Amanda, `camila5`, `primeiraamanda`, João; na segunda, outro `camila5` e o mesmo telefone do João, para testar o isolamento (depende de T11, E6)

## Fase 3 — Casos de uso no servidor
- [x] T42. Banco em memória (provisório): tipos das linhas e interface `RepositorioIndicacao` em `lib/dados/tipos.ts`, implementação em `lib/dados/memoria.ts`, semente com as duas empresas fictícias da T13 em `lib/dados/semente.ts` e empresa da sessão fixa em `lib/dados/sessao.ts`; testes de isolamento entre as duas empresas (depende de T0)
- [ ] T43. Trocar o banco em memória pelo Supabase: implementar `RepositorioIndicacao` com as views e RPCs e a sessão com `empresa_atual()`; rodar os mesmos testes dos casos de uso contra o banco de desenvolvimento (depende de T11, T12, E9)
- [x] T14. `lancarVenda` (sempre na empresa da sessão): cria o cliente se for novo, valida (T4, T5), calcula (T36), grava como **pendente** numa transação e devolve o id da venda; mais `previaVenda` (valida e calcula sem gravar, devolve prévia e avisos para a tela 3 da spec 10.5) (depende de T6, T36, T11)
- [x] T15. `confirmarRecebimento` (revalida o vínculo e a primeira compra; cria o vínculo na primeira confirmação; grava `confirmada_em`) e `cancelarVenda` (livre para pendente e confirmada; recusa só venda já cancelada; grava `cancelada_em`) (depende de T14, T37)
- [ ] ~~T16. `registrarPagamentoIndicador` e `cancelarPagamento`~~ — **cancelada**: não há pagamento ao indicador no sistema.
- [x] T39. Consultas de leitura em `lib/dados/` (todas restritas à empresa da sessão pela RLS): buscar cliente por telefone; lista de indicadores com resumo; detalhe do indicador (códigos com usos, vendas pendentes e confirmadas); venda por id (tela de sucesso); vendas com filtros de indicador, período (Hoje, 7 dias, 30 dias, Tudo, em horário de Brasília) e situação (depende de T11)
- [x] T40. Actions `cadastrarIndicador` (telefone normalizado e único na empresa), `criarCodigo` (código normalizado e único na empresa, desconto 0–100%, data de hoje em diante, limite ≥ 1) e `definirCodigoAtivo`, com as mensagens da spec 10.2 e 10.4 (depende de T11, T38)

## Fase 4 — Base visual (`DESIGN.md`)
- [x] T27. Tema: tokens de cor, tamanhos e espaçamentos do `DESIGN.md` no `@theme` de `app/globals.css`; **remover o modo escuro**; `lang="pt-BR"` e título do app no `layout.tsx`; fonte única (`system-ui` ou `next/font`) com texto base 18px em `rem`; remover a página de exemplo do template
- [ ] ~~T28. Logo da empresa~~ — **substituída pela E3** (logo do Kero System).
- [x] T29. Máscara de telefone para o campo (enquanto digita), em `lib/formato/`, com testes (depende de T2)
- [ ] T30. Componentes base (`DESIGN.md` seções 7 e 9): botão (primário, secundário, perigo), campo com rótulo e exemplo, botões grandes de escolha (tipo do código, validade, filtros), cartão, selo de status ("Aguardando pagamento", "Pago", "Cancelada", e "Ativo"/"Desativado" para código, com ícone), aviso, diálogo de confirmação e estados carregando, vazio, erro e sem conexão (depende de T27)
- [ ] T31. Layout do app: navegação inferior fixa (**Nova venda**, **Vendas**, **Indicadores**), cabeçalho com logo pequeno do Kero System, título e botão "Voltar" escrito; o nome da empresa e a navegação por módulos ativos entram na E9; checklist (depende de E3, T30)
- [ ] T41. Rota `/` redirecionando para `/vendas/nova`, no lugar da página provisória de `app/page.tsx` (depende de T10)

## Fase 5 — Telas (finas: só chamam os casos de uso; todas seguem a spec 10.x citada e o checklist do `DESIGN.md`)
- [x] T17. Lista de indicadores (**spec 10.2**): bloco "Cadastrar indicador" no topo (nome e telefone, mensagens de erro e frase de sucesso) e cartões com códigos ativos, vendas pagas e total vendido; vazio; checklist (depende de T39, T40, T31)
- [x] T18. Criar código (**spec 10.4**) em 2 passos, sem conferência: passo 1 código (mostra "Fica assim: …"), tipo e desconto; passo 2 validade e limite de usos (padrão 10) com a frase "Depois de criado, o código não pode ser mudado"; erros da spec; volta ao detalhe com "Código {codigo} criado."; checklist (depende de T40, T31)
- [x] T32. Desativar e reativar código no detalhe do indicador (**spec 10.3**, RN2), com diálogo, sem afetar vendas antigas; checklist (depende de T18, T21)
- [x] T19. Nova venda em 3 telas (**spec 10.5**): tela 1 telefone do cliente (nome só se for novo), tela 2 código (opcional) e valor com as recusas da spec, tela 3 conferência com avisos e botão "Lançar venda" (sem toque duplo); "Voltar" mantém o que foi digitado; checklist (depende de T14, T26, T29, T38, T39, T31)
- [x] T20. Venda lançada em `/vendas/[id]/lancada` (**spec 10.6**): venda com código mostra a mensagem com botão **Copiar mensagem** (texto cru com `*` e `~`; vira "✓ Copiado" e fica assim); venda sem código mostra "Venda lançada" e o valor; nos dois casos, selo e botão **Nova venda**; recarregar mantém a tela; checklist (depende de T19)
- [x] T33. **Desfazer esta venda** na tela de sucesso (**spec 10.6**): cancela a venda pendente recém-lançada, com diálogo; depois, selo "Cancelada" e o link some; checklist (depende de T15, T20)
- [x] T21. Detalhe do indicador (**spec 10.3**): resumo, códigos com tipo, desconto, validade, usos e aviso de limite com **Criar novo código**; vendas ("Aguardando pagamento" e "Pago") com **Confirmar recebimento** e as recusas da spec 10.8; **sem seção de pagamentos**; checklist (depende de T15, T39, T31)
- [x] T22. Lista de vendas (**spec 10.7**): filtros de indicador, período (Hoje, Últimos 7 dias, Últimos 30 dias, Tudo) e situação na URL, cartões e **Confirmar recebimento** nas que aguardam pagamento; vazio com **Nova venda**; checklist (depende de T15, T39, T31)
- [x] T34. Cancelar venda (detalhe do indicador e lista de vendas, **spec 10.8**): diálogo de perigo "Cancelar esta venda de R$ 104,50 de João?" (com "Ela deixa de contar como uso do código." se estiver paga); sem bloqueio por saldo; checklist (depende de T15, T21, T22)
- [ ] ~~T35. Cancelar pagamento ao indicador~~ — **cancelada**: não há pagamento ao indicador no sistema.

## Fase 6 — Fechamento
- [ ] T23. Passada manual no celular por todos os cenários da seção 11 da spec, mais o **teste de uso com o responsável de uma empresa piloto**: ele ou ela cria a conta e faz sozinho(a), sem explicação, as tarefas de cada tela (cadastrar indicador, criar e desativar código, lançar venda com e sem código, copiar a mensagem, desfazer venda, confirmar recebimento, cancelar venda, filtrar vendas); anotar onde ela travou e corrigir
- [ ] T24. Deploy (HTTPS, variáveis de produção) e 3 vendas reais com a empresa piloto
- [ ] T25. Atualizar o README e registrar no `spec.md` qualquer regra que mudou durante o uso
