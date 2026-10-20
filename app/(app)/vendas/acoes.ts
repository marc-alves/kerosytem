"use server";

import { refresh } from "next/cache";
import * as vendas from "@/lib/casos-de-uso/vendas";
import { repositorio } from "@/lib/dados/sessao";

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

export async function acaoBuscarCliente(telefone: string) {
  return vendas.buscarClientePorTelefone(await repositorio(), texto(telefone));
}

export async function acaoPreviaVenda(entrada: Record<string, unknown>) {
  return vendas.previaVenda(await repositorio(), entradaVenda(entrada), new Date());
}

export async function acaoLancarVenda(entrada: Record<string, unknown>) {
  return vendas.lancarVenda(await repositorio(), entradaVenda(entrada), new Date());
}

export async function acaoConfirmarRecebimento(vendaId: string) {
  const resultado = await vendas.confirmarRecebimento(await repositorio(), texto(vendaId), new Date());
  if (resultado.ok) refresh();
  return resultado;
}

export async function acaoCancelarVenda(vendaId: string) {
  const resultado = await vendas.cancelarVenda(await repositorio(), texto(vendaId), new Date());
  if (resultado.ok) refresh();
  return resultado;
}
