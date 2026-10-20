import type { ProgramaFidelidade } from "@/lib/fidelidade/tipos";
import { dataEmBrasilia, diasDepois, inicioDoDiaEmBrasilia } from "@/lib/indicacao/periodo";
import type { Centavos, StatusVenda } from "@/lib/indicacao/tipos";

/**
 * RF3: venda confirmada, lançada a partir da criação do programa e com valor final
 * igual ou maior que o valor mínimo em vigor agora. Com ou sem código.
 */
export function ganhaCarimbo(entrada: {
  venda: { status: StatusVenda; criadoEm: Date; valorFinal: Centavos };
  programa: Pick<ProgramaFidelidade, "criadoEm" | "valorMinimo">;
}): boolean {
  const { venda, programa } = entrada;
  if (venda.status !== "confirmada") return false;
  if (venda.criadoEm.getTime() < programa.criadoEm.getTime()) return false;
  return programa.valorMinimo === null || venda.valorFinal >= programa.valorMinimo;
}

/**
 * RF4: com prazo 0, libera na hora da confirmação; senão, às 00h00 de Brasília do dia
 * da confirmação + prazo. Calculado uma vez, na confirmação.
 */
export function dataLiberacao(entrada: { confirmadaEm: Date; diasLiberacao: number }): Date {
  const { confirmadaEm, diasLiberacao } = entrada;
  if (diasLiberacao === 0) return confirmadaEm;
  return inicioDoDiaEmBrasilia(diasDepois(dataEmBrasilia(confirmadaEm), diasLiberacao));
}
