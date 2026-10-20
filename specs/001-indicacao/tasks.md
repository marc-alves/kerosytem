# Tarefas — 001 Indicação

Ordem sugerida. Cada tarefa é pequena e entregável sozinha; "depende de" indica a ordem mínima. As referências RN e seções apontam para `spec.md`.

**Definição de pronto (vale para toda tarefa):** testes passando (`npm test`), `npm run lint` sem erros, critério da spec citado na tarefa atendido, checkbox marcado `[x]` e um commit só para a tarefa. Tarefas de tela: conferir no tamanho de celular.

## Fase 0 — Sincronizar o plano
- [ ] T0. Atualizar o `plan.md` para refletir a spec aprovada: status da venda (`pendente|confirmada|cancelada`), `limite_usos` no código, telefone normalizado único (cliente e indicador), vínculo criado na confirmação, saldo só com vendas confirmadas, login Supabase Auth. Verificação: revisão sua do `plan.md`. **Bloqueia a Fase 2 em diante.**

## Fase 1 — Regras puras (sem banco, sem tela)
- [ ] T1. Configurar Vitest e o script `npm test` (verificação: um teste de exemplo passa)
- [ ] T2. `normalizarCodigo` e `normalizarTelefone` (RN1, RN4): maiúsculas/minúsculas; formatos de telefone equivalentes; telefone inválido recusado (depende de T1)
- [ ] T3. `calcularVenda` (RN8): centavos inteiros, arredondamento metade para cima; caso 110,00 / 5% / 3% → desconto 5,50, final 104,50, comissão 3,14 (depende de T1)
- [ ] T4. `validarCodigo` — código (RN2, RN3): ativo e validade recusam; limite de usos **não recusa**, apenas devolve o aviso (`limiteAtingido`); só vendas confirmadas contam (9 confirmadas + 5 pendentes = sem aviso) (depende de T2)
- [ ] T5. `validarCodigo` — cliente (RN5, RN6, RN7): primeira compra só sem venda confirmada, com aviso se houver venda pendente; vínculo ao indicador; recusa de autoindicação por telefone (depende de T4)
- [ ] T6. `gerarMensagem` (seção 8): `*nome*`, `~riscado~`, `*final*`; formato `R$ 1.234,56` com espaço comum (atenção: o `Intl` do pt-BR usa espaço não separável, trocar nos testes e na saída); percentual sem casas quando inteiro (depende de T1)
- [ ] T7. `calcularSaldo` (RN11): só vendas confirmadas entram; pendentes saem à parte como "a confirmar"; pagamento ao indicador não pode passar do saldo (depende de T3)
- [ ] T8. Transições de status (RN10, RN12, RN6): pendente→confirmada, pendente/confirmada→cancelada; confirmar recusa quando o cliente já tem vínculo com outro indicador; cancelar venda confirmada é bloqueado se o saldo ficaria negativo (depende de T5, T7)

## Fase 2 — Fundação (banco e acesso)
- [ ] T9. Criar projeto Supabase e `.env.local` (feito por você; nunca colar chaves no chat nem commitar)
- [ ] T10. Login com Supabase Auth (um usuário criado à mão, sem cadastro público) e proteção das rotas (depende de T9)
- [ ] T11. Migration: `indicadores` (telefone obrigatório e único), `clientes` (telefone normalizado único, vínculo nulo até a primeira confirmação), `codigos` (com `limite_usos`), `vendas` (status `pendente|confirmada|cancelada`, percentuais e valores gravados), `pagamentos_indicador` (depende de T0, T9)
- [ ] T12. RLS ativa em todas as tabelas; verificação: consulta sem login não retorna dados (depende de T11)
- [ ] T13. Seed de desenvolvimento com **telefones fictícios**: Camila, Amanda, `camila5`, `primeiraamanda`, João (depende de T11)

## Fase 3 — Casos de uso no servidor
- [ ] T14. `lancarVenda`: valida (T4, T5), calcula (T3), grava como **pendente** numa transação e devolve a mensagem (depende de T6, T8, T11)
- [ ] T15. `confirmarRecebimento` (revalida o vínculo e o cria na primeira confirmação) e `cancelarVenda` (depende de T14)
- [ ] T16. `registrarPagamentoIndicador` (dinheiro / crédito em produtos), recusando valor acima do saldo, e `cancelarPagamento` (depende de T7, T15)

## Fase 4 — Telas (finas: só chamam os casos de uso)
- [ ] T17. Indicadores: lista com saldo confirmado e valor "a confirmar", mais cadastro com nome e telefone obrigatório (depende de T16)
- [ ] T18. Criar código: desconto, comissão, tipo, validade, limite de usos (padrão 10); erro claro para código duplicado (depende de T11)
- [ ] T19. Nova venda: telefone do cliente ("cliente novo" ou "cliente existente"), código, valor, prévia **sem comissão** e avisos (limite de usos atingido, venda pendente do cliente) (depende de T14)
- [ ] T20. Mensagem pronta com botão **Copiar** (texto cru com `*` e `~`) (depende de T19)
- [ ] T21. Detalhe do indicador: códigos com contagem de usos e aviso de limite, vendas pendentes e confirmadas com **Confirmar recebimento**, pagamentos e **Registrar pagamento** (depende de T15, T16)
- [ ] T22. Lista de vendas com filtro por indicador, período e status, e **Confirmar recebimento** nas pendentes (depende de T15)

## Fase 5 — Fechamento
- [ ] T23. Passada manual no celular por todos os cenários da seção 11 da spec
- [ ] T24. Deploy (HTTPS, variáveis de produção) e 3 vendas reais com a Shirley
- [ ] T25. Atualizar o README e registrar no `spec.md` qualquer regra que mudou durante o uso