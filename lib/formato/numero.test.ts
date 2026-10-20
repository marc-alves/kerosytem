import { formatarPercentual, formatarReais } from "@/lib/formato/numero";

describe("formatarReais", () => {
  it("formato brasileiro com espaço comum: R$ 1.234,56", () => {
    expect(formatarReais(123456)).toBe("R$ 1.234,56");
    expect(formatarReais(123456)).not.toContain(" ");
  });

  it("valores da spec: R$ 110,00 e R$ 104,50", () => {
    expect(formatarReais(11000)).toBe("R$ 110,00");
    expect(formatarReais(10450)).toBe("R$ 104,50");
  });

  it("centavos e zero", () => {
    expect(formatarReais(0)).toBe("R$ 0,00");
    expect(formatarReais(5)).toBe("R$ 0,05");
    expect(formatarReais(314)).toBe("R$ 3,14");
  });

  it("milhões", () => {
    expect(formatarReais(123456789)).toBe("R$ 1.234.567,89");
  });

  it("negativo", () => {
    expect(formatarReais(-314)).toBe("-R$ 3,14");
  });

  it("recusa valor que não seja centavos inteiros", () => {
    expect(() => formatarReais(1.5)).toThrow(RangeError);
  });
});

describe("formatarPercentual", () => {
  it("sem casas quando inteiro: 5%", () => {
    expect(formatarPercentual(500)).toBe("5%");
    expect(formatarPercentual(10000)).toBe("100%");
    expect(formatarPercentual(0)).toBe("0%");
  });

  it("com vírgula quando não: 7,5% e 12,25%", () => {
    expect(formatarPercentual(750)).toBe("7,5%");
    expect(formatarPercentual(1225)).toBe("12,25%");
    expect(formatarPercentual(5)).toBe("0,05%");
  });
});
