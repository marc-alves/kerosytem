# Tarefas — 002 Fidelidade

Ordem sugerida. Prefixo **F** para não confundir com as `E` da 000 e as `T` da 001. As referências RF e seções apontam para `spec.md`; "checklist" é a seção 13 do `specs/design/DESIGN.md`. A definição de pronto é a mesma da `001-indicacao/tasks.md` (testes e lint passando, critério da spec atendido, `[x]` marcado, um commit por tarefa; telas conferidas em ~360px e com a fonte aumentada).

## Fase 0 — Fechar a spec
- [x] F0. Decidir os pontos em aberto da spec, registrar as decisões (seção 13) e aprovar a spec
- [x] F1. Atualizar junto: spec 000 (seção 3, RE5, RE7 nova, seção 5), spec 001 (base comum, RN12, seções 5, 10 e 10.8) e `AGENTS.md` (depende de F0)

## Fase 1 — Regras puras (`lib/fidelidade/`)
- [x] F2. `validarPrograma` (RF1, spec 10.4): meta de 2 a 50, prêmio obrigatório até 60 caracteres sem espaços nas pontas, valor mínimo opcional com `lerReais`, prazo de 0 a 90 dias (padrão 7); mensagens da spec
- [x] F3. `ganhaCarimbo` (RF3) e `dataLiberacao` (RF4): só venda confirmada, lançada depois da criação do programa, com valor final ≥ valor mínimo; com e sem código; liberação às 00h00 de Brasília do dia da confirmação + prazo, ou na hora com prazo 0 (inclusive confirmação às 23h30 de Brasília)
- [x] F4. `estadoCartao` (RF4, RF6): carimbos no cartão, liberados, a liberar, exibido (0 à meta), completo, sobra, faltam, pode resgatar e data do prêmio liberado; casos da seção 12 (9→10 de 10, completo a liberar, 12 de 10 com 9 liberados, meta ajustada de 10 para 8) (depende de F3)
- [x] F5. `escolherCarimbosDoResgate` (os liberados mais antigos), `podeDesfazerResgate` e `podeCancelarPorFidelidade` (RF5, RF6, RF7), com as mensagens da spec 10.2 e 10.3 (depende de F4)
- [x] F6. `primeiroNome` e as quatro mensagens da seção 8, mais `escolherMensagem`; exemplo da seção 8 exatamente igual (depende de F4)
- [x] F7. `ordenarCartoes` (spec 10.1) e `historicoPublico` (spec 11.1: sem retirados, sem desfeitos, sem valores) (depende de F4)

## Fase 2 — Módulos independentes (base, spec 000 RE5 e RE7)
- [x] F8. Todos os módulos ativos na semente e `moduloAtivo(empresa, modulo)` num só lugar; navegação montada pelos módulos ativos (Nova venda e Vendas com qualquer módulo, Indicadores com `indicacao`, Fidelidade com `fidelidade`), com testes das combinações e frase "Nenhum módulo ativo. Fale com o Kero System." sem módulos (depende de E9, ou faz a parte de módulos dela sobre a sessão mockada)
- [x] F9. Telas de venda sem Indicação: Nova venda sem o campo Código (e `previaVenda`/`lancarVenda` recusam código), Lista de vendas sem o filtro Indicador, cartões sem código; rotas `/indicadores/*` vão para `/` (depende de F8)

## Fase 3 — Casos de uso sobre o banco em memória
- [x] F10. Tipos e banco em memória: `ProgramaFidelidade`, `Carimbo` (com `liberadoEm`, `resgateId`, `retiradoEm`), `Resgate`, `CartaoFidelidade` no `Banco`; interface `RepositorioFidelidade` em `lib/dados/tipos.ts` e implementação em `lib/dados/memoria.ts`; chave do link com 32 bytes aleatórios em base64url; teste de isolamento entre as duas empresas (depende de F8)
- [x] F11. Semente da fidelidade: programa na primeira empresa (10 carimbos, "1 salgado grátis", 7 dias) com clientes no meio, completo a liberar, completo liberado e com resgate; segunda empresa sem programa (depende de F10)
- [x] F12. `salvarPrograma` (RF1, RF2) em `lib/casos-de-uso/fidelidade.ts`, com as mensagens da spec 10.4 (depende de F2, F10)
- [x] F13. Carimbo na confirmação: `confirmarRecebimento` dá o carimbo (só com o módulo ativo e o programa criado) na mesma gravação, com `liberadoEm`, e devolve o estado do cartão e a mensagem (RF3, RF4); os testes da 001 continuam passando (depende de F3, F4, F6, F10)
- [x] F14. Cancelamento: `cancelarVenda` retira o carimbo não usado e **recusa** venda com carimbo em resgate não desfeito (RF5), devolvendo o id do cliente para o link da spec 10.3 (depende de F5, F13)
- [x] F15. `registrarResgate` (os liberados mais antigos, recusa sem liberados suficientes), `desfazerResgate` (solta os carimbos) e `gerarNovoLink` (RF6, RF7, RF8) (depende de F5, F10)
- [x] F16. Leituras: programa, lista de cartões com busca por nome ou telefone, cartão do cliente com histórico, `carimbo` na `VendaListada`, e `cartaoPublico(chave)` fora do repositório da empresa, devolvendo só os campos da RF9 ou nada (link inválido, trocado ou módulo desligado) (depende de F7, F10)
- [x] F17. Montar o link completo no servidor com `APP_URL` ou, sem ela, com o host da requisição (depende de F16)

