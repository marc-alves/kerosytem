import { connection } from "next/server";
import { criarRepositorioEmMemoria } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A } from "@/lib/dados/semente";
import type { Banco, Empresa, RepositorioIndicacao } from "@/lib/dados/tipos";

// Provisório (até a T43): sem login, a sessão é sempre da primeira empresa da semente.
// O banco fica no `globalThis` para sobreviver ao recarregamento do `npm run dev`;
// reiniciar o servidor volta à semente.
const global = globalThis as typeof globalThis & { __bancoKero?: Banco };

function banco(): Banco {
  global.__bancoKero ??= criarSemente(new Date());
  return global.__bancoKero;
}

/** Empresa da sessão (nome no cabeçalho, módulos ativos). */
export async function empresaDaSessao(): Promise<Empresa> {
  // Os dados mudam a cada requisição: nada disso entra no pré-render.
  await connection();
  return banco().empresas.find((e) => e.id === EMPRESA_A)!;
}

/** Dados do módulo de Indicação, presos à empresa da sessão (RE3). */
export async function repositorio(): Promise<RepositorioIndicacao> {
  const empresa = await empresaDaSessao();
  return criarRepositorioEmMemoria(banco(), empresa.id);
}
