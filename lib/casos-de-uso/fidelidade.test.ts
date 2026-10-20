import { salvarPrograma } from "@/lib/casos-de-uso/fidelidade";
import { criarRepositorioFidelidadeEmMemoria } from "@/lib/dados/memoria";
import { criarSemente, EMPRESA_A, EMPRESA_B } from "@/lib/dados/semente";
import type { Banco, RepositorioFidelidade } from "@/lib/dados/tipos";

// Semente da empresa A: programa de 10 carimbos, prazo de 7 dias; Ana completa e liberada,
// Bia completa a liberar, Carla com resgate, João com 2 carimbos. Empresa B sem programa.
const agora = new Date("2026-10-20T15:00:00Z");
let banco: Banco;
let a: RepositorioFidelidade;
let b: RepositorioFidelidade;

beforeEach(() => {
  banco = criarSemente(agora);
  a = criarRepositorioFidelidadeEmMemoria(banco, EMPRESA_A);
  b = criarRepositorioFidelidadeEmMemoria(banco, EMPRESA_B);
});

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
