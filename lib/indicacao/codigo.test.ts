import { normalizarCodigo } from "@/lib/indicacao/codigo";

describe("normalizarCodigo (RN1)", () => {
  it("Código em maiúsculas: CAMILA5 vira camila5", () => {
    expect(normalizarCodigo("CAMILA5")).toBe("camila5");
    expect(normalizarCodigo("Camila5")).toBe("camila5");
  });

  it("aceita espaços sem reclamar e os remove", () => {
    expect(normalizarCodigo("  camila5 ")).toBe("camila5");
    expect(normalizarCodigo("primeira amanda")).toBe("primeiraamanda");
  });

  it("campo vazio vira texto vazio (venda sem código)", () => {
    expect(normalizarCodigo("")).toBe("");
    expect(normalizarCodigo("   ")).toBe("");
  });
});
