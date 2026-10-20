import { redirect } from "next/navigation";
import { connection } from "next/server";
import { criarRepositorioEmMemoria } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, VERSAO_SEMENTE } from "@/lib/dados/semente";
import type { Banco, Empresa, Modulo, RepositorioIndicacao } from "@/lib/dados/tipos";
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
