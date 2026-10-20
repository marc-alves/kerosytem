import { calcularVenda } from "@/lib/indicacao/venda";

describe("calcularVenda (RN8)", () => {
  it("Venda com código normal: R$ 110,00 com 5% e 3% → desconto R$ 5,50, final R$ 104,50, comissão R$ 3,14", () => {
    expect(calcularVenda({ valorOriginal: 11000, descontoBp: 500, comissaoBp: 300 })).toEqual({
      valorOriginal: 11000,
      descontoBp: 500,
      valorDesconto: 550,
      valorFinal: 10450,
      comissaoBp: 300,
      comissao: 314,
    });
  });

  it("Venda sem código: R$ 50,00 sem desconto nem comissão", () => {
    expect(calcularVenda({ valorOriginal: 5000, descontoBp: 0, comissaoBp: 0 })).toEqual({
      valorOriginal: 5000,
      descontoBp: 0,
      valorDesconto: 0,
      valorFinal: 5000,
      comissaoBp: 0,
      comissao: 0,
    });
  });

  it("comissão é sobre o valor final, não sobre o original", () => {
    // 10% de desconto em R$ 100,00 → final R$ 90,00; 10% de comissão → R$ 9,00 (e não R$ 10,00).
    const r = calcularVenda({ valorOriginal: 10000, descontoBp: 1000, comissaoBp: 1000 });
    expect(r.valorFinal).toBe(9000);
    expect(r.comissao).toBe(900);
  });

  it("arredonda metade para cima ao centavo", () => {
    // R$ 0,10 × 5% = 0,5 centavo → 1 centavo.
    expect(calcularVenda({ valorOriginal: 10, descontoBp: 500, comissaoBp: 0 }).valorDesconto).toBe(1);
    // R$ 0,09 × 5% = 0,45 centavo → 0 centavo.
    expect(calcularVenda({ valorOriginal: 9, descontoBp: 500, comissaoBp: 0 }).valorDesconto).toBe(0);
  });

  it("aceita percentual com decimal (7,5% = 750)", () => {
    // R$ 33,33 × 7,5% = 249,975 centavos → 250.
    const r = calcularVenda({ valorOriginal: 3333, descontoBp: 750, comissaoBp: 0 });
    expect(r.valorDesconto).toBe(250);
    expect(r.valorFinal).toBe(3083);
  });

  it("valor final é sempre original menos desconto", () => {
    for (const valorOriginal of [1, 99, 1234, 999_999]) {
      const r = calcularVenda({ valorOriginal, descontoBp: 1250, comissaoBp: 333 });
      expect(r.valorFinal).toBe(valorOriginal - r.valorDesconto);
    }
  });

  it("recusa entrada que não seja centavos ou percentual inteiros válidos", () => {
    expect(() => calcularVenda({ valorOriginal: 110.5, descontoBp: 500, comissaoBp: 300 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: -1, descontoBp: 500, comissaoBp: 300 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: 11000, descontoBp: 10001, comissaoBp: 300 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: 11000, descontoBp: 500, comissaoBp: 2.5 })).toThrow(RangeError);
    expect(() => calcularVenda({ valorOriginal: Number.MAX_SAFE_INTEGER, descontoBp: 500, comissaoBp: 0 })).toThrow(RangeError);
  });
});
