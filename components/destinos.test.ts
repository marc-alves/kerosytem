import { destinoAtual, destinosAtivos } from "@/components/destinos";

describe("destinoAtual", () => {
  it("marca o destino certo, inclusive em telas internas", () => {
    expect(destinoAtual("/vendas/nova")).toBe("/vendas/nova");
    expect(destinoAtual("/vendas")).toBe("/vendas");
    expect(destinoAtual("/indicadores")).toBe("/indicadores");
    expect(destinoAtual("/indicadores/abc/codigos/novo")).toBe("/indicadores");
    expect(destinoAtual("/fidelidade/clientes/abc")).toBe("/fidelidade");
  });

  it("não confunde rotas parecidas nem marca o login", () => {
    expect(destinoAtual("/vendasx")).toBeNull();
    expect(destinoAtual("/login")).toBeNull();
  });
});

describe("destinosAtivos (spec 000 RE5 e RE7)", () => {
  it("os dois módulos: quatro destinos, na ordem", () => {
    expect(destinosAtivos({ modulosAtivos: ["fidelidade", "indicacao"] })).toEqual([
      "/vendas/nova",
      "/vendas",
      "/indicadores",
      "/fidelidade",
    ]);
  });

  it("só indicação ou só fidelidade: vendas sempre, mais o do módulo", () => {
    expect(destinosAtivos({ modulosAtivos: ["indicacao"] })).toEqual(["/vendas/nova", "/vendas", "/indicadores"]);
    expect(destinosAtivos({ modulosAtivos: ["fidelidade"] })).toEqual(["/vendas/nova", "/vendas", "/fidelidade"]);
  });

  it("nenhum módulo: nenhum destino", () => {
    expect(destinosAtivos({ modulosAtivos: [] })).toEqual([]);
  });
});
