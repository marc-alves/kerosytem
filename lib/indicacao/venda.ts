import type { CalculoVenda, Centavos, PontosBase } from "@/lib/indicacao/tipos";

const CEM_POR_CENTO: PontosBase = 10000;
// Garante que `centavos × bp` continue inteiro exato no JavaScript.
const VALOR_MAXIMO: Centavos = Math.floor(Number.MAX_SAFE_INTEGER / CEM_POR_CENTO);

/** `centavos × bp / 10000`, arredondado metade para cima, só com inteiros. */
function aplicarPercentual(centavos: Centavos, bp: PontosBase): Centavos {
  return Math.floor((centavos * bp + CEM_POR_CENTO / 2) / CEM_POR_CENTO);
}

function exigirInteiro(nome: string, valor: number, maximo: number) {
  if (!Number.isInteger(valor) || valor < 0 || valor > maximo) {
    throw new RangeError(`${nome} inválido: ${valor}`);
  }
}

/**
 * RN8: desconto sobre o valor original; comissão sobre o valor final (o que o cliente paga).
 * Venda sem código (RN9) usa 0 nos dois percentuais.
 */
export function calcularVenda(entrada: {
  valorOriginal: Centavos;
  descontoBp: PontosBase;
  comissaoBp: PontosBase;
}): CalculoVenda {
  const { valorOriginal, descontoBp, comissaoBp } = entrada;
  exigirInteiro("valorOriginal", valorOriginal, VALOR_MAXIMO);
  exigirInteiro("descontoBp", descontoBp, CEM_POR_CENTO);
  exigirInteiro("comissaoBp", comissaoBp, CEM_POR_CENTO);

  const valorDesconto = aplicarPercentual(valorOriginal, descontoBp);
  const valorFinal = valorOriginal - valorDesconto;
  const comissao = aplicarPercentual(valorFinal, comissaoBp);

  return { valorOriginal, descontoBp, valorDesconto, valorFinal, comissaoBp, comissao };
}
