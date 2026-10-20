# Tarefas — 000 Empresas e módulos

Tarefas com prefixo **E** para não confundir com as `T` da `001-indicacao`. As tarefas de banco e telas da 001 que dependem destas citam "depende de Ex". A definição de pronto é a mesma da `001-indicacao/tasks.md`.

## Fase 0 — Trocar a marca para Kero System (pode começar já)
- [x] E1. Tirar "Kero Salgados" do código: `app/layout.tsx` (título "Kero System" e descrição "Indicações, vendas e clientes do seu negócio") e `components/cabecalho.tsx` (provisoriamente "Kero System"; o nome da empresa entra na E9). Verificação: `grep -rni "kero salgados" app components lib` sem resultado; testes e lint passando
- [x] E2. Revisar textos de interface e testes atrás de nomes da empresa antiga ou da "dona" (ex.: textos fixos, exemplos, seed planejado) e trocar por exemplos genéricos ("Lanchonete da Maria"); `grep -rni "kero salgados\|shirley" app components lib` sem resultado (depende de E1)
- [ ] E3. Logo e ícone do **Kero System**: arquivo oficial em `public/` e `app/favicon.ico` trocado (você fornece o arquivo; não recriar). Substitui a T28 da 001 (depende de E1)

## Fase 1 — Regras puras
- [ ] E4. `lib/empresas/`: `validarNomeEmpresa`, `validarEmail` e `validarSenha`, com testes e as mensagens da spec 9.1 (RE1)

## Fase 2 — Banco
- [ ] E5. Migration: `empresas`, `empresa_usuarios` (`user_id` único), `empresa_modulos`; função `empresa_atual()`; RLS dessas tabelas (só leitura da própria empresa) (depende de T9)
- [ ] E6. RPC `criar_empresa(nome)`: em transação, cria empresa, vínculo do usuário como `responsavel` e módulo `indicacao` ativo; recusa usuário que já tem empresa (RE1, RE5) (depende de E5)
- [ ] E7. Teste de integração com duas empresas: isolamento de leitura e gravação, mesmo código e mesmo telefone em empresas diferentes (spec seção 10). Roda de novo depois da T11/T12 da 001 (depende de E5, T11, T12)

## Fase 3 — Cadastro e sessão
- [ ] E8. Ligar o cadastro público no Supabase Auth e **desligar a confirmação de e-mail** (RE2) (feito por você no painel)
- [ ] E9. `lib/dados/empresa.ts` (empresa da sessão: nome e módulos ativos) e uso no layout de `app/(app)/`: nome da empresa no cabeçalho (RE6) e navegação só com destinos de módulos ativos (RE5); usuário sem empresa vai para tela de erro com "Tentar de novo" (depende de E5, T31)
- [ ] E10. Action `criarConta` (valida com E4, cria usuário, chama `criar_empresa`, desfaz o usuário se falhar) (depende de E4, E6, E8)
- [ ] E11. Tela **Criar conta da empresa** em `/cadastro` (**spec 9.1**): três campos, "Mostrar senha", erros da spec, sem toque duplo; com sessão, vai para `/vendas/nova`; checklist do `DESIGN.md` (depende de E10, T30)
- [ ] E12. Link **Criar conta da empresa** na tela de login e logo do Kero System (**spec 9.2**); `/cadastro` liberado no `proxy.ts` sem sessão (depende de T10, E3, E11)

## Fase 4 — Fechamento
- [ ] E13. Passada manual: criar duas contas pelo celular, cadastrar dados em cada uma e conferir que uma não vê a outra; atualizar a `spec.md` com o que mudou (depende de E7, E12)
