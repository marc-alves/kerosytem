import { descreverCodigo } from "@/lib/formato/codigo";

describe("descreverCodigo", () => {
  it("mostra código e indicador, ou Sem código", () => {
    expect(descreverCodigo({ codigo: "camila5", indicadorNome: "Camila" })).toBe("camila5, de Camila");
    expect(descreverCodigo(null)).toBe("Sem código");
  });
});
