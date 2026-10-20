# Spec 000 — Empresas e módulos (base do Kero System)

> Status: **aprovada para implementação** (criada e decidida em 2026-10-20). Qualquer mudança de regra deve ser feita aqui **antes** do código.

## 1. Contexto

O **Kero System** é um app web para **pequenos negócios** (lanchonetes, salgaderias, lojas de bairro etc.). Cada negócio cria a **conta da sua empresa** e usa os **módulos** do sistema. O primeiro módulo é o de **Indicação** (`001-indicacao`); o cartão fidelidade (`002-fidelidade`) vem depois.

O app nasceu para um único negócio e agora passa a atender **qualquer empresa**. Nenhum nome de empresa cliente aparece no produto: a marca é sempre **Kero System**, e o nome de cada empresa vem do cadastro dela.

## 2. Problema

Hoje o sistema pressupõe um único negócio e um único usuário, criado à mão. Para outras empresas usarem, é preciso:

- que cada empresa crie a própria conta, sem depender de alguém criar o usuário à mão;
- que os dados de uma empresa **nunca** apareçam para outra;
- saber quais módulos cada empresa usa.

## 3. Usuário e acesso

- **Usuário**: a pessoa responsável pela empresa (dono ou dona), operando pelo celular, com e-mail e senha (**Supabase Auth**).
- **Um usuário por empresa no MVP.** Quem cria a conta é o responsável por ela. Convidar funcionários ou ter vários usuários por empresa fica para depois (seção 5).
- Indicadores e clientes continuam **sem acesso** ao sistema.

## 4. Objetivo do MVP e critérios de sucesso

- Uma empresa nova cria a conta sozinha, pelo celular, em **menos de 2 minutos**, e já cai na tela inicial do módulo de Indicação.
- Nenhum dado de uma empresa aparece para outra, em nenhuma tela ou consulta.

## 5. Escopo

### Dentro do MVP
- Cadastro público de empresa (nome da empresa + e-mail + senha), que cria a empresa e o usuário responsável juntos.
- Login e sessão (detalhes da tela na spec 001, seção 10.1).
- Isolamento total dos dados por empresa.
- Catálogo fixo de módulos, com o módulo **Indicação** ativado automaticamente para toda empresa nova.
- Nome da empresa exibido no cabeçalho do app.
- Marca do produto: **Kero System** (nome e logo próprios; cores atuais do `001-indicacao/DESIGN.md`).

### Fora do MVP (não implementar)
- Vários usuários por empresa, convites e permissões.
- Um usuário em mais de uma empresa (troca de empresa).
- Tela para ativar ou desativar módulos (decidido em 2026-10-20).
- Editar os dados da empresa (nome etc.) (decidido em 2026-10-20; se precisar, corrigir pelo painel do Supabase).
- "Esqueci a senha" (decidido em 2026-10-20).
- Logo e cores personalizados por empresa.
- Planos, cobrança e assinatura.
- Painel administrativo do Kero System (ver todas as empresas).

## 6. Glossário

- **Kero System**: o produto (o app).
- **Empresa**: o negócio que usa o Kero System; dona de todos os seus dados.
- **Responsável**: o usuário que criou a conta da empresa.
- **Módulo**: uma funcionalidade do sistema que a empresa usa (Indicação, Fidelidade…).

## 7. Regras de negócio

**RE1 — Cadastro da empresa.** Criar a conta pede **nome da empresa**, **e-mail** e **senha**. A empresa e o usuário responsável são criados juntos: ou os dois são criados, ou nenhum. O nome da empresa é obrigatório (sem espaços sobrando nas pontas, até 60 caracteres). O e-mail é único no sistema. A senha tem pelo menos **8 caracteres**.

**RE2 — Confirmação de e-mail.** **Não exigida** no MVP (decidido em 2026-10-20): a pessoa entra direto depois de criar a conta.

**RE3 — Isolamento.** Todo dado de módulo (indicadores, clientes, códigos, vendas e o que vier depois) pertence a **uma empresa**. O usuário só lê e grava dados da própria empresa. A empresa é sempre descoberta **pela sessão no servidor**, nunca por um valor vindo do navegador. Isso é garantido no banco (RLS), não só nas telas.

