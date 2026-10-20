import { recusa, type Recusa } from "@/lib/casos-de-uso/resultado";
import type { Programa, RepositorioFidelidade } from "@/lib/dados/tipos";
import { validarPrograma, type CamposPrograma, type EntradaPrograma } from "@/lib/fidelidade/programa";

/** Spec 10.4: cria ou ajusta o programa da empresa (RF1, RF2); vale daqui para frente. */
export async function salvarPrograma(
  repo: RepositorioFidelidade,
  entrada: EntradaPrograma,
  agora: Date,
): Promise<{ ok: true; programa: Programa; criado: boolean } | Recusa<CamposPrograma>> {
  const validacao = validarPrograma(entrada);
  if (!validacao.ok) return recusa(validacao.erros);
  const criado = (await repo.programa()) === null;
  return { ok: true, programa: await repo.salvarPrograma(validacao.programa, agora), criado };
}
