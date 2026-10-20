import {
  buscarClientePorTelefone,
  cancelarVenda,
  confirmarRecebimento,
  lancarVenda,
  previaVenda,
  type EntradaVenda,
} from "@/lib/casos-de-uso/vendas";
import { criarRepositorioEmMemoria } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, EMPRESA_B } from "@/lib/dados/semente";
import type { RepositorioIndicacao } from "@/lib/dados/tipos";

// Na semente da empresa A: João (61) 90000-0010 vinculado à Camila, com venda pendente;
// Pedro (61) 90000-0011 sem vínculo, com venda confirmada sem código; Camila (61) 90000-0001.
const agora = new Date("2026-10-20T15:00:00Z");
let banco: ReturnType<typeof criarSemente>;
let a: RepositorioIndicacao;

beforeEach(() => {
  banco = criarSemente(agora);
  a = criarRepositorioEmMemoria(banco, EMPRESA_A);
});

const joao: EntradaVenda = { telefone: "(61) 90000-0010", nome: "", codigo: "camila5", valor: "110" };
const novo: EntradaVenda = { telefone: "(61) 97777-1234", nome: "Lucas", codigo: "", valor: "50" };

describe("buscarClientePorTelefone (spec 10.5, tela 1)", () => {
  it("cliente existente em qualquer formato; novo vem sem nome", async () => {
    expect(await buscarClientePorTelefone(a, "+55 (61) 90000-0010")).toEqual({
      ok: true,
      telefone: "5561900000010",
      nome: "João",
    });
    expect(await buscarClientePorTelefone(a, "61 97777-1234")).toEqual({ ok: true, telefone: "5561977771234", nome: null });
  });

  it("telefone inválido", async () => {
    expect(await buscarClientePorTelefone(a, "1234")).toEqual({
      ok: false,
      erros: { telefone: "O telefone precisa ter DDD e número. Ex.: (61) 99999-9999." },
    });
  });
});

describe("venda sem o módulo de Indicação (spec 000, RE7)", () => {
  const semCodigo = { comCodigo: false };

  it("sem código: prévia e lançamento normais", async () => {
    const r = await previaVenda(a, { ...joao, codigo: "" }, agora, semCodigo);
    expect(r.ok && r.previa.calculo).toEqual({ valorOriginal: 11000, descontoBp: 0, valorDesconto: 0, valorFinal: 11000 });
    expect((await lancarVenda(a, { ...joao, codigo: "" }, agora, semCodigo)).ok).toBe(true);
  });

  it("código enviado mesmo assim é recusado", async () => {
    expect(await lancarVenda(a, joao, agora, semCodigo)).toEqual({
      ok: false,
      erros: { codigo: "Esta empresa não usa códigos de desconto. Lance sem código." },
    });
  });
});

describe("previaVenda (spec 10.5, seção 11)", () => {
  it("venda com código normal: 110,00 com 5% → 5,50 de desconto, 104,50 final", async () => {
    const r = await previaVenda(a, { ...joao, codigo: "CAMILA5" }, agora);
    expect(r).toEqual({
      ok: true,
      previa: {
        cliente: { id: "a-cli-joao", nome: "João", telefone: "5561900000010" },
        codigo: { id: "a-cod-camila5", codigo: "camila5", indicadorNome: "Camila", descontoBp: 500 },
        calculo: { valorOriginal: 11000, descontoBp: 500, valorDesconto: 550, valorFinal: 10450 },
        avisos: [],
      },
    });
  });

  it("cliente novo precisa de nome", async () => {
    expect(await previaVenda(a, { ...novo, nome: "  " }, agora)).toEqual({
      ok: false,
      erros: { nome: "Digite o nome do cliente." },
    });
  });

  it("venda sem código: sem desconto (RN9)", async () => {
    const r = await previaVenda(a, novo, agora);
    expect(r.ok && r.previa).toMatchObject({
      cliente: { id: null, nome: "Lucas" },
      codigo: null,
      calculo: { valorOriginal: 5000, valorDesconto: 0, valorFinal: 5000 },
    });
  });

  it("erros de código e valor aparecem juntos, cada um no seu campo", async () => {
    expect(await previaVenda(a, { ...joao, codigo: "naoexiste", valor: "0" }, agora)).toEqual({
      ok: false,
      erros: {
        codigo: "Código não encontrado. Confira se foi digitado certo.",
        valor: "Digite o valor da compra. Ex.: 110 ou 110,50.",
      },
    });
  });

  it("código de outro indicador para cliente vinculado: recusado (RN6)", async () => {
    const r = await previaVenda(a, { ...joao, codigo: "primeiraamanda" }, agora);
    expect(r).toEqual({
      ok: false,
      erros: { codigo: "Este cliente já usa os códigos de Camila. Use um código de Camila." },
    });
  });

  it("autoindicação: recusada (RN7)", async () => {
    const r = await previaVenda(a, { ...joao, telefone: "61900000001", nome: "Camila" }, agora);
    expect(r.ok ? null : r.erros.codigo).toBe(
      "Este telefone é o mesmo de Camila. Quem indica não pode usar o próprio código.",
    );
  });

  it("primeira compra para cliente que já comprou: recusada (RN5)", async () => {
    const r = await previaVenda(a, { ...joao, telefone: "(61) 90000-0011", codigo: "primeiraamanda" }, agora);
    expect(r.ok ? null : r.erros.codigo).toMatch(/só para a primeira compra/);
  });

  it("código desativado: recusado (RN2)", async () => {
    const r = await previaVenda(a, { ...joao, codigo: "camila10" }, agora);
    expect(r.ok ? null : r.erros.codigo).toBe(
      "O código camila10 está desativado. Use outro código ou lance sem código.",
    );
  });

  it("código que só existe em outra empresa: não encontrado", async () => {
    const b = criarRepositorioEmMemoria(banco, EMPRESA_B);
    const r = await previaVenda(b, { ...novo, codigo: "primeiraamanda" }, agora);
    expect(r.ok ? null : r.erros.codigo).toBe("Código não encontrado. Confira se foi digitado certo.");
  });

  it("primeira compra com venda pendente: aceita com aviso (RN5)", async () => {
    await lancarVenda(a, novo, agora);
    const r = await previaVenda(a, { ...novo, codigo: "primeiraamanda" }, agora);
    expect(r.ok && r.previa.avisos.map((x) => x.tipo)).toEqual(["cliente_com_venda_pendente"]);
  });
});

