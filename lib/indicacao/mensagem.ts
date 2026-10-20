import { formatarPercentual, formatarReais } from "@/lib/formato/numero";
import type { Centavos, PontosBase } from "@/lib/indicacao/tipos";

/**
 * Seção 8: mensagem para colar no WhatsApp (`*negrito*`, `~riscado~`).
 * Só existe para venda com código (RN9).
 */
export function gerarMensagem(entrada: {
  nome: string;
  descontoBp: PontosBase;
  codigo: string;
  valorOriginal: Centavos;
  valorFinal: Centavos;
}): string {
  const { nome, descontoBp, codigo, valorOriginal, valorFinal } = entrada;
  return (
    `*${nome.trim()}*, você ganhou ${formatarPercentual(descontoBp)} de desconto com o código ${codigo}!\n` +
    `~${formatarReais(valorOriginal)}~ por *${formatarReais(valorFinal)}*`
  );
}
