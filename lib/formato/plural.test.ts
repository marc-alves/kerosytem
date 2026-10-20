import { contar } from "@/lib/formato/plural";

describe("contar", () => {
  it("usa o singular só para 1", () => {
    expect(contar(0, "venda paga", "vendas pagas")).toBe("0 vendas pagas");
    expect(contar(1, "venda paga", "vendas pagas")).toBe("1 venda paga");
    expect(contar(2, "código ativo", "códigos ativos")).toBe("2 códigos ativos");
  });
});