describe("lancarVenda (spec 10.5, RN10)", () => {
  it("grava pendente com os valores calculados no servidor; o resumo não muda", async () => {
    const resumoAntes = (await a.listarIndicadores()).find((i) => i.nome === "Camila");
    const r = await lancarVenda(a, joao, agora);
    expect(r.ok).toBe(true);
    const venda = await a.venda(r.ok ? r.vendaId : "");
    expect(venda).toMatchObject({
      status: "pendente",
      valorOriginal: 11000,
      descontoBp: 500,
      valorDesconto: 550,
      valorFinal: 10450,
      criadoEm: agora,
      cliente: { nome: "João" },
      codigo: { codigo: "camila5", indicadorNome: "Camila" },
    });
    expect((await a.listarIndicadores()).find((i) => i.nome === "Camila")).toEqual(resumoAntes);
  });

  it("cria o cliente novo uma vez só; na segunda venda ele já existe", async () => {
    await lancarVenda(a, novo, agora);
    await lancarVenda(a, { ...novo, nome: "Outro nome" }, agora);
    const lucas = banco.clientes.filter((c) => c.telefone === "5561977771234");
    expect(lucas).toHaveLength(1);
    expect(lucas[0]).toMatchObject({ nome: "Lucas", empresaId: EMPRESA_A, indicadorId: null });
  });

  it("recusa na gravação se algo mudou desde a prévia", async () => {
    expect((await previaVenda(a, joao, agora)).ok).toBe(true);
    await a.definirCodigoAtivo("a-cod-camila5", false);
    const r = await lancarVenda(a, joao, agora);
    expect(r.ok ? null : r.erros.codigo).toMatch(/está desativado/);
  });
});

