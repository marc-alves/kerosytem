import {
  desfazerResgate,
  gerarNovoLink,
  listarCartoes,
  registrarResgate,
  salvarPrograma,
  verCartaoCliente,
  verCartaoPublico,
} from "@/lib/casos-de-uso/fidelidade";
import { cancelarVenda, confirmarRecebimento, lancarVenda, type FidelidadeNaVenda } from "@/lib/casos-de-uso/vendas";
import { criarRepositorioEmMemoria, criarRepositorioFidelidadeEmMemoria, lerCartaoPublico } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, EMPRESA_B } from "@/lib/dados/semente";
import type { Banco, RepositorioFidelidade, RepositorioIndicacao } from "@/lib/dados/tipos";

// Semente da empresa A: programa de 10 carimbos, prazo de 7 dias; Ana completa e liberada,
// Bia completa a liberar, Carla com resgate, João com 2 carimbos. Empresa B sem programa.
const agora = new Date("2026-10-20T15:00:00Z");
let banco: Banco;
let a: RepositorioFidelidade;
let b: RepositorioFidelidade;
let vendasA: RepositorioIndicacao;
let vendasB: RepositorioIndicacao;
let fidA: FidelidadeNaVenda;

beforeEach(() => {
  banco = criarSemente(agora);
  a = criarRepositorioFidelidadeEmMemoria(banco, EMPRESA_A);
  b = criarRepositorioFidelidadeEmMemoria(banco, EMPRESA_B);
  vendasA = criarRepositorioEmMemoria(banco, EMPRESA_A);
  vendasB = criarRepositorioEmMemoria(banco, EMPRESA_B);
  fidA = { repo: a, empresaNome: "Lanchonete da Maria", link: (c) => `https://kero.app/cartao/${c}`, gerarChave: () => "chave-nova" };
});

/** Lança e devolve o id de uma venda sem código, agora. */
async function lancar(repo: RepositorioIndicacao, telefone: string, valor: string, nome = "") {
  const r = await lancarVenda(repo, { telefone, nome, codigo: "", valor }, agora);
  if (!r.ok) throw new Error(JSON.stringify(r.erros));
  return r.vendaId;
}

const entrada = { meta: "10", premio: "1 pastel", valorMinimo: "15", diasLiberacao: "7" };

describe("salvarPrograma (RF1, RF2, spec 10.4)", () => {
  it("cria na primeira vez", async () => {
    const r = await salvarPrograma(b, entrada, agora);
    expect(r).toMatchObject({ ok: true, criado: true, programa: { meta: 10, premio: "1 pastel", valorMinimo: 1500, diasLiberacao: 7 } });
  });

  it("ajusta o que existe, mantendo a data de criação", async () => {
    const antes = (await a.programa())!.criadoEm;
    const r = await salvarPrograma(a, { ...entrada, meta: "8" }, agora);
    expect(r).toMatchObject({ ok: true, criado: false, programa: { meta: 8, criadoEm: antes } });
  });

  it("recusa com as mensagens da spec, sem gravar", async () => {
    expect(await salvarPrograma(b, { ...entrada, meta: "1" }, agora)).toEqual({
      ok: false,
      erros: { meta: "O cartão precisa ter de 2 a 50 carimbos." },
    });
    expect(await b.programa()).toBeNull();
  });
});

