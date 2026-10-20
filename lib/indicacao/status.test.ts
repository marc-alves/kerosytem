import { podeCancelarVenda, podeConfirmar } from "@/lib/indicacao/status";
import type { VendaParaTransicao } from "@/lib/indicacao/tipos";

const camila5 = { codigo: "camila5", tipo: "normal" as const, indicadorId: "camila", indicadorNome: "Camila" };
const primeiraamanda = {
  codigo: "primeiraamanda",
  tipo: "primeira_compra" as const,
  indicadorId: "amanda",
  indicadorNome: "Amanda",
};
const pendente = (codigo: VendaParaTransicao["codigo"]): VendaParaTransicao => ({ status: "pendente", codigo });
const semVinculo = { vinculo: null, temVendaConfirmada: false };
const vinculadoCamila = { vinculo: { indicadorId: "camila", indicadorNome: "Camila" }, temVendaConfirmada: true };

describe("podeConfirmar (RN10, RN6, RN5)", () => {
  it("Confirmar recebimento: primeira venda com código cria o vínculo", () => {
    expect(podeConfirmar({ venda: pendente(camila5), cliente: semVinculo })).toEqual({ ok: true, criarVinculo: true });
  });

  it("cliente já vinculado ao mesmo indicador confirma sem criar vínculo", () => {
    expect(podeConfirmar({ venda: pendente(camila5), cliente: vinculadoCamila })).toEqual({
      ok: true,
      criarVinculo: false,
    });
  });

  it("venda sem código confirma sem vínculo", () => {
    expect(podeConfirmar({ venda: pendente(null), cliente: semVinculo })).toEqual({ ok: true, criarVinculo: false });
  });

  it("Primeira compra válida: ao confirmar, vincula à Amanda", () => {
    expect(podeConfirmar({ venda: pendente(primeiraamanda), cliente: semVinculo })).toEqual({
      ok: true,
      criarVinculo: true,
    });
  });

  it("Confirmação com vínculo conflitante: cliente da Camila, venda pendente da Amanda", () => {
    const amanda5 = { ...primeiraamanda, codigo: "amanda5", tipo: "normal" as const };
    expect(podeConfirmar({ venda: pendente(amanda5), cliente: vinculadoCamila })).toEqual({
      ok: false,
      motivo: "cliente_de_outro_indicador",
      mensagem: "Este cliente já usa os códigos de Camila. Cancele esta venda e lance de novo com um código de Camila.",
    });
  });

  it("Confirmação de primeira compra com venda já confirmada: a segunda é recusada", () => {
    // Duas vendas pendentes com primeiraamanda; a primeira foi confirmada e vinculou à Amanda.
    const depoisDaPrimeira = { vinculo: { indicadorId: "amanda", indicadorNome: "Amanda" }, temVendaConfirmada: true };
    expect(podeConfirmar({ venda: pendente(primeiraamanda), cliente: depoisDaPrimeira })).toEqual({
      ok: false,
      motivo: "primeira_compra_ja_feita",
      mensagem:
        "Este cliente já tem uma compra paga, então o código primeiraamanda não vale mais. Cancele esta venda e lance de novo com outro código ou sem código.",
    });
  });

  it("primeira compra recusada também quando a compra paga foi sem código", () => {
    const comCompraSemCodigo = { vinculo: null, temVendaConfirmada: true };
    expect(podeConfirmar({ venda: pendente(primeiraamanda), cliente: comCompraSemCodigo })).toMatchObject({
      ok: false,
      motivo: "primeira_compra_ja_feita",
    });
  });

  it("só venda pendente pode ser confirmada", () => {
    expect(podeConfirmar({ venda: { ...pendente(camila5), status: "confirmada" }, cliente: vinculadoCamila })).toEqual({
      ok: false,
      motivo: "venda_nao_pendente",
      mensagem: "Esta venda já está paga.",
    });
    expect(podeConfirmar({ venda: { ...pendente(camila5), status: "cancelada" }, cliente: semVinculo })).toEqual({
      ok: false,
      motivo: "venda_nao_pendente",
      mensagem: "Esta venda foi cancelada e não pode ser confirmada.",
    });
  });
});

describe("podeCancelarVenda (RN12)", () => {
  it("Cancelar venda pendente: livre", () => {
    expect(podeCancelarVenda(pendente(camila5))).toEqual({ ok: true });
  });

  it("Cancelar venda confirmada: livre, sem bloqueio", () => {
    expect(podeCancelarVenda({ ...pendente(camila5), status: "confirmada" })).toEqual({ ok: true });
    expect(podeCancelarVenda({ status: "confirmada" })).toEqual({ ok: true });
  });

  it("venda já cancelada não cancela de novo", () => {
    expect(podeCancelarVenda({ ...pendente(camila5), status: "cancelada" })).toEqual({
      ok: false,
      motivo: "venda_ja_cancelada",
      mensagem: "Esta venda já foi cancelada.",
    });
  });
});