describe("confirmarRecebimento e cancelarVenda (spec 10.8, seção 11)", () => {
  async function lancar(entrada: EntradaVenda) {
    const r = await lancarVenda(a, entrada, agora);
    if (!r.ok) throw new Error(JSON.stringify(r.erros));
    return r.vendaId;
  }
  const camila = async () => (await a.listarIndicadores()).find((i) => i.nome === "Camila")!;
  const usosCamila5 = async () => (await a.buscarCodigo("camila5"))!.usos;
  const vinculoDe = (telefone: string) => banco.clientes.find((c) => c.telefone === telefone)?.indicadorId;

  it("confirmar conta o uso, entra no resumo e cria o vínculo na primeira vez", async () => {
    const id = await lancar({ ...novo, codigo: "camila5", valor: "110" });
    const [usos, resumo] = [await usosCamila5(), await camila()];
    expect(await confirmarRecebimento(a, id, agora)).toEqual({ ok: true });
    expect(await a.venda(id)).toMatchObject({ status: "confirmada", confirmadaEm: agora });
    expect(await usosCamila5()).toBe(usos + 1);
    expect(await camila()).toMatchObject({
      vendasPagas: resumo.vendasPagas + 1,
      totalVendido: resumo.totalVendido + 10450,
    });
    expect(vinculoDe("5561977771234")).toBe("a-ind-camila");
  });

  it("venda sem código não cria vínculo", async () => {
    const id = await lancar(novo);
    await confirmarRecebimento(a, id, agora);
    expect(vinculoDe("5561977771234")).toBeNull();
  });

  it("vínculo conflitante na confirmação: recusada e continua aguardando (RN6)", async () => {
    // Duas vendas pendentes do cliente novo, uma de cada indicador; confirma a da Camila primeiro.
    const daCamila = await lancar({ ...novo, codigo: "camila5" });
    const daAmanda = await lancar({ ...novo, codigo: "primeiraamanda" });
    await confirmarRecebimento(a, daCamila, agora);
    expect(await confirmarRecebimento(a, daAmanda, agora)).toEqual({
      ok: false,
      erros: {
        geral: "Este cliente já usa os códigos de Camila. Cancele esta venda e lance de novo com um código de Camila.",
      },
    });
    expect((await a.venda(daAmanda))?.status).toBe("pendente");
  });

  it("segunda primeira compra na confirmação: recusada (RN5)", async () => {
    const primeira = await lancar({ ...novo, codigo: "primeiraamanda" });
    const segunda = await lancar({ ...novo, codigo: "primeiraamanda" });
    expect(await confirmarRecebimento(a, primeira, agora)).toEqual({ ok: true });
    const r = await confirmarRecebimento(a, segunda, agora);
    expect(r.ok ? null : r.erros.geral).toMatch(/já tem uma compra paga, então o código primeiraamanda não vale mais/);
  });

  it("não confirma duas vezes nem venda cancelada", async () => {
    const id = await lancar(novo);
    await confirmarRecebimento(a, id, agora);
    expect(await confirmarRecebimento(a, id, agora)).toEqual({ ok: false, erros: { geral: "Esta venda já está paga." } });
    await cancelarVenda(a, id, agora);
    const r = await confirmarRecebimento(a, id, agora);
    expect(r.ok ? null : r.erros.geral).toBe("Esta venda foi cancelada e não pode ser confirmada.");
  });

  it("cancelar pendente: usos e resumo não mudam", async () => {
    const id = await lancar(joao);
    const [usos, resumo] = [await usosCamila5(), await camila()];
    expect(await cancelarVenda(a, id, agora)).toEqual({ ok: true });
    expect(await a.venda(id)).toMatchObject({ status: "cancelada", canceladaEm: agora, confirmadaEm: null });
    expect(await usosCamila5()).toBe(usos);
    expect(await camila()).toEqual(resumo);
  });

  it("cancelar paga: sem bloqueio, deixa de contar uso e sai do resumo; vínculo fica (RN12, RN6)", async () => {
    const [usos, resumo] = [await usosCamila5(), await camila()];
    expect(await cancelarVenda(a, "a-ven-1", agora)).toEqual({ ok: true });
    expect(await a.venda("a-ven-1")).toMatchObject({ status: "cancelada", confirmadaEm: expect.any(Date) });
    expect(await usosCamila5()).toBe(usos - 1);
    expect(await camila()).toMatchObject({
      vendasPagas: resumo.vendasPagas - 1,
      totalVendido: resumo.totalVendido - 10450,
    });
    expect(vinculoDe("5561900000010")).toBe("a-ind-camila");
  });

  it("não cancela duas vezes", async () => {
    expect(await cancelarVenda(a, "a-ven-2", agora)).toEqual({
      ok: false,
      erros: { geral: "Esta venda já foi cancelada." },
    });
  });

  it("venda de outra empresa: não encontrada", async () => {
    expect(await confirmarRecebimento(a, "b-ven-1", agora)).toEqual({ ok: false, erros: { geral: "Venda não encontrada." } });
    expect(await cancelarVenda(a, "b-ven-1", agora)).toEqual({ ok: false, erros: { geral: "Venda não encontrada." } });
  });

  it("limite atingido avisa, mas a 11ª venda é aceita; pendentes não contam (RN3)", async () => {
    // camila5 já tem 2 usos; faz mais 7 → 9 confirmadas, e 5 pendentes.
    for (let i = 0; i < 7; i++) await confirmarRecebimento(a, await lancar(joao), agora);
    for (let i = 0; i < 5; i++) await lancar(joao);
    let r = await previaVenda(a, joao, agora);
    expect(r.ok && r.previa.avisos).toEqual([]);
    await confirmarRecebimento(a, await lancar(joao), agora);
    r = await previaVenda(a, joao, agora);
    expect(r.ok && r.previa.avisos.map((x) => x.mensagem)).toEqual([
      "Este código atingiu 10 usos, considere gerar um novo código para Camila.",
    ]);
    expect((await lancarVenda(a, joao, agora)).ok).toBe(true);
  });
});