describe("carimbo na confirmação (RF3, RF4, spec 10.3)", () => {
  it("João (2 carimbos) confirma a venda pendente: 3 de 10, libera em 7 dias, mensagem pronta", async () => {
    const r = await confirmarRecebimento(vendasA, "a-ven-5", agora, fidA);
    expect(r).toEqual({
      ok: true,
      carimbo: {
        clienteId: "a-cli-joao",
        nome: "João",
        exibido: 3,
        meta: 10,
        completo: false,
        mensagem:
          "*João*, sua compra na Lanchonete da Maria valeu 1 carimbo!\n" +
          "Você tem 3 de 10. Faltam 7 para ganhar *1 salgado grátis*.\n" +
          "Veja seu cartão: https://kero.app/cartao/teste-joao",
      },
    });
    const carimbo = await a.carimboDaVenda("a-ven-5");
    // Confirmada em 20/10 (Brasília): libera às 00h00 de 27/10.
    expect(carimbo?.liberadoEm.toISOString()).toBe("2026-10-27T03:00:00.000Z");
  });

  it("cliente novo ganha o primeiro carimbo e o cartão com chave nova", async () => {
    const id = await lancar(vendasA, "(61) 97777-1234", "50", "Lucas");
    const r = await confirmarRecebimento(vendasA, id, agora, fidA);
    expect(r.ok && r.carimbo).toMatchObject({ nome: "Lucas", exibido: 1 });
    expect(r.ok && r.carimbo?.mensagem).toContain("https://kero.app/cartao/chave-nova");
  });

  it("completar o cartão: mensagem de cartão completo", async () => {
    const id = await lancar(vendasA, "(61) 90000-0014", "30");
    for (let i = 0; i < 7; i++) await confirmarRecebimento(vendasA, await lancar(vendasA, "(61) 90000-0014", "30"), agora, fidA);
    const r = await confirmarRecebimento(vendasA, id, agora, fidA);
    expect(r.ok && r.carimbo).toMatchObject({ nome: "Carla", exibido: 10, completo: true });
    expect(r.ok && r.carimbo?.mensagem).toContain("está completo!");
  });

  it("sem a fidelidade ativa (null), sem programa ou abaixo do mínimo: sem carimbo", async () => {
    expect(await confirmarRecebimento(vendasA, "a-ven-5", agora, null)).toEqual({ ok: true, carimbo: null });
    expect(await a.carimboDaVenda("a-ven-5")).toBeNull();

    const semPrograma = { ...fidA, repo: b };
    expect(await confirmarRecebimento(vendasB, "b-ven-1", agora, semPrograma)).toEqual({ ok: true, carimbo: null });

    await salvarPrograma(a, { meta: "10", premio: "1 salgado grátis", valorMinimo: "15", diasLiberacao: "7" }, agora);
    const id = await lancar(vendasA, "(61) 90000-0010", "12");
    expect(await confirmarRecebimento(vendasA, id, agora, fidA)).toEqual({ ok: true, carimbo: null });
  });

  it("venda lançada antes do programa não dá carimbo", async () => {
    // b-ven-1 foi lançada 1 hora antes; o programa da B nasce agora.
    await salvarPrograma(b, { meta: "10", premio: "1 pastel", valorMinimo: "", diasLiberacao: "0" }, agora);
    expect(await confirmarRecebimento(vendasB, "b-ven-1", agora, { ...fidA, repo: b })).toEqual({ ok: true, carimbo: null });
  });

  it("prazo 0: o carimbo já nasce liberado", async () => {
    await salvarPrograma(a, { meta: "10", premio: "1 salgado grátis", valorMinimo: "", diasLiberacao: "0" }, agora);
    await confirmarRecebimento(vendasA, "a-ven-5", agora, fidA);
    expect((await a.carimboDaVenda("a-ven-5"))?.liberadoEm).toEqual(agora);
  });
});

describe("cancelamento com fidelidade (RF5, spec 10.3)", () => {
  it("venda com carimbo não usado: cancela e retira o carimbo", async () => {
    expect(await cancelarVenda(vendasA, "a-ven-3", agora, a)).toEqual({ ok: true });
    expect((await a.carimboDaVenda("a-ven-3"))?.retiradoEm).toEqual(agora);
  });

  it("venda usada no resgate da Carla: recusada, com o cliente para o link", async () => {
    expect(await cancelarVenda(vendasA, "a-ven-carla-1", agora, a)).toEqual({
      ok: false,
      erros: { geral: "Esta venda já entrou no prêmio que Carla resgatou. Para cancelar, desfaça o resgate no cartão de Carla." },
      cartaoClienteId: "a-cli-carla",
    });
    expect(banco.vendas.find((v) => v.id === "a-ven-carla-1")?.status).toBe("confirmada");
  });

  it("venda da Carla fora do resgate pode ser cancelada", async () => {
    expect(await cancelarVenda(vendasA, "a-ven-carla-12", agora, a)).toEqual({ ok: true });
  });
});

describe("resgate (RF6, RF7, spec 10.2)", () => {
  it("Ana, completa e liberada: resgata e volta a 0", async () => {
    expect(await registrarResgate(a, "a-cli-ana", agora)).toEqual({ ok: true, premio: "1 salgado grátis" });
    const cartao = (await a.cartaoCliente("a-cli-ana"))!;
    expect(cartao.carimbos.filter((c) => c.resgateId === null)).toHaveLength(0);
    expect(cartao.resgates).toHaveLength(1);
  });

  it("Bia, completa a liberar: recusado, nada registrado", async () => {
    expect(await registrarResgate(a, "a-cli-bia", agora)).toEqual({
      ok: false,
      erros: { geral: "O cartão de Bia não tem mais carimbos liberados suficientes. Nada foi registrado." },
    });
    expect((await a.cartaoCliente("a-cli-bia"))!.resgates).toHaveLength(0);
  });

  it("desfazer devolve os carimbos; desfazer de novo é recusado", async () => {
    expect(await desfazerResgate(a, { clienteId: "a-cli-carla", resgateId: "a-res-carla-1" }, agora)).toEqual({ ok: true });
    const cartao = (await a.cartaoCliente("a-cli-carla"))!;
    expect(cartao.carimbos.every((c) => c.resgateId === null)).toBe(true);
    expect(await desfazerResgate(a, { clienteId: "a-cli-carla", resgateId: "a-res-carla-1" }, agora)).toEqual({
      ok: false,
      erros: { geral: "Este resgate já foi desfeito." },
    });
  });

  it("outra empresa não registra nem desfaz", async () => {
    expect((await registrarResgate(b, "a-cli-ana", agora)).ok).toBe(false);
    expect((await desfazerResgate(b, { clienteId: "a-cli-carla", resgateId: "a-res-carla-1" }, agora)).ok).toBe(false);
  });
});

