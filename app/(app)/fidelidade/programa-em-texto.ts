import type { Programa } from "@/lib/dados/tipos";
import type { EntradaPrograma } from "@/lib/fidelidade/programa";
import { formatarReais } from "@/lib/formato/numero";

/** O programa gravado como a pessoa digitaria, para abrir o formulário de ajuste preenchido. */
export function programaEmTexto(p: Programa): EntradaPrograma {
  return {
    meta: String(p.meta),
    premio: p.premio,
    valorMinimo: p.valorMinimo === null ? "" : formatarReais(p.valorMinimo),
    diasLiberacao: String(p.diasLiberacao),
  };
}
