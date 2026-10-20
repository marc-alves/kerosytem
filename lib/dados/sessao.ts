import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import type { FidelidadeNaVenda } from "@/lib/casos-de-uso/vendas";
import { gerarChaveCartao } from "@/lib/dados/chave";
import { criarRepositorioEmMemoria, criarRepositorioFidelidadeEmMemoria, lerCartaoPublico } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, VERSAO_SEMENTE } from "@/lib/dados/semente";
import type {
  Banco,
  CartaoPublicoDados,
  Empresa,
  Modulo,
  RepositorioFidelidade,
  RepositorioIndicacao,
} from "@/lib/dados/tipos";
import { enderecoDoSite, linkDoCartao } from "@/lib/fidelidade/link";
import { moduloAtivo } from "@/lib/empresas/modulos";

// Provisório (até a T43): sem login, a sessão é sempre da primeira empresa da semente.
// O banco fica no `globalThis` para sobreviver ao recarregamento do `npm run dev`;
// reiniciar o servidor volta à semente.
// `VERSAO_SEMENTE` muda quando a semente ou o formato das linhas muda: o banco antigo é trocado.
const global = globalThis as typeof globalThis & { __bancoKero?: Banco; __bancoKeroVersao?: number };

function banco(): Banco {
  if (!global.__bancoKero || global.__bancoKeroVersao !== VERSAO_SEMENTE) reiniciarBancoMock();
  return global.__bancoKero!;
}

/** Volta os dados à semente (só para a página /teste). */
export function reiniciarBancoMock() {
  global.__bancoKero = criarSemente(new Date());
  global.__bancoKeroVersao = VERSAO_SEMENTE;
}

/** Liga ou desliga um módulo da empresa da sessão (só para a página /teste; no Supabase é pelo painel). */
export function alternarModuloMock(modulo: Modulo) {
  const empresa = banco().empresas.find((e) => e.id === EMPRESA_A)!;
  empresa.modulosAtivos = empresa.modulosAtivos.includes(modulo)
    ? empresa.modulosAtivos.filter((m) => m !== modulo)
    : [...empresa.modulosAtivos, modulo];
}

/** Empresa da sessão (nome no cabeçalho, módulos ativos). */
export async function empresaDaSessao(): Promise<Empresa> {
  // Os dados mudam a cada requisição: nada disso entra no pré-render.
  await connection();
  return banco().empresas.find((e) => e.id === EMPRESA_A)!;
}

/** Rotas de um módulo desligado na empresa levam à tela inicial (spec 000, RE5). */
export async function exigirModulo(modulo: Modulo): Promise<Empresa> {
  const empresa = await empresaDaSessao();
  if (!moduloAtivo(empresa, modulo)) redirect("/");
  return empresa;
}

/** Dados do módulo de Indicação, presos à empresa da sessão (RE3). */
export async function repositorio(): Promise<RepositorioIndicacao> {
  const empresa = await empresaDaSessao();
  return criarRepositorioEmMemoria(banco(), empresa.id);
}

/** Dados da fidelidade, presos à empresa da sessão (RE3). */
export async function repositorioFidelidade(): Promise<RepositorioFidelidade> {
  const empresa = await empresaDaSessao();
  return criarRepositorioFidelidadeEmMemoria(banco(), empresa.id);
}

/** Monta o endereço completo do cartão a partir da chave (RF8). */
export async function montarLinkDoCartao(): Promise<(chave: string) => string> {
  const h = await headers();
  const endereco = enderecoDoSite({
    appUrl: process.env.APP_URL,
    host: h.get("x-forwarded-host") ?? h.get("host"),
    protocolo: h.get("x-forwarded-proto"),
  });
  return (chave) => linkDoCartao(endereco, chave);
}

/** O que a confirmação de venda precisa para dar o carimbo; `null` com a fidelidade desligada. */
export async function fidelidadeNaVenda(): Promise<FidelidadeNaVenda | null> {
  const empresa = await empresaDaSessao();
  if (!moduloAtivo(empresa, "fidelidade")) return null;
  return {
    repo: await repositorioFidelidade(),
    empresaNome: empresa.nome,
    link: await montarLinkDoCartao(),
    gerarChave: gerarChaveCartao,
  };
}

/** Página do cliente, sem sessão: só o que a RF9 deixa (faz o papel da RPC `cartao_publico`). */
export async function cartaoPublico(chave: string): Promise<CartaoPublicoDados | null> {
  await connection();
  return lerCartaoPublico(banco(), chave);
}
