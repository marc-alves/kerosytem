import { calcularVenda } from "@/lib/indicacao/venda";

describe("calcularVenda (RN8)", () => {
  it("Venda com código normal: R$ 110,00 com 5% → desconto R$ 5,50, final R$ 104,50", () => {
    expect(calcularVenda({ valorOriginal: 11000, descontoBp: 500 })).toEqual({
      valorOriginal: 11000,
      descontoBp: 500,
      valorDesconto: 550,
      valorFinal: 10450,
    });
  });

  it("Venda sem código: R$ 50,00 sem desconto", () => {
    expect(calcularVenda({ valorOriginal: 5000, descontoBp: 0 })).toEqual({
      valorOriginal: 5000,
      descontoBp: 0,
      valorDesconto: 0,
      valorFinal: 5000,
    });
  });

  it("desconto de 100% deixa o valor final em zero", () => {
    expect(calcularVenda({ valorOriginal: 11000, descontoBp: 10000 }).valorFinal).toBe(0);
  });

  it("arredonda metade para cima ao centavo", () => {
    // R$ 0,10 × 5% = 0,5 centavo → 1 centavo.
    expect(calcularVenda({ valorOriginal: 10, descontoBp: 500 }).valorDesconto).toBe(1);
    // R$ 0,09 × 5% = 0,45 centavo → 0 centavo.
    expect(calcularVenda({ valorOriginal: 9, descontoBp: 500 }).valorDesconto).toBe(0);
  });

  it("aceita percentual com decimal (7,5% = 750)", () => {
    // R$ 33,33 × 7,5% = 249,975 centavos → 250.
    const r = calcularVenda({ valorOriginal: 3333, descontoBp: 750 });
    expect(r.valorDesconto).toBe(250);
    expect(r.valorFinal).toBe(3083);
  });

  it("valor final é sempre original menos desconto", () => {
    for (const valorOriginal of [1, 99, 1234, 999_999]) {
      const r = calcularVenda({ valorOriginal, descontoBp: 1250 });
      expect(r.valorFinal).toBe(valorOriginal - r.valorDesconto);
    }
  });

  it("recusa entrada que não seja centavos ou percentual inteiros válidos", () => {
    expect(() => calcularVenda({ valorOriginal: 110.5, descontoBp: 500 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: -1, descontoBp: 500 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: 11000, descontoBp: 10001 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: 11000, descontoBp: 2.5 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: Number.MAX_SAFE_INTEGER, descontoBp: 500 })).toThrow(RangeError);
  });
});
