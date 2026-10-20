import type { Centavos, PontosBase } from "@/lib/indicacao/tipos";

function exigirInteiro(nome: string, valor: number) {
  if (!Number.isSafeInteger(valor)) {
    throw new RangeError(`${nome} inválido: ${valor}`);
  }
}

/** Separa milhares com ponto: 1234567 → "1.234.567". */
function agruparMilhares(inteiro: number): string {
  return String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * `R$ 1.234,56`, com espaço comum entre `R$` e o número (seção 8 da spec).
 * Feito à mão porque o `Intl` do pt-BR usa espaço não separável.
 */
export function formatarReais(centavos: Centavos): string {
  exigirInteiro("centavos", centavos);
  const sinal = centavos < 0 ? "-" : "";
  const absoluto = Math.abs(centavos);
  const reais = Math.floor(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, "0");
  return `${sinal}R$ ${agruparMilhares(reais)},${resto}`;
}

/** Percentual em centésimos de ponto: 500 → "5%", 750 → "7,5%", 1225 → "12,25%". */
export function formatarPercentual(bp: PontosBase): string {
  exigirInteiro("bp", bp);
  const sinal = bp < 0 ? "-" : "";
  const absoluto = Math.abs(bp);
  const inteiro = Math.floor(absoluto / 100);
  const decimais = String(absoluto % 100).padStart(2, "0").replace(/0+$/, "");
  return `${sinal}${agruparMilhares(inteiro)}${decimais ? `,${decimais}` : ""}%`;
}
