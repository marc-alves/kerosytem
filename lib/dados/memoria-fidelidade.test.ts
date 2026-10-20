import { gerarChaveCartao } from "@/lib/dados/chave";
import { criarRepositorioEmMemoria, criarRepositorioFidelidadeEmMemoria, lerCartaoPublico } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, EMPRESA_B } from "@/lib/dados/semente";
import type { Banco } from "@/lib/dados/tipos";

const agora = new Date("2026-10-20T15:00:00Z");
const depois = new Date("2026-10-21T15:00:00Z");
let banco: Banco;
let n: number;
const gerarId = () => `id-${++n}`;
const vendas = (empresaId: string) => criarRepositorioEmMemoria(banco, empresaId, gerarId);
const fid = (empresaId: string) => criarRepositorioFidelidadeEmMemoria(banco, empresaId, gerarId);
const programa = { meta: 2, premio: "1 salgado grátis", valorMinimo: null, diasLiberacao: 0 };

beforeEach(async () => {
  // Sem a fidelidade da semente: cada teste monta o que precisa.
  banco = { ...criarSemente(agora), programas: [], carimbos: [], resgates: [], cartoes: [] };
  n = 0;
  await fid(EMPRESA_A).salvarPrograma(programa, agora);
  // a-ven-5: João, pendente na semente.
  await vendas(EMPRESA_A).confirmarVenda("a-ven-5", null, agora, { valorMinimoAplicado: null, liberadoEm: agora, chave: "chave-joao" });
});

describe("gerarChaveCartao (RF8)", () => {
  it("43 caracteres base64url, diferentes a cada vez", () => {
    const a = gerarChaveCartao();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(gerarChaveCartao()).not.toBe(a);
  });
});

describe("repositório da fidelidade em memória", () => {
  it("confirmar com carimbo grava o carimbo e cria o cartão uma vez só", async () => {
    const cartao = await fid(EMPRESA_A).cartaoCliente("a-cli-joao");
    expect(cartao?.chave).toBe("chave-joao");
    expect(cartao?.carimbos).toHaveLength(1);
    expect(cartao?.carimbos[0]).toMatchObject({ vendaId: "a-ven-5", venda: { valorFinal: 10450, canceladaEm: null } });
  });

  it("salvar de novo atualiza o mesmo programa", async () => {
    const p = await fid(EMPRESA_A).salvarPrograma({ ...programa, meta: 8 }, depois);
    expect(p).toMatchObject({ meta: 8, criadoEm: agora, atualizadoEm: depois });
    expect(banco.programas).toHaveLength(1);
  });

  it("resgate liga os carimbos; desfazer solta", async () => {
    const outro = await vendas(EMPRESA_A).inserirVenda(
      { clienteId: "a-cli-joao", codigoId: null, calculo: { valorOriginal: 100, descontoBp: 0, valorDesconto: 0, valorFinal: 100 } },
      agora,
    );
    await vendas(EMPRESA_A).confirmarVenda(outro.id, null, agora, { valorMinimoAplicado: null, liberadoEm: agora, chave: "x" });
    const ids = (await fid(EMPRESA_A).cartaoCliente("a-cli-joao"))!.carimbos.map((c) => c.id);
    const r = await fid(EMPRESA_A).inserirResgate({ clienteId: "a-cli-joao", meta: 2, premio: "1 salgado grátis", carimboIds: ids }, agora);
    expect(banco.carimbos.every((c) => c.resgateId === r.id)).toBe(true);
    // Venda usada no resgate não é cancelada.
    await expect(vendas(EMPRESA_A).cancelarVenda("a-ven-5", agora)).rejects.toThrow();
    await fid(EMPRESA_A).desfazerResgate(r.id, depois);
    expect(banco.carimbos.every((c) => c.resgateId === null)).toBe(true);
    await expect(fid(EMPRESA_A).desfazerResgate(r.id, depois)).rejects.toThrow();
  });

  it("cancelar a venda retira o carimbo", async () => {
    await vendas(EMPRESA_A).cancelarVenda("a-ven-5", depois);
    expect(banco.carimbos[0].retiradoEm).toEqual(depois);
  });

  it("isolamento: a outra empresa não vê nem mexe", async () => {
    const b = fid(EMPRESA_B);
    expect(await b.programa()).toBeNull();
    expect(await b.listarCartoes()).toEqual([]);
    expect(await b.cartaoCliente("a-cli-joao")).toBeNull();
    expect(await b.carimboDaVenda("a-ven-5")).toBeNull();
    await expect(b.trocarChave("a-cli-joao", "outra", agora)).rejects.toThrow();
    await expect(
      b.inserirResgate({ clienteId: "a-cli-joao", meta: 1, premio: "x", carimboIds: [banco.carimbos[0].id] }, agora),
    ).rejects.toThrow();
  });
});

describe("lerCartaoPublico (RF9)", () => {
  it("só os campos permitidos", () => {
    const r = lerCartaoPublico(banco, "chave-joao");
    expect(r).toEqual({
      empresaNome: "Lanchonete da Maria",
      clienteNome: "João",
      programa: { meta: 2, premio: "1 salgado grátis", valorMinimo: null },
      carimbos: [{ id: banco.carimbos[0].id, criadoEm: agora, liberadoEm: agora, resgateId: null, retiradoEm: null }],
      resgates: [],
    });
    expect(JSON.stringify(r)).not.toContain("5561");
  });

  it("chave trocada, inventada ou módulo desligado: nada", async () => {
    expect(lerCartaoPublico(banco, "abc")).toBeNull();
    await fid(EMPRESA_A).trocarChave("a-cli-joao", "nova", agora);
    expect(lerCartaoPublico(banco, "chave-joao")).toBeNull();
    expect(lerCartaoPublico(banco, "nova")).not.toBeNull();
    banco.empresas[0].modulosAtivos = ["indicacao"];
    expect(lerCartaoPublico(banco, "nova")).toBeNull();
  });
});

describe("semente da fidelidade (F11)", () => {
  it("um cliente em cada situação do cartão", async () => {
    const { estadoCartao } = await import("@/lib/fidelidade/cartao");
    const semente = criarSemente(agora);
    const repo = criarRepositorioFidelidadeEmMemoria(semente, EMPRESA_A);
    const estado = async (id: string) =>
      estadoCartao({ carimbos: (await repo.cartaoCliente(id))!.carimbos, meta: 10, agora });
    expect(await estado("a-cli-ana")).toMatchObject({ completo: true, podeResgatar: true });
    expect(await estado("a-cli-bia")).toMatchObject({ completo: true, podeResgatar: false, aLiberar: 4 });
    expect(await estado("a-cli-carla")).toMatchObject({ noCartao: 2, completo: false });
    expect(await estado("a-cli-joao")).toMatchObject({ noCartao: 2, liberados: 1 });
    expect(await criarRepositorioFidelidadeEmMemoria(semente, EMPRESA_B).programa()).toBeNull();
  });
});
