"use server";

import { refresh } from "next/cache";
import * as fidelidade from "@/lib/casos-de-uso/fidelidade";
import type { Recusa } from "@/lib/casos-de-uso/resultado";
import { gerarChaveCartao } from "@/lib/dados/chave";
import { empresaDaSessao, repositorioFidelidade } from "@/lib/dados/sessao";
import { moduloAtivo } from "@/lib/empresas/modulos";
import type { CamposPrograma } from "@/lib/fidelidade/programa";

// Server Actions recebem qualquer coisa por POST: só passa adiante texto.
// A empresa vem da sessão, nunca do navegador (RE3).
const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

/** Com o módulo desligado, nenhuma gravação da fidelidade (spec 002, RF10). */
async function repoSeAtivo() {
  return moduloAtivo(await empresaDaSessao(), "fidelidade") ? repositorioFidelidade() : null;
}
const desligado = <C extends string = never>(): Recusa<C> => ({
  ok: false,
  erros: { geral: "O cartão fidelidade não está ativo nesta empresa." } as Recusa<C>["erros"],
});

export async function acaoSalvarPrograma(entrada: Record<string, unknown>) {
  const repo = await repoSeAtivo();
  if (!repo) return desligado<CamposPrograma>();
  const r = await fidelidade.salvarPrograma(
    repo,
    {
      meta: texto(entrada.meta),
      premio: texto(entrada.premio),
      valorMinimo: texto(entrada.valorMinimo),
      diasLiberacao: texto(entrada.diasLiberacao),
    },
    new Date(),
  );
  // O programa inteiro é do servidor; para a tela basta saber se deu certo.
  return r.ok ? { ok: true as const, criado: r.criado } : r;
}

export async function acaoRegistrarResgate(clienteId: string) {
  const repo = await repoSeAtivo();
  if (!repo) return desligado();
  const r = await fidelidade.registrarResgate(repo, texto(clienteId), new Date());
  if (r.ok) refresh();
  return r;
}

export async function acaoDesfazerResgate(clienteId: string, resgateId: string) {
  const repo = await repoSeAtivo();
  if (!repo) return desligado();
  const r = await fidelidade.desfazerResgate(repo, { clienteId: texto(clienteId), resgateId: texto(resgateId) }, new Date());
  if (r.ok) refresh();
  return r;
}

export async function acaoGerarNovoLink(clienteId: string) {
  const repo = await repoSeAtivo();
  if (!repo) return desligado();
  const r = await fidelidade.gerarNovoLink(repo, texto(clienteId), new Date(), gerarChaveCartao);
  if (r.ok) refresh();
  return r;
}
