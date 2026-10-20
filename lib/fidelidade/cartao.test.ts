import {
  escolherCarimbosDoResgate,
  estadoCartao,
  podeCancelarPorFidelidade,
  podeDesfazerResgate,
} from "@/lib/fidelidade/cartao";
import type { CarimboParaCartao } from "@/lib/fidelidade/tipos";

const DIA = 24 * 60 * 60 * 1000;
const agora = new Date("2026-11-05T15:00:00Z");

/** `n` carimbos; os `aLiberar` últimos liberam depois de agora, um por dia. */
function carimbos(n: number, aLiberar = 0): CarimboParaCartao[] {
  return Array.from({ length: n }, (_, i) => {
    const futuro = i >= n - aLiberar;
    const criadoEm = new Date(agora.getTime() - (n - i) * DIA);
    return {
      id: `c${String(i).padStart(2, "0")}`,
      criadoEm,
      liberadoEm: futuro ? new Date(agora.getTime() + (i - (n - aLiberar) + 1) * DIA) : criadoEm,
      resgateId: null,
      retiradoEm: null,
    };
  });
}

describe("estadoCartao (RF4 a RF6, seção 12)", () => {
  it("cartão vazio", () => {
    expect(estadoCartao({ carimbos: [], meta: 10, agora })).toEqual({
      meta: 10,
      noCartao: 0,
      liberados: 0,
      aLiberar: 0,
      exibido: 0,
      completo: false,
      sobra: 0,
      faltam: 10,
      podeResgatar: false,
      premioLiberadoEm: null,
      proximaLiberacao: null,
    });
  });

  it("9 → 10 de 10, todos liberados: completo e pode resgatar", () => {
    const e = estadoCartao({ carimbos: carimbos(10), meta: 10, agora });
    expect(e).toMatchObject({ exibido: 10, completo: true, faltam: 0, sobra: 0, podeResgatar: true, premioLiberadoEm: null });
  });

  it("completo a liberar: mostra quando o prêmio libera", () => {
    const lista = carimbos(10, 1);
    const e = estadoCartao({ carimbos: lista, meta: 10, agora });
    expect(e).toMatchObject({ completo: true, podeResgatar: false, liberados: 9, aLiberar: 1 });
    expect(e.premioLiberadoEm).toEqual(lista[9].liberadoEm);
    expect(e.proximaLiberacao).toEqual(lista[9].liberadoEm);
  });

  it("12 de 10 com 9 liberados: sem resgate até liberar o 10º", () => {
    const lista = carimbos(12, 3);
    const e = estadoCartao({ carimbos: lista, meta: 10, agora });
    expect(e).toMatchObject({ noCartao: 12, exibido: 10, sobra: 2, liberados: 9, podeResgatar: false });
    expect(e.premioLiberadoEm).toEqual(lista[9].liberadoEm);
  });

  it("retirados e usados em resgate não contam", () => {
    const lista = carimbos(5);
    lista[0].retiradoEm = agora;
    lista[1].resgateId = "r1";
    expect(estadoCartao({ carimbos: lista, meta: 10, agora })).toMatchObject({ noCartao: 3, faltam: 7 });
  });

  it("meta ajustada de 10 para 8 com 8 liberados: completo", () => {
    expect(estadoCartao({ carimbos: carimbos(8), meta: 8, agora })).toMatchObject({ completo: true, podeResgatar: true });
  });

  it("carimbo que libera exatamente agora já conta como liberado", () => {
    const [c] = carimbos(1);
    expect(estadoCartao({ carimbos: [{ ...c, liberadoEm: agora }], meta: 2, agora }).liberados).toBe(1);
  });
});

describe("escolherCarimbosDoResgate (RF6)", () => {
  it("usa os liberados mais antigos", () => {
    const lista = carimbos(12);
    const r = escolherCarimbosDoResgate({ carimbos: [...lista].reverse(), meta: 10, agora, nomeCliente: "João" });
    expect(r).toEqual({ ok: true, carimboIds: lista.slice(0, 10).map((c) => c.id) });
  });

  it("ignora os a liberar, retirados e já usados", () => {
    const lista = carimbos(12, 2);
    lista[0].retiradoEm = agora;
    lista[1].resgateId = "r1";
    expect(escolherCarimbosDoResgate({ carimbos: lista, meta: 8, agora, nomeCliente: "João" })).toEqual({
      ok: true,
      carimboIds: lista.slice(2, 10).map((c) => c.id),
    });
  });

  it("9 liberados com meta 10: recusado", () => {
    expect(escolherCarimbosDoResgate({ carimbos: carimbos(12, 3), meta: 10, agora, nomeCliente: "João" })).toEqual({
      ok: false,
      motivo: "carimbos_insuficientes",
      mensagem: "O cartão de João não tem mais carimbos liberados suficientes. Nada foi registrado.",
    });
  });
});

describe("podeDesfazerResgate (RF7)", () => {
  it("recusa resgate já desfeito", () => {
    expect(podeDesfazerResgate({ desfeitoEm: null })).toEqual({ ok: true });
    expect(podeDesfazerResgate({ desfeitoEm: agora })).toMatchObject({ ok: false, motivo: "resgate_ja_desfeito" });
  });
});

describe("podeCancelarPorFidelidade (RF5)", () => {
  it("venda sem carimbo ou com carimbo não usado: pode", () => {
    expect(podeCancelarPorFidelidade({ carimbo: null, nomeCliente: "João" })).toEqual({ ok: true });
    expect(podeCancelarPorFidelidade({ carimbo: { resgateId: null }, nomeCliente: "João" })).toEqual({ ok: true });
  });

  it("carimbo em resgate: recusado com a mensagem da spec 10.3", () => {
    expect(podeCancelarPorFidelidade({ carimbo: { resgateId: "r1" }, nomeCliente: "João" })).toEqual({
      ok: false,
      motivo: "venda_em_resgate",
      mensagem: "Esta venda já entrou no prêmio que João resgatou. Para cancelar, desfaça o resgate no cartão de João.",
    });
  });
});
