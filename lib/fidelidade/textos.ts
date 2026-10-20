import { formatarReais } from "@/lib/formato/numero";
import type { Centavos } from "@/lib/indicacao/tipos";

/** Spec 10.1: "10 carimbos = 1 salgado grátis". */
export function resumoPrograma(p: { meta: number; premio: string }): string {
  return `${p.meta} carimbos = ${p.premio}`;
}

/** Na tela, "R$" e o número nunca em linhas diferentes (a mensagem do WhatsApp usa espaço comum). */
const reaisNaTela = (centavos: Centavos) => formatarReais(centavos).replace(" ", "\u00a0");

/** Spec 11.1: a regra do cartão em uma frase. */
export function fraseRegra(valorMinimo: Centavos | null): string {
  return valorMinimo === null
    ? "A cada compra ganhe 1 carimbo."
    : `A cada compra a partir de ${reaisNaTela(valorMinimo)} ganhe 1 carimbo.`;
}

/** Spec 10.1: o prazo de liberação (RF4). */
export function frasePrazo(dias: number): string {
  if (dias === 0) return "Carimbo liberado na hora";
  return `Carimbo liberado ${dias} ${dias === 1 ? "dia" : "dias"} depois do pagamento`;
}