## Fase 4 — Telas da empresa (seguem a spec 10.x citada e o checklist)
- [x] F18. Componente **cartão de carimbos** (M espaços preenchidos até o exibido, liberado e a liberar com ícones diferentes, "N de M" escrito), com teste (depende de F4, T30)
- [x] F19. Configurar / ajustar cartão (**spec 10.4**) em `/fidelidade/ajustar` e no `/fidelidade` sem programa: quatro campos, prévia enquanto digita, diálogo ao ajustar, erros da spec; rotas de `/fidelidade` com módulo desligado vão para `/` (depende de F8, F12, F18)
- [x] F20. Lista de cartões (**spec 10.1**) em `/fidelidade`: resumo do programa (com o prazo) e **Ajustar cartão**, busca na URL, cartões ordenados com selo **Cartão completo** ou **Prêmio liberado em dd/mm**, vazio e busca sem resultado (depende de F16, F18)
- [x] F21. Cartão do cliente (**spec 10.2**) em `/fidelidade/clientes/[id]`: cartão, a liberar com a próxima data, sobra, histórico (liberado / libera em, carimbo retirado, resgate desfeito) (depende de F16, F18)
- [x] F22. **Registrar resgate** (ou o aviso "Prêmio liberado a partir de…") e **Desfazer resgate** no cartão do cliente, com os diálogos e a recusa da spec 10.2; sem toque duplo (depende de F15, F21)
- [x] F23. **Copiar mensagem** (vira "✓ Copiado") e **Gerar novo link** com diálogo, no cartão do cliente (depende de F15, F17, F21)
- [x] F24. Ajustes nas telas de venda (**spec 10.3**): frase de carimbo e **Copiar mensagem do cartão** depois de confirmar recebimento; aviso de carimbo no diálogo de cancelar; recusa de cancelar venda já usada em resgate com o link **Abrir cartão de João** (depende de F13, F14, F16, F21)

## Fase 5 — Tela do cliente
- [x] F25. Página **Meu cartão** em `/cartao/[chave]` (**spec 11.1**), fora do grupo `(app)`: sem login, cabeçalho nem navegação; `/cartao/` liberado no `proxy.ts`; não indexada; sem cache; completo liberado e a liberar; link inválido, trocado ou de módulo desligado com a mesma mensagem; nada de telefone, valor, código ou indicador (RF9); checklist (depende de F16, F18)
- [ ] F26. Cenários da fidelidade na página `/teste` (sem programa, cartão no meio, completo a liberar, completo liberado, com sobra, venda bloqueada por resgate, só Fidelidade sem Indicação, link do cliente) (depende de F19 a F25)

## Fase 6 — Supabase
- [ ] F27. Migration: `fidelidade_programas`, `fidelidade_carimbos` (venda única; `liberado_em`, `resgate_id`, `retirado_em`), `fidelidade_resgates`, `fidelidade_cartoes` (chave única no sistema), view do resumo dos cartões, RLS por empresa; todos os módulos ativos em `criar_empresa` e `fidelidade` ativado nas empresas existentes (depende de T11, T12, E5, E6)
- [ ] F28. RPCs `salvar_programa`, `registrar_resgate` (com `for update`), `desfazer_resgate`, `gerar_novo_link`; e mudança de `confirmar_recebimento` (dá o carimbo) e `cancelar_venda` (recusa venda em resgate, retira o carimbo) na mesma transação (depende de F27)
- [ ] F29. RPC `cartao_publico(chave)` `security definer` com `grant execute` para `anon`, devolvendo só os campos da RF9 (depende de F27)
- [ ] F30. Trocar o banco em memória pelo Supabase na fidelidade e teste de integração com duas empresas e com o papel `anon`: anônimo não lê nenhuma tabela; `cartao_publico` não devolve nada para chave trocada, inventada ou módulo desligado; mesmo cliente em duas empresas tem dois cartões (spec seção 12) (depende de F28, F29, T43)

## Fase 7 — Fechamento
- [ ] F31. Passada manual no celular por todos os cenários da seção 12 da spec, mais o teste com a empresa piloto: criar o cartão, confirmar vendas, mandar o link pelo WhatsApp, o cliente abrir o cartão no celular dele e registrar um resgate depois do prazo; anotar onde travou e corrigir (depende de F30)
- [ ] F32. Registrar na `spec.md` qualquer regra que mudou durante o uso (depende de F31)
