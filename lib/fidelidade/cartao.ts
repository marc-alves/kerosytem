import type { CarimboParaCartao, EstadoCartao } from "@/lib/fidelidade/tipos";

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
