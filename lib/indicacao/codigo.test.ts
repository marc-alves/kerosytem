import { codigoValido, contarUsos, normalizarCodigo, validarCodigo } from "@/lib/indicacao/codigo";
import type { CodigoParaValidar } from "@/lib/indicacao/tipos";

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

describe("codigoValido (RN2)", () => {
  const ativo = { ativo: true, validoAte: "2026-10-15" };

  it("sem validade, vale enquanto ativo", () => {
    expect(codigoValido({ codigo: { ativo: true, validoAte: null }, agora: new Date("2030-01-01T12:00:00Z") })).toBe(true);
  });

  it("vale até 23h59 de Brasília do dia de validade", () => {
    // 23h59 de 15/10 em Brasília = 02h59 de 16/10 em UTC.
    expect(codigoValido({ codigo: ativo, agora: new Date("2026-10-16T02:59:59Z") })).toBe(true);
    expect(codigoValido({ codigo: ativo, agora: new Date("2026-10-16T03:00:00Z") })).toBe(false);
  });

  it("desativado nunca vale", () => {
    expect(codigoValido({ codigo: { ativo: false, validoAte: null }, agora: new Date() })).toBe(false);
  });
});

describe("contarUsos (RN3)", () => {
  it("só vendas confirmadas contam", () => {
    const vendas = [
      ...Array(9).fill({ status: "confirmada" }),
      ...Array(5).fill({ status: "pendente" }),
      { status: "cancelada" },
    ];
    expect(contarUsos(vendas)).toBe(9);
  });
});

describe("validarCodigo — código (RN2, RN3)", () => {
  const agora = new Date("2026-10-20T15:00:00Z");
  const camila5: CodigoParaValidar = {
    codigo: "camila5",
    indicadorId: "camila",
    indicadorNome: "Camila",
    tipo: "normal",
    descontoBp: 500,
    comissaoBp: 300,
    validoAte: null,
    ativo: true,
    limiteUsos: 10,
    usos: 0,
  };

  it("código válido é aceito sem avisos", () => {
    expect(validarCodigo({ codigo: camila5, agora })).toEqual({ ok: true, codigo: camila5, avisos: [] });
  });

  it("código inexistente é recusado com mensagem clara", () => {
    expect(validarCodigo({ codigo: null, agora })).toEqual({
      ok: false,
      motivo: "codigo_nao_encontrado",
      mensagem: "Código não encontrado. Confira se foi digitado certo.",
    });
  });

  it("Código inativo: camila5 desativado é recusado", () => {
    expect(validarCodigo({ codigo: { ...camila5, ativo: false }, agora })).toEqual({
      ok: false,
      motivo: "codigo_desativado",
      mensagem: "O código camila5 está desativado. Use outro código ou lance sem código.",
    });
  });

  it("Código vencido é recusado com a data em formato brasileiro", () => {
    expect(validarCodigo({ codigo: { ...camila5, validoAte: "2026-10-15" }, agora })).toEqual({
      ok: false,
      motivo: "codigo_vencido",
      mensagem: "O código camila5 venceu em 15/10/2026. Use outro código ou lance sem código.",
    });
  });

  it("código no último dia de validade é aceito", () => {
    expect(validarCodigo({ codigo: { ...camila5, validoAte: "2026-10-20" }, agora }).ok).toBe(true);
  });

  it("Limite de usos: com 10 vendas confirmadas, a 11ª é aceita com aviso", () => {
    expect(validarCodigo({ codigo: { ...camila5, usos: 10 }, agora })).toEqual({
      ok: true,
      codigo: { ...camila5, usos: 10 },
      avisos: [
        {
          tipo: "limite_atingido",
          mensagem: "Este código atingiu 10 usos, considere gerar um novo código para Camila.",
        },
      ],
    });
  });

  it("Vendas pendentes e limite: 9 confirmadas + 5 pendentes não geram aviso", () => {
    const vendas = [...Array(9).fill({ status: "confirmada" }), ...Array(5).fill({ status: "pendente" })];
    const r = validarCodigo({ codigo: { ...camila5, usos: contarUsos(vendas) }, agora });
    expect(r).toEqual({ ok: true, codigo: { ...camila5, usos: 9 }, avisos: [] });
  });
});
