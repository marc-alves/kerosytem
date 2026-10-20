import {
  cadastrarIndicador,
  conferirPasso1Codigo,
  criarCodigo,
  definirCodigoAtivo,
} from "@/lib/casos-de-uso/indicadores";
import { criarRepositorioEmMemoria } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, EMPRESA_B } from "@/lib/dados/semente";
import type { RepositorioIndicacao } from "@/lib/dados/tipos";

const agora = new Date("2026-10-20T15:00:00Z");
let banco: ReturnType<typeof criarSemente>;
let a: RepositorioIndicacao;

beforeEach(() => {
  banco = criarSemente(agora);
  a = criarRepositorioEmMemoria(banco, EMPRESA_A);
});

describe("cadastrarIndicador (spec 10.2)", () => {
  it("cadastra com telefone normalizado e nome sem espaços nas pontas", async () => {
    const r = await cadastrarIndicador(a, { nome: " Bruna ", telefone: "(61) 98888-7777" }, agora);
    expect(r).toMatchObject({ ok: true, nome: "Bruna" });
    expect((await a.listarIndicadores()).find((i) => i.nome === "Bruna")?.telefone).toBe("5561988887777");
  });

  it("mostra os erros de nome e telefone juntos", async () => {
    expect(await cadastrarIndicador(a, { nome: "  ", telefone: "1234" }, agora)).toEqual({
      ok: false,
      erros: {
        nome: "Digite o nome do indicador.",
        telefone: "O telefone precisa ter DDD e número. Ex.: (61) 99999-9999.",
      },
    });
  });

  it("recusa telefone de outro indicador da empresa, em qualquer formato", async () => {
    expect(await cadastrarIndicador(a, { nome: "Outra", telefone: "+55 (61) 90000-0001" }, agora)).toEqual({
      ok: false,
      erros: { telefone: "Este telefone já é de outro indicador." },
    });
  });

  it("aceita telefone que só existe em outra empresa", async () => {
    const b = criarRepositorioEmMemoria(banco, EMPRESA_B);
    expect((await cadastrarIndicador(b, { nome: "Amanda", telefone: "61 90000-0002" }, agora)).ok).toBe(true);
  });
});

describe("criarCodigo (spec 10.4, RN1)", () => {
  const valido = {
    indicadorId: "a-ind-amanda",
    codigo: " Amanda 7 ",
    tipo: "normal",
    desconto: "7,5",
    validoAte: null,
    limite: "10",
  };

  it("guarda em minúsculas, sem espaços, com o desconto em centésimos", async () => {
    expect(await criarCodigo(a, valido, agora)).toEqual({ ok: true, codigo: "amanda7" });
    expect(await a.buscarCodigo("amanda7")).toMatchObject({
      descontoBp: 750,
      tipo: "normal",
      validoAte: null,
      limiteUsos: 10,
      ativo: true,
      indicadorNome: "Amanda",
    });
  });

  it("código duplicado na empresa, mesmo com maiúsculas: recusado", async () => {
    expect(await conferirPasso1Codigo(a, { codigo: "Camila5", desconto: "5" })).toEqual({
      ok: false,
      erros: { codigo: "Este código já existe. Escolha outro." },
    });
  });

  it("mesmo código em outra empresa: aceito", async () => {
    const b = criarRepositorioEmMemoria(banco, EMPRESA_B);
    const r = await criarCodigo(b, { ...valido, indicadorId: "b-ind-camila", codigo: "primeiraamanda" }, agora);
    expect(r.ok).toBe(true);
  });

  it.each([
    [{ codigo: "  " }, { codigo: "Digite o código." }],
    [{ desconto: "101" }, { desconto: "O desconto precisa ser de 0% a 100%." }],
    [{ validoAte: "2026-10-19" }, { validade: "Escolha uma data de hoje em diante." }],
    [{ validoAte: "2026-02-30" }, { validade: "Escolha uma data de hoje em diante." }],
    [{ limite: "0" }, { limite: "O limite precisa ser de pelo menos 1 uso." }],
    [{ limite: "" }, { limite: "O limite precisa ser de pelo menos 1 uso." }],
    [{ limite: "2,5" }, { limite: "O limite precisa ser de pelo menos 1 uso." }],
    [{ tipo: "outro" }, { tipo: "Escolha o tipo do código." }],
  ])("recusa %o", async (mudanca, erros) => {
    expect(await criarCodigo(a, { ...valido, ...mudanca }, agora)).toEqual({ ok: false, erros });
  });

  it("validade de hoje é aceita (vale até 23h59 de Brasília)", async () => {
    expect((await criarCodigo(a, { ...valido, validoAte: "2026-10-20" }, agora)).ok).toBe(true);
  });

  it("indicador de outra empresa: não encontrado", async () => {
    expect(await criarCodigo(a, { ...valido, indicadorId: "b-ind-camila" }, agora)).toEqual({
      ok: false,
      erros: { geral: "Indicador não encontrado." },
    });
  });
});

describe("definirCodigoAtivo (RN2)", () => {
  it("desativa e reativa sem mudar vendas antigas", async () => {
    const antes = await a.detalheIndicador("a-ind-camila");
    expect(await definirCodigoAtivo(a, { codigoId: "a-cod-camila5", ativo: false })).toEqual({ ok: true });
    const depois = (await a.detalheIndicador("a-ind-camila"))!;
    expect(depois.codigos.find((c) => c.codigo === "camila5")?.ativo).toBe(false);
    expect(depois.vendas).toEqual(antes!.vendas);
    expect(depois.indicador.totalVendido).toBe(antes!.indicador.totalVendido);
    expect(await definirCodigoAtivo(a, { codigoId: "a-cod-camila5", ativo: true })).toEqual({ ok: true });
  });

  it("código de outra empresa: não encontrado", async () => {
    expect(await definirCodigoAtivo(a, { codigoId: "b-cod-camila5", ativo: false })).toEqual({
      ok: false,
      erros: { geral: "Código não encontrado." },
    });
  });
});
