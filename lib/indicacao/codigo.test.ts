import { codigoValido, contarUsos, normalizarCodigo, validarCodigo } from "@/lib/indicacao/codigo";
import type { ClienteParaValidar, CodigoParaValidar } from "@/lib/indicacao/tipos";

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
    indicadorTelefone: "5561988887777",
    tipo: "normal",
    descontoBp: 500,
    comissaoBp: 300,
    validoAte: null,
    ativo: true,
    limiteUsos: 10,
    usos: 0,
  };
  const joao: ClienteParaValidar = {
    telefone: "5561999999999",
    vinculo: null,
    temVendaConfirmada: false,
    temVendaPendente: false,
  };

  it("código válido é aceito sem avisos", () => {
    expect(validarCodigo({ codigo: camila5, cliente: joao, agora })).toEqual({ ok: true, codigo: camila5, avisos: [] });
  });

  it("código inexistente é recusado com mensagem clara", () => {
    expect(validarCodigo({ codigo: null, cliente: joao, agora })).toEqual({
      ok: false,
      motivo: "codigo_nao_encontrado",
      mensagem: "Código não encontrado. Confira se foi digitado certo.",
    });
  });

  it("Código inativo: camila5 desativado é recusado", () => {
    expect(validarCodigo({ codigo: { ...camila5, ativo: false }, cliente: joao, agora })).toEqual({
      ok: false,
      motivo: "codigo_desativado",
      mensagem: "O código camila5 está desativado. Use outro código ou lance sem código.",
    });
  });

  it("Código vencido é recusado com a data em formato brasileiro", () => {
    expect(validarCodigo({ codigo: { ...camila5, validoAte: "2026-10-15" }, cliente: joao, agora })).toEqual({
      ok: false,
      motivo: "codigo_vencido",
      mensagem: "O código camila5 venceu em 15/10/2026. Use outro código ou lance sem código.",
    });
  });

  it("código no último dia de validade é aceito", () => {
    expect(validarCodigo({ codigo: { ...camila5, validoAte: "2026-10-20" }, cliente: joao, agora }).ok).toBe(true);
  });

  it("Limite de usos: com 10 vendas confirmadas, a 11ª é aceita com aviso", () => {
    expect(validarCodigo({ codigo: { ...camila5, usos: 10 }, cliente: joao, agora })).toEqual({
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
    const r = validarCodigo({ codigo: { ...camila5, usos: contarUsos(vendas) }, cliente: joao, agora });
    expect(r).toEqual({ ok: true, codigo: { ...camila5, usos: 9 }, avisos: [] });
  });
});

describe("validarCodigo — cliente (RN5, RN6, RN7)", () => {
  const agora = new Date("2026-10-20T15:00:00Z");
  const base = {
    validoAte: null,
    ativo: true,
    limiteUsos: 10,
    usos: 0,
  };
  const camila5: CodigoParaValidar = {
    ...base,
    codigo: "camila5",
    indicadorId: "camila",
    indicadorNome: "Camila",
    indicadorTelefone: "5561988887777",
    tipo: "normal",
    descontoBp: 500,
    comissaoBp: 300,
  };
  const primeiraamanda: CodigoParaValidar = {
    ...base,
    codigo: "primeiraamanda",
    indicadorId: "amanda",
    indicadorNome: "Amanda",
    indicadorTelefone: "5561977776666",
    tipo: "primeira_compra",
    descontoBp: 1000,
    comissaoBp: 500,
  };
  const novo: ClienteParaValidar = {
    telefone: "5561999999999",
    vinculo: null,
    temVendaConfirmada: false,
    temVendaPendente: false,
  };
  const vinculadoCamila: ClienteParaValidar = {
    ...novo,
    vinculo: { indicadorId: "camila", indicadorNome: "Camila" },
    temVendaConfirmada: true,
  };

  it("Reuso do código: João (vinculado à Camila) usa camila5 de novo", () => {
    expect(validarCodigo({ codigo: camila5, cliente: vinculadoCamila, agora })).toEqual({
      ok: true,
      codigo: camila5,
      avisos: [],
    });
  });

  it("Primeira compra válida: cliente sem venda confirmada usa primeiraamanda", () => {
    expect(validarCodigo({ codigo: primeiraamanda, cliente: novo, agora })).toEqual({
      ok: true,
      codigo: primeiraamanda,
      avisos: [],
    });
  });

  it("Primeira compra inválida: cliente com venda confirmada é recusado", () => {
    // Venda confirmada sem código: tem compra, mas ainda sem vínculo.
    const comCompra = { ...novo, temVendaConfirmada: true };
    expect(validarCodigo({ codigo: primeiraamanda, cliente: comCompra, agora })).toEqual({
      ok: false,
      motivo: "primeira_compra_ja_feita",
      mensagem: "O código primeiraamanda é só para a primeira compra, e este cliente já comprou. Use outro código.",
    });
  });

  it("Primeira compra com venda pendente: aceito, com aviso", () => {
    const comPendente = { ...novo, temVendaPendente: true };
    expect(validarCodigo({ codigo: primeiraamanda, cliente: comPendente, agora })).toEqual({
      ok: true,
      codigo: primeiraamanda,
      avisos: [
        { tipo: "cliente_com_venda_pendente", mensagem: "Este cliente tem venda aguardando confirmação." },
      ],
    });
  });

  it("código normal com venda pendente não gera aviso", () => {
    const comPendente = { ...novo, temVendaPendente: true };
    expect(validarCodigo({ codigo: camila5, cliente: comPendente, agora })).toEqual({
      ok: true,
      codigo: camila5,
      avisos: [],
    });
  });

  it("Código de outro indicador: João (vinculado à Camila) usa código da Amanda", () => {
    const amanda5 = { ...primeiraamanda, codigo: "amanda5", tipo: "normal" as const };
    expect(validarCodigo({ codigo: amanda5, cliente: vinculadoCamila, agora })).toEqual({
      ok: false,
      motivo: "cliente_de_outro_indicador",
      mensagem: "Este cliente já usa os códigos de Camila. Use um código de Camila.",
    });
  });

  it("Autoindicação: cliente com o mesmo telefone do indicador é recusado", () => {
    const camila = { ...novo, telefone: "5561988887777" };
    expect(validarCodigo({ codigo: camila5, cliente: camila, agora })).toEqual({
      ok: false,
      motivo: "autoindicacao",
      mensagem: "Este telefone é o mesmo de Camila. Quem indica não pode usar o próprio código.",
    });
  });

  it("limite atingido e venda pendente juntos geram os dois avisos", () => {
    const r = validarCodigo({
      codigo: { ...primeiraamanda, usos: 10 },
      cliente: { ...novo, temVendaPendente: true },
      agora,
    });
    expect(r.ok && r.avisos.map((a) => a.tipo)).toEqual(["limite_atingido", "cliente_com_venda_pendente"]);
  });
});
