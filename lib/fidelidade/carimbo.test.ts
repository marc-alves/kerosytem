import { dataLiberacao, ganhaCarimbo } from "@/lib/fidelidade/carimbo";

const programa = { criadoEm: new Date("2026-10-01T12:00:00Z"), valorMinimo: null };
const venda = { status: "confirmada" as const, criadoEm: new Date("2026-10-05T12:00:00Z"), valorFinal: 10450 };

describe("ganhaCarimbo (RF3)", () => {
  it("venda confirmada depois do programa ganha", () => {
    expect(ganhaCarimbo({ venda, programa })).toBe(true);
  });

  it("pendente e cancelada não ganham", () => {
    expect(ganhaCarimbo({ venda: { ...venda, status: "pendente" }, programa })).toBe(false);
    expect(ganhaCarimbo({ venda: { ...venda, status: "cancelada" }, programa })).toBe(false);
  });

  it("venda lançada antes do programa não ganha, mesmo confirmada depois", () => {
    expect(ganhaCarimbo({ venda: { ...venda, criadoEm: new Date("2026-09-30T12:00:00Z") }, programa })).toBe(false);
  });

  it("valor mínimo: abaixo não ganha; igual ganha", () => {
    const comMinimo = { ...programa, valorMinimo: 1500 };
    expect(ganhaCarimbo({ venda: { ...venda, valorFinal: 1200 }, programa: comMinimo })).toBe(false);
    expect(ganhaCarimbo({ venda: { ...venda, valorFinal: 1500 }, programa: comMinimo })).toBe(true);
  });
});

describe("dataLiberacao (RF4)", () => {
  it("prazo 0 libera na hora", () => {
    const confirmadaEm = new Date("2026-11-01T15:30:00Z");
    expect(dataLiberacao({ confirmadaEm, diasLiberacao: 0 })).toEqual(confirmadaEm);
  });

  it("confirmada em 01/11 com 7 dias: libera às 00h00 de Brasília de 08/11", () => {
    const r = dataLiberacao({ confirmadaEm: new Date("2026-11-01T15:30:00Z"), diasLiberacao: 7 });
    expect(r.toISOString()).toBe("2026-11-08T03:00:00.000Z");
  });

  it("usa o dia de Brasília: 23h30 de 01/11 em Brasília ainda é dia 01", () => {
    // 02/11 02:30 UTC = 01/11 23:30 em Brasília.
    const r = dataLiberacao({ confirmadaEm: new Date("2026-11-02T02:30:00Z"), diasLiberacao: 1 });
    expect(r.toISOString()).toBe("2026-11-02T03:00:00.000Z");
  });

  it("vira o mês", () => {
    const r = dataLiberacao({ confirmadaEm: new Date("2026-10-28T12:00:00Z"), diasLiberacao: 7 });
    expect(r.toISOString()).toBe("2026-11-04T03:00:00.000Z");
  });
});
