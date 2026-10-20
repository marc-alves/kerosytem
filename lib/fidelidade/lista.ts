import type { CarimboParaCartao, ResgateParaHistorico } from "@/lib/fidelidade/tipos";

/** Spec 10.1: completos primeiro; depois mais carimbos no cartão; empate por nome. */
export function ordenarCartoes<T extends { nome: string; estado: { completo: boolean; noCartao: number } }>(
  lista: readonly T[],
): T[] {
  return [...lista].sort(
    (a, b) =>
      Number(b.estado.completo) - Number(a.estado.completo) ||
      b.estado.noCartao - a.estado.noCartao ||
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
  );
}

export type ItemHistoricoPublico = { tipo: "carimbo" | "resgate"; em: Date };

/**
 * Spec 11.1: carimbos ganhos (mesmo os já usados em prêmio) e prêmios resgatados, mais novos
 * primeiro. Sem valores; carimbos retirados e resgates desfeitos não aparecem (RF9).
 */
export function historicoPublico(
  carimbos: readonly Pick<CarimboParaCartao, "criadoEm" | "retiradoEm">[],
  resgates: readonly Pick<ResgateParaHistorico, "criadoEm" | "desfeitoEm">[],
): ItemHistoricoPublico[] {
  return [
    ...carimbos.filter((c) => c.retiradoEm === null).map((c) => ({ tipo: "carimbo" as const, em: c.criadoEm })),
    ...resgates.filter((r) => r.desfeitoEm === null).map((r) => ({ tipo: "resgate" as const, em: r.criadoEm })),
  ].sort((a, b) => b.em.getTime() - a.em.getTime());
}

/** Busca da spec 10.1: pelo nome (sem acento nem maiúscula) ou pelos dígitos do telefone. */
export function combinaBusca(cliente: { nome: string; telefone: string }, busca: string): boolean {
  const semAcento = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const termo = busca.trim();
  if (termo === "") return true;
  if (semAcento(cliente.nome).includes(semAcento(termo))) return true;
  const digitos = termo.replace(/\D/g, "");
  return digitos.length >= 3 && cliente.telefone.includes(digitos);
}
