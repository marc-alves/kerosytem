import type { CarimboParaCartao, EstadoCartao } from "@/lib/fidelidade/tipos";
import type { Falha } from "@/lib/indicacao/tipos";

/** Ordem de confirmação; empate pelo id, para o resgate escolher sempre os mesmos. */
export const maisAntigoPrimeiro = (a: CarimboParaCartao, b: CarimboParaCartao) =>
  a.criadoEm.getTime() - b.criadoEm.getTime() || a.id.localeCompare(b.id);

/** Carimbos não retirados nem usados em resgate (RF5, RF6). */
export function carimbosNoCartao(carimbos: readonly CarimboParaCartao[]): CarimboParaCartao[] {
  return carimbos.filter((c) => c.retiradoEm === null && c.resgateId === null);
}

const liberado = (c: CarimboParaCartao, agora: Date) => c.liberadoEm.getTime() <= agora.getTime();

/** Situação do cartão agora (RF4 a RF6). */
export function estadoCartao(entrada: {
  carimbos: readonly CarimboParaCartao[];
  meta: number;
  agora: Date;
}): EstadoCartao {
  const { meta, agora } = entrada;
  const noCartao = carimbosNoCartao(entrada.carimbos);
  const liberados = noCartao.filter((c) => liberado(c, agora)).length;
  const aLiberar = noCartao.filter((c) => !liberado(c, agora));
  const completo = noCartao.length >= meta;
  const podeResgatar = liberados >= meta;

  // O prêmio fica liberado quando o carimbo de número `meta`, em ordem de liberação, é liberado.
  const porLiberacao = noCartao.map((c) => c.liberadoEm.getTime()).sort((a, b) => a - b);
  const premioLiberadoEm = completo && !podeResgatar ? new Date(porLiberacao[meta - 1]) : null;
  const proxima = aLiberar.map((c) => c.liberadoEm.getTime()).sort((a, b) => a - b)[0];

  return {
    meta,
    noCartao: noCartao.length,
    liberados,
    aLiberar: aLiberar.length,
    exibido: Math.min(noCartao.length, meta),
    completo,
    sobra: Math.max(0, noCartao.length - meta),
    faltam: Math.max(0, meta - noCartao.length),
    podeResgatar,
    premioLiberadoEm,
    proximaLiberacao: proxima === undefined ? null : new Date(proxima),
  };
}

/** Para os carimbos desenhados: quantos dos exibidos já estão liberados (os outros, a liberar). */
export function liberadosExibidos(estado: EstadoCartao): number {
  return Math.min(estado.liberados, estado.exibido);
}

export type ResultadoEscolhaResgate =
  | { ok: true; carimboIds: string[] }
  | Falha<"carimbos_insuficientes">;

/** RF6: os `meta` carimbos liberados mais antigos, ou a recusa da spec 10.2. */
export function escolherCarimbosDoResgate(entrada: {
  carimbos: readonly CarimboParaCartao[];
  meta: number;
  agora: Date;
  nomeCliente: string;
}): ResultadoEscolhaResgate {
  const { meta, agora, nomeCliente } = entrada;
  const liberados = carimbosNoCartao(entrada.carimbos)
    .filter((c) => liberado(c, agora))
    .sort(maisAntigoPrimeiro);
  if (liberados.length < meta) {
    return {
      ok: false,
      motivo: "carimbos_insuficientes",
      mensagem: `O cartão de ${nomeCliente} não tem mais carimbos liberados suficientes. Nada foi registrado.`,
    };
  }
  return { ok: true, carimboIds: liberados.slice(0, meta).map((c) => c.id) };
}

/** RF7: só não desfaz duas vezes. */
export function podeDesfazerResgate(resgate: { desfeitoEm: Date | null }): { ok: true } | Falha<"resgate_ja_desfeito"> {
  if (resgate.desfeitoEm !== null) {
    return { ok: false, motivo: "resgate_ja_desfeito", mensagem: "Este resgate já foi desfeito." };
  }
  return { ok: true };
}

/** RF5: venda cujo carimbo está num resgate não desfeito não pode ser cancelada (spec 10.3). */
export function podeCancelarPorFidelidade(entrada: {
  carimbo: { resgateId: string | null } | null;
  nomeCliente: string;
}): { ok: true } | Falha<"venda_em_resgate"> {
  const { carimbo, nomeCliente } = entrada;
  if (carimbo?.resgateId) {
    return {
      ok: false,
      motivo: "venda_em_resgate",
      mensagem: `Esta venda já entrou no prêmio que ${nomeCliente} resgatou. Para cancelar, desfaça o resgate no cartão de ${nomeCliente}.`,
    };
  }
  return { ok: true };
}
