"use server";

import { refresh } from "next/cache";
import * as vendas from "@/lib/casos-de-uso/vendas";
import { empresaDaSessao, fidelidadeNaVenda, repositorio, repositorioFidelidade } from "@/lib/dados/sessao";
import { moduloAtivo } from "@/lib/empresas/modulos";

// Server Actions recebem qualquer coisa por POST: só passa adiante texto.
// A empresa vem da sessão (repositorio()), nunca do navegador (RE3).
const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

function entradaVenda(entrada: Record<string, unknown>): vendas.EntradaVenda {
  return {
    telefone: texto(entrada.telefone),
    nome: texto(entrada.nome),
    codigo: texto(entrada.codigo),
    valor: texto(entrada.valor),
  };
}

/** Código só com o módulo de Indicação ativo (spec 000, RE7). */
async function opcoesVenda(): Promise<vendas.OpcoesVenda> {
  return { comCodigo: moduloAtivo(await empresaDaSessao(), "indicacao") };
}

export async function acaoBuscarCliente(telefone: string) {
  return vendas.buscarClientePorTelefone(await repositorio(), texto(telefone));
}

export async function acaoPreviaVenda(entrada: Record<string, unknown>) {
  return vendas.previaVenda(await repositorio(), entradaVenda(entrada), new Date(), await opcoesVenda());
}

export async function acaoLancarVenda(entrada: Record<string, unknown>) {
  return vendas.lancarVenda(await repositorio(), entradaVenda(entrada), new Date(), await opcoesVenda());
}

export async function acaoConfirmarRecebimento(vendaId: string) {
  // Com a fidelidade ativa, a confirmação dá o carimbo (spec 002, RF3).
  const resultado = await vendas.confirmarRecebimento(await repositorio(), texto(vendaId), new Date(), await fidelidadeNaVenda());
  if (resultado.ok) refresh();
  return resultado;
}

export async function acaoCancelarVenda(vendaId: string) {
  // A trava da venda usada em resgate vale mesmo com a fidelidade desligada (spec 002, RF5).
  const resultado = await vendas.cancelarVenda(await repositorio(), texto(vendaId), new Date(), await repositorioFidelidade());
  if (resultado.ok) refresh();
  return resultado;
}
