import type { Modulo } from "@/lib/dados/tipos";

/** Catálogo fixo (spec 000, RE5). Por enquanto toda empresa nasce com todos ativos. */
export const MODULOS: readonly Modulo[] = ["indicacao", "fidelidade"];

/** O único lugar que decide se um módulo vale para a empresa (telas, campos e actions). */
export function moduloAtivo(empresa: { modulosAtivos: readonly Modulo[] }, modulo: Modulo): boolean {
  return empresa.modulosAtivos.includes(modulo);
}

/** RE7: vendas e clientes existem com qualquer módulo ativo. */
export function temAlgumModulo(empresa: { modulosAtivos: readonly Modulo[] }): boolean {
  return MODULOS.some((m) => moduloAtivo(empresa, m));
}
