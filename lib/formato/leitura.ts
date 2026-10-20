import type { Centavos, Falha, PontosBase } from "@/lib/indicacao/tipos";
import { VALOR_MAXIMO } from "@/lib/indicacao/venda";

export type ResultadoReais = { ok: true; centavos: Centavos } | Falha<"valor_invalido">;
export type ResultadoPercentual = { ok: true; bp: PontosBase } | Falha<"desconto_invalido">;

/**
 * Número digitado em formato brasileiro com até 2 casas, em centésimos inteiros:
 * "110" → 11000, "110,5" → 11050, "1.234,56" → 123456.
 * Sem vírgula, um ponto seguido de 1 ou 2 dígitos é decimal ("110.50", teclado sem vírgula);
 * seguido de 3 dígitos é milhar ("1.234"). Devolve `null` se não for um número assim.
 */
function lerCentesimos(texto: string): number | null {
  let t = texto.replace(/\s|R\$/g, "");
  if (!t.includes(",") && /^\d+\.\d{1,2}$/.test(t)) t = t.replace(".", ",");
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const inteiro = Number(m[1].replace(/\./g, ""));
  const decimais = Number((m[2] ?? "").padEnd(2, "0"));
  const valor = inteiro * 100 + decimais;
  return Number.isSafeInteger(valor) ? valor : null;
}

/** Valor da compra (spec 10.5): maior que zero, até 2 casas. */
export function lerReais(texto: string): ResultadoReais {
  const centavos = lerCentesimos(texto);
  if (centavos === null || centavos <= 0 || centavos > VALOR_MAXIMO) {
    return {
      ok: false,
      motivo: "valor_invalido",
      mensagem: "Digite o valor da compra. Ex.: 110 ou 110,50.",
    };
  }
  return { ok: true, centavos };
}

/** Desconto do código (spec 10.4, RN1): de 0% a 100%, até 2 casas. "5" → 500, "7,5" → 750. */
export function lerPercentual(texto: string): ResultadoPercentual {
  const bp = lerCentesimos(texto.replace(/%/g, ""));
  if (bp === null || bp > 10000) {
    return {
      ok: false,
      motivo: "desconto_invalido",
      mensagem: "O desconto precisa ser de 0% a 100%.",
    };
  }
  return { ok: true, bp };
}
