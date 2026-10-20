"use server";

import { refresh } from "next/cache";
import * as indicadores from "@/lib/casos-de-uso/indicadores";
import { repositorio } from "@/lib/dados/sessao";

// Server Actions recebem qualquer coisa por POST: só passa adiante texto.
// A empresa vem da sessão (repositorio()), nunca do navegador (RE3).
const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

export async function acaoCadastrarIndicador(entrada: Record<string, unknown>) {
  const resultado = await indicadores.cadastrarIndicador(
    await repositorio(),
    { nome: texto(entrada.nome), telefone: texto(entrada.telefone) },
    new Date(),
  );
  if (resultado.ok) refresh();
  return resultado;
}

export async function acaoConferirPasso1Codigo(entrada: Record<string, unknown>) {
  return indicadores.conferirPasso1Codigo(await repositorio(), {
    codigo: texto(entrada.codigo),
    desconto: texto(entrada.desconto),
  });
}

export async function acaoCriarCodigo(entrada: Record<string, unknown>) {
  return indicadores.criarCodigo(
    await repositorio(),
    {
      indicadorId: texto(entrada.indicadorId),
      codigo: texto(entrada.codigo),
      tipo: texto(entrada.tipo),
      desconto: texto(entrada.desconto),
      validoAte: entrada.validoAte === null ? null : texto(entrada.validoAte),
      limite: texto(entrada.limite),
    },
    new Date(),
  );
}

export async function acaoDefinirCodigoAtivo(codigoId: string, ativo: boolean) {
  const resultado = await indicadores.definirCodigoAtivo(await repositorio(), {
    codigoId: texto(codigoId),
    ativo: ativo === true,
  });
  if (resultado.ok) refresh();
  return resultado;
}
