import { buscarClientePorTelefone, lancarVenda, previaVenda, type EntradaVenda } from "@/lib/casos-de-uso/vendas";
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
