import { frasePrazo, fraseRegra, resumoPrograma } from "@/lib/fidelidade/textos";

describe("textos do programa (spec 10.1, 11.1)", () => {
  it("resumo, regra e prazo", () => {
    expect(resumoPrograma({ meta: 10, premio: "1 salgado grátis" })).toBe("10 carimbos = 1 salgado grátis");
    expect(fraseRegra(null)).toBe("A cada compra ganhe 1 carimbo.");
    expect(fraseRegra(1500)).toBe("A cada compra a partir de R$\u00a015,00 ganhe 1 carimbo.");
    expect(frasePrazo(0)).toBe("Carimbo liberado na hora");
    expect(frasePrazo(1)).toBe("Carimbo liberado 1 dia depois do pagamento");
    expect(frasePrazo(7)).toBe("Carimbo liberado 7 dias depois do pagamento");
  });
});