describe("gerarNovoLink (RF8)", () => {
  it("troca a chave: a antiga para de funcionar", async () => {
    expect(await gerarNovoLink(a, "a-cli-joao", agora, () => "chave-trocada")).toEqual({ ok: true });
    expect(lerCartaoPublico(banco, "teste-joao")).toBeNull();
    expect(lerCartaoPublico(banco, "chave-trocada")?.clienteNome).toBe("João");
  });

  it("cliente sem cartão ou de outra empresa", async () => {
    expect(await gerarNovoLink(b, "a-cli-joao", agora, () => "x")).toEqual({ ok: false, erros: { geral: "Cartão não encontrado." } });
  });
});

describe("leituras (spec 10.1, 10.2, 11.1)", () => {
  const contexto = { empresaNome: "Lanchonete da Maria", link: (c: string) => `https://kero.app/cartao/${c}` };

  it("lista: completos primeiro, depois por carimbos; busca por nome ou telefone", async () => {
    const r = await listarCartoes(a, "", agora);
    expect(r.cartoes.map((c) => c.cliente.nome)).toEqual(["Ana Souza", "Bia", "Carla", "João", "Pedro"]);
    expect(r.total).toBe(5);
    expect((await listarCartoes(a, "joao", agora)).cartoes.map((c) => c.cliente.nome)).toEqual(["João"]);
    expect((await listarCartoes(a, "90000-0013", agora)).cartoes.map((c) => c.cliente.nome)).toEqual(["Bia"]);
    expect(await listarCartoes(b, "", agora)).toEqual({ programa: null, total: 0, cartoes: [] });
  });

  it("cartão da Carla: histórico com resgate, resgate desfeito e carimbos", async () => {
    const r = (await verCartaoCliente(a, "a-cli-carla", agora, contexto))!;
    expect(r.estado).toMatchObject({ noCartao: 2, meta: 10 });
    expect(r.link).toBe("https://kero.app/cartao/teste-carla");
    expect(r.mensagem).toBe("*Carla*, este é o seu cartão fidelidade da Lanchonete da Maria:\nhttps://kero.app/cartao/teste-carla");
    const resgates = r.historico.filter((h) => h.tipo === "resgate");
    expect(resgates.map((h) => h.id)).toEqual(["a-res-carla-1", "a-res-carla-0"]);
    expect(r.historico.filter((h) => h.tipo === "carimbo")).toHaveLength(12);
    // Mais novos primeiro.
    expect([...r.historico].sort((x, y) => y.em.getTime() - x.em.getTime())).toEqual(r.historico);
  });

  it("cartão de cliente de outra empresa ou sem cartão: null", async () => {
    expect(await verCartaoCliente(b, "a-cli-carla", agora, contexto)).toBeNull();
    expect(await verCartaoCliente(a, "nao-existe", agora, contexto)).toBeNull();
  });

  it("venda listada diz se deu carimbo e se ele entrou num resgate", async () => {
    expect((await vendasA.venda("a-ven-carla-1"))?.carimbo).toEqual({ usadoEmResgate: true, retirado: false });
    expect((await vendasA.venda("a-ven-carla-12"))?.carimbo).toEqual({ usadoEmResgate: false, retirado: false });
    expect((await vendasA.venda("a-ven-5"))?.carimbo).toBeNull();
  });

  it("página do cliente: primeiro nome, sem desfeitos nem valores", () => {
    const r = verCartaoPublico(lerCartaoPublico(banco, "teste-ana"), agora)!;
    expect(r).toMatchObject({ empresaNome: "Lanchonete da Maria", primeiroNome: "Ana", premio: "1 salgado grátis", valorMinimo: null });
    expect(r.estado).toMatchObject({ completo: true, podeResgatar: true });
    expect(r.historico).toHaveLength(10);
    const carla = verCartaoPublico(lerCartaoPublico(banco, "teste-carla"), agora)!;
    expect(carla.historico.filter((h) => h.tipo === "resgate")).toHaveLength(1);
    expect(verCartaoPublico(lerCartaoPublico(banco, "abc"), agora)).toBeNull();
  });
});
