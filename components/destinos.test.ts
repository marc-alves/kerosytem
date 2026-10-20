import { destinoAtual } from "@/components/destinos";

describe("destinoAtual", () => {
  it("marca o destino certo, inclusive em telas internas", () => {
    expect(destinoAtual("/vendas/nova")).toBe("/vendas/nova");
    expect(destinoAtual("/vendas")).toBe("/vendas");
    expect(destinoAtual("/indicadores")).toBe("/indicadores");
    expect(destinoAtual("/indicadores/abc/codigos/novo")).toBe("/indicadores");
  });

  it("não confunde rotas parecidas nem marca o login", () => {
    expect(destinoAtual("/vendasx")).toBeNull();
    expect(destinoAtual("/login")).toBeNull();
  });
});
