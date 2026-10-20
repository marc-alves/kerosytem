import {
  dataEmBrasilia,
  diasAntes,
  formatarData,
  formatarDataHora,
  inicioDoPeriodo,
} from "@/lib/indicacao/periodo";

describe("dataEmBrasilia", () => {
  it("usa o dia de Brasília, não o de UTC", () => {
    // 01h UTC do dia 21 ainda é 22h do dia 20 em Brasília.
    expect(dataEmBrasilia(new Date("2026-10-21T01:00:00Z"))).toBe("2026-10-20");
    expect(dataEmBrasilia(new Date("2026-10-21T03:00:00Z"))).toBe("2026-10-21");
  });
});

describe("diasAntes", () => {
  it("atravessa mês e ano", () => {
    expect(diasAntes("2026-03-01", 1)).toBe("2026-02-28");
    expect(diasAntes("2027-01-03", 6)).toBe("2026-12-28");
  });
});

describe("formatação de datas", () => {
  it("formata data e data com hora em Brasília", () => {
    expect(formatarData("2026-12-31")).toBe("31/12/2026");
    expect(formatarDataHora(new Date("2026-10-21T01:05:00Z"))).toBe("20/10/2026 às 22:05");
  });
});

describe("inicioDoPeriodo (spec 10.7)", () => {
  const agora = new Date("2026-10-20T15:00:00Z");

  it.each([
    ["hoje", "2026-10-20"],
    ["7dias", "2026-10-14"],
    ["30dias", "2026-09-21"],
    ["tudo", null],
  ] as const)("%s → %s", (periodo, inicio) => {
    expect(inicioDoPeriodo(periodo, agora)).toBe(inicio);
  });
});