**RE4 — Unicidade dentro da empresa.** Regras de "único" dos módulos valem **dentro de cada empresa**: duas empresas podem ter o mesmo código (`camila5`) ou o mesmo telefone de cliente ou de indicador, sem conflito.

**RE5 — Módulos.** O sistema tem um catálogo fixo de módulos: `indicacao` (disponível) e `fidelidade` (futuro, não aparece). Toda empresa nova nasce com `indicacao` **ativo**. O app só mostra telas e destinos de navegação dos módulos ativos da empresa; abrir a rota de um módulo inativo leva à tela inicial.

**RE6 — Nome no app.** O cabeçalho mostra o nome da empresa logada. O nome do produto (**Kero System**) aparece no login, no cadastro e no título da aba do navegador.

## 8. Fluxo principal

**Criar conta**
1. Na tela **Entrar**, a pessoa toca em **Criar conta da empresa**.
2. Preenche nome da empresa, e-mail e senha e toca em **Criar conta**.
3. O sistema cria a empresa, o usuário responsável e ativa o módulo Indicação (RE1, RE5), abre a sessão e leva para **Nova venda**.

## 9. Telas do MVP

Regras comuns: as mesmas da spec 001, seção 10 (estados, erros embaixo do campo, nada mostrado como salvo antes de o servidor confirmar) e o `001-indicacao/DESIGN.md`.

### 9.1 Criar conta da empresa

- **Objetivo:** cadastrar a empresa e o responsável.
- **Mostra:** logo do Kero System e título "Criar conta da empresa".
- **Campos:** Nome da empresa (ex.: Lanchonete da Maria); E-mail; Senha (com botão **Mostrar senha**, e a dica "Pelo menos 8 letras ou números").
- **Ação:** **Criar conta**. Enquanto grava, mostra "Criando conta…" e não aceita um segundo toque.
- **Link:** "Já tenho conta. Entrar" (volta para o login).
- **Erros:** nome vazio: "Digite o nome da empresa."; e-mail inválido: "Digite um e-mail válido. Ex.: maria@gmail.com"; e-mail já usado: "Este e-mail já tem conta. Toque em Entrar."; senha curta: "A senha precisa ter pelo menos 8 letras ou números."
- **Regras:** quem já tem sessão e abre esta tela vai para **Nova venda**.

### 9.2 Ajustes no login (spec 001, seção 10.1)

- Logo do **Kero System** (não de uma empresa).
- Abaixo do botão **Entrar**, o link **Criar conta da empresa**.

## 10. Critérios de aceite

| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Criar conta | "Lanchonete da Maria", e-mail novo, senha de 8+ caracteres | empresa e usuário criados; módulo Indicação ativo; sessão aberta em Nova venda |
| E-mail repetido | e-mail que já tem conta | recusado: "Este e-mail já tem conta. Toque em Entrar." |
| Nome vazio | nome só com espaços | recusado: "Digite o nome da empresa." |
| Senha curta | 7 caracteres | recusado com mensagem clara |
| Falha no meio do cadastro | erro ao criar a empresa | nenhum usuário fica criado sem empresa |
| Isolamento na leitura | empresa A logada | nunca vê indicadores, clientes, códigos ou vendas da empresa B |
| Isolamento na gravação | empresa A tenta gravar com `empresa_id` da B | recusado pelo banco |
| Mesmo código em empresas diferentes | A e B criam `camila5` | as duas conseguem |
| Mesmo telefone em empresas diferentes | João é cliente de A e de B | dois clientes independentes, cada um na sua empresa |
| Cabeçalho | empresa "Lanchonete da Maria" logada | cabeçalho mostra "Lanchonete da Maria" |
| Marca única | abrir login, cadastro e título da aba | só aparece "Kero System"; nenhum nome de empresa cliente fixo no código |

## 11. Pontos em aberto

- ~~RE2: confirmação de e-mail~~ — decidido: não exigir no MVP.
- ~~Tela para ativar/desativar módulos~~ — decidido: fora do MVP.
- ~~Editar o nome da empresa~~ — decidido: fora do MVP; corrigir pelo painel do Supabase se preciso.
- ~~"Esqueci a senha"~~ — decidido: fora do MVP; é o primeiro candidato depois dele.
- ~~Cores do Kero System~~ — decidido: manter a paleta atual do `DESIGN.md`.
