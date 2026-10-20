# Tarefas — 001 Indicação

Ordem sugerida; cada tarefa deve ser pequena e entregável sozinha. Marque `[x]` ao concluir.

## Fundação
- [ ] T1. Criar projeto Supabase e configurar variáveis de ambiente (`.env.local`, nunca commitar)
- [ ] T2. Migration das tabelas `indicadores`, `clientes`, `codigos`, `vendas`, `pagamentos_indicador` (ver `plan.md`)
- [ ] T3. RLS: acesso restrito ao usuário autenticado da dona
- [ ] T4. Login (e-mail + senha) e proteção das rotas

## Regras de negócio (módulo puro + testes)
- [ ] T5. `normalizarCodigo` e `calcularVenda` (RN1, RN6) com testes
- [ ] T6. `validarCodigo` (RN2–RN5) com testes de todos os cenários da seção 11 da spec
- [ ] T7. `gerarMensagem` (seção 8) com teste do exemplo João/camila5
- [ ] T8. `calcularSaldo` (RN8) com testes

## Telas
- [ ] T9. Indicadores: lista com saldo + cadastro
- [ ] T10. Criar código (desconto, comissão, tipo, validade)
- [ ] T11. Nova venda: cliente, código, valor, prévia e confirmação
- [ ] T12. Mensagem pronta com botão **Copiar** (texto cru com `*` e `~`)
- [ ] T13. Detalhe do indicador: códigos, vendas, pagamentos
- [ ] T14. Registrar pagamento (dinheiro / crédito em produtos), bloqueando valor acima do saldo
- [ ] T15. Lista de vendas com filtro por indicador e período

## Fechamento
- [ ] T16. Revisão mobile (uso real no celular da Shirley)
- [ ] T17. Deploy e teste com 3 vendas reais
- [ ] T18. Atualizar README e fechar os pontos em aberto da spec
