import { criarRepositorioEmMemoria } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, EMPRESA_B } from "@/lib/dados/semente";
import { ViolacaoUnicidade, type Banco } from "@/lib/dados/tipos";

const agora = new Date("2026-10-20T15:00:00Z");
let banco: Banco;
let n: number;
const repo = (empresaId: string) => criarRepositorioEmMemoria(banco, empresaId, () => `id-${++n}`);

beforeEach(() => {
  banco = criarSemente(agora);
  n = 0;
});

describe("isolamento entre empresas (spec 000, seção 10)", () => {
  it("cada empresa só lê os próprios dados", async () => {
    const a = repo(EMPRESA_A);
    const b = repo(EMPRESA_B);
    expect((await a.listarIndicadores()).map((i) => i.id)).toEqual(["a-ind-amanda", "a-ind-camila"]);
    expect((await b.listarIndicadores()).map((i) => i.id)).toEqual(["b-ind-camila"]);
    expect(await b.detalheIndicador("a-ind-camila")).toBeNull();
    expect(await b.venda("a-ven-1")).toBeNull();
    expect((await b.listarVendas({ indicador: "todos", desde: null, situacao: "todas" })).map((v) => v.id)).toEqual([
      "b-ven-1",
    ]);
  });

  it("mesmo código e mesmo telefone em empresas diferentes são independentes", async () => {
    const a = repo(EMPRESA_A);
    const b = repo(EMPRESA_B);
    expect((await a.buscarCodigo("camila5"))?.descontoBp).toBe(500);
    expect((await b.buscarCodigo("camila5"))?.descontoBp).toBe(1000);
    expect((await a.buscarCliente("5561900000010")).cliente?.id).toBe("a-cli-joao");
    expect((await b.buscarCliente("5561900000010")).cliente?.id).toBe("b-cli-joao");
  });

  it("código só existente em outra empresa não é encontrado", async () => {
    expect(await repo(EMPRESA_B).buscarCodigo("primeiraamanda")).toBeNull();
  });

  it("não altera dados de outra empresa", async () => {
    const b = repo(EMPRESA_B);
    expect(await b.definirCodigoAtivo("a-cod-camila5", false)).toBe(false);
    await expect(b.confirmarVenda("a-ven-5", null, agora)).rejects.toThrow();
    await expect(b.cancelarVenda("a-ven-5", agora)).rejects.toThrow();
    await expect(
      b.inserirCodigo(
        { codigo: "novo", indicadorId: "a-ind-camila", tipo: "normal", descontoBp: 0, validoAte: null, limiteUsos: 10 },
        agora,
      ),
    ).rejects.toThrow();
    expect(banco.vendas.find((v) => v.id === "a-ven-5")?.status).toBe("pendente");
  });

  it("unicidade vale dentro da empresa", async () => {
    const b = repo(EMPRESA_B);
    // Telefone da Camila da empresa A: livre na B.
    await expect(b.inserirIndicador({ nome: "Outra", telefone: "5561900000001" }, agora)).resolves.toBeDefined();
    await expect(b.inserirIndicador({ nome: "Repetida", telefone: "5561900000021" }, agora)).rejects.toEqual(
      new ViolacaoUnicidade("telefone"),
    );
    await expect(
      b.inserirCodigo(
        { codigo: "camila5", indicadorId: "b-ind-camila", tipo: "normal", descontoBp: 0, validoAte: null, limiteUsos: 10 },
        agora,
      ),
    ).rejects.toEqual(new ViolacaoUnicidade("codigo"));
    await expect(b.inserirCliente({ nome: "João de novo", telefone: "5561900000010" }, agora)).rejects.toEqual(
      new ViolacaoUnicidade("telefone"),
    );
  });
});

describe("leituras (T39)", () => {
  it("resumo do indicador conta só vendas confirmadas com os códigos dele (spec 10.2)", async () => {
    const [amanda, camila] = await repo(EMPRESA_A).listarIndicadores();
    expect(amanda).toMatchObject({ nome: "Amanda", codigosAtivos: 1, vendasPagas: 0, totalVendido: 0 });
    // a-ven-1 (110,00 - 5%) + a-ven-3 (80,00 - 5%); a pendente e a cancelada não contam.
    expect(camila).toMatchObject({ nome: "Camila", codigosAtivos: 1, vendasPagas: 2, totalVendido: 10450 + 7600 });
  });

  it("detalhe: códigos ativos primeiro e vendas aguardando primeiro, sem canceladas (spec 10.3)", async () => {
    const detalhe = (await repo(EMPRESA_A).detalheIndicador("a-ind-camila"))!;
    expect(detalhe.codigos.map((c) => [c.codigo, c.usos])).toEqual([
      ["camila5", 2],
      ["camila10", 0],
    ]);
    expect(detalhe.vendas.map((v) => [v.id, v.status])).toEqual([
      ["a-ven-5", "pendente"],
      ["a-ven-3", "confirmada"],
      ["a-ven-1", "confirmada"],
    ]);
    expect(detalhe.vendas[0].codigo).toMatchObject({ codigo: "camila5", indicadorNome: "Camila" });
  });

  it("cliente com histórico para validar o código", async () => {
    const a = repo(EMPRESA_A);
    expect(await a.buscarCliente("5561900000010")).toEqual({
      cliente: { id: "a-cli-joao", nome: "João" },
      paraValidar: {
        telefone: "5561900000010",
        vinculo: { indicadorId: "a-ind-camila", indicadorNome: "Camila" },
        temVendaConfirmada: true,
        temVendaPendente: true,
      },
    });
    expect((await a.buscarCliente("5561988887777")).cliente).toBeNull();
  });

  it("filtra vendas por indicador, período e situação, mais novas primeiro (spec 10.7)", async () => {
    const a = repo(EMPRESA_A);
    const ids = async (filtro: Parameters<typeof a.listarVendas>[0]) => (await a.listarVendas(filtro)).map((v) => v.id);
    expect(await ids({ indicador: "todos", desde: null, situacao: "todas" })).toEqual([
      "a-ven-5",
      "a-ven-4",
      "a-ven-3",
      "a-ven-2",
      "a-ven-1",
    ]);
    expect(await ids({ indicador: "sem_codigo", desde: null, situacao: "todas" })).toEqual(["a-ven-4"]);
    expect(await ids({ indicador: "a-ind-camila", desde: null, situacao: "cancelada" })).toEqual(["a-ven-2"]);
    expect(await ids({ indicador: "a-ind-amanda", desde: null, situacao: "todas" })).toEqual([]);
    // 7 dias a partir de 14/10: fica de fora o que tem 9 e 10 dias.
    expect(await ids({ indicador: "todos", desde: "2026-10-14", situacao: "todas" })).toEqual([
      "a-ven-5",
      "a-ven-4",
      "a-ven-3",
    ]);
  });

  it("confirmar cria o vínculo só se ainda não existe", async () => {
    const a = repo(EMPRESA_A);
    const venda = await a.inserirVenda(
      { clienteId: "a-cli-joao", codigoId: "a-cod-primeiraamanda", calculo: { valorOriginal: 100, descontoBp: 0, valorDesconto: 0, valorFinal: 100 } },
      agora,
    );
    await a.confirmarVenda(venda.id, "a-ind-amanda", agora);
    expect(banco.clientes.find((c) => c.id === "a-cli-joao")?.indicadorId).toBe("a-ind-camila");
    expect(await a.venda(venda.id)).toMatchObject({ status: "confirmada", confirmadaEm: agora });
  });
});
