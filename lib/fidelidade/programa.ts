import { lerReais } from "@/lib/formato/leitura";
import type { Centavos } from "@/lib/indicacao/tipos";

export const META_MINIMA = 2;
export const META_MAXIMA = 50;
export const PREMIO_MAXIMO = 60;
export const DIAS_LIBERACAO_MAXIMO = 90;
/** Sugestões que a tela já traz preenchidas (spec 10.4). */
export const META_SUGERIDA = 10;
export const DIAS_LIBERACAO_PADRAO = 7;

export type CamposPrograma = "meta" | "premio" | "valorMinimo" | "diasLiberacao";

/** O que a pessoa digitou na spec 10.4, sem nada convertido. */
export type EntradaPrograma = Record<CamposPrograma, string>;

export type ValoresPrograma = {
  meta: number;
  premio: string;
  valorMinimo: Centavos | null;
  diasLiberacao: number;
};

export type ResultadoPrograma =
  | { ok: true; programa: ValoresPrograma }
  | { ok: false; erros: Partial<Record<CamposPrograma, string>> };

/** Inteiro digitado sem sinal nem casas ("10", " 7 "); `null` se não for. */
function lerInteiro(texto: string): number | null {
  const t = texto.trim();
  return /^\d{1,4}$/.test(t) ? Number(t) : null;
}

/** RF1 e mensagens da spec 10.4. */
export function validarPrograma(entrada: EntradaPrograma): ResultadoPrograma {
  const erros: Partial<Record<CamposPrograma, string>> = {};

  const meta = lerInteiro(entrada.meta);
  if (meta === null || meta < META_MINIMA || meta > META_MAXIMA) {
    erros.meta = `O cartão precisa ter de ${META_MINIMA} a ${META_MAXIMA} carimbos.`;
  }

  const premio = entrada.premio.trim();
  if (premio === "") erros.premio = "Digite o prêmio. Ex.: 1 salgado grátis.";
  else if (premio.length > PREMIO_MAXIMO) erros.premio = `O prêmio pode ter até ${PREMIO_MAXIMO} letras.`;

  let valorMinimo: Centavos | null = null;
  if (entrada.valorMinimo.trim() !== "") {
    const valor = lerReais(entrada.valorMinimo);
    if (valor.ok) valorMinimo = valor.centavos;
    else erros.valorMinimo = "Digite um valor. Ex.: 15 ou 15,50.";
  }

  const dias = lerInteiro(entrada.diasLiberacao);
  if (dias === null || dias > DIAS_LIBERACAO_MAXIMO) {
    erros.diasLiberacao = `O prazo precisa ser de 0 a ${DIAS_LIBERACAO_MAXIMO} dias.`;
  }

  if (Object.keys(erros).length > 0 || meta === null || dias === null) return { ok: false, erros };
  return { ok: true, programa: { meta, premio, valorMinimo, diasLiberacao: dias } };
}
