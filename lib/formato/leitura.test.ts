import { lerPercentual, lerReais } from "@/lib/formato/leitura";

describe("lerReais (spec 10.5)", () => {
  it.each([
    ["110", 11000],
    ["110,5", 11050],
    ["110,50", 11050],
    ["1.234,56", 123456],
    ["1.234", 123400],
    ["R$ 110,00", 11000],
    [" 0,01 ", 1],
    ["110.50", 11050],
  ])('"%s" → %i centavos', (texto, centavos) => {
    expect(lerReais(texto)).toEqual({ ok: true, centavos });
  });

  it.each(["", "   ", "0", "0,00", "abc", "110,505", "-10", "1.23,4", "12.3456", "99999999999999"])(
    'recusa "%s" com a mensagem da spec',
    (texto) => {
      expect(lerReais(texto)).toEqual({
        ok: false,
        motivo: "valor_invalido",
        mensagem: "Digite o valor da compra. Ex.: 110 ou 110,50.",
      });
    },
  );
});

describe("lerPercentual (spec 10.4)", () => {
  it.each([
    ["5", 500],
    ["7,5", 750],
    ["12,25", 1225],
    ["5%", 500],
    ["0", 0],
    ["100", 10000],
  ])('"%s" → %i centésimos de ponto', (texto, bp) => {
    expect(lerPercentual(texto)).toEqual({ ok: true, bp });
  });

  it.each(["", "abc", "100,01", "150", "-5", "7,555"])('recusa "%s" com a mensagem da spec', (texto) => {
    expect(lerPercentual(texto)).toEqual({
      ok: false,
      motivo: "desconto_invalido",
      mensagem: "O desconto precisa ser de 0% a 100%.",
    });
  });
});
