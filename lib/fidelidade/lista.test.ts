import { combinaBusca, historicoPublico, ordenarCartoes } from "@/lib/fidelidade/lista";

const cartao = (nome: string, noCartao: number, completo = false) => ({ nome, estado: { noCartao, completo } });

describe("ordenarCartoes (spec 10.1)", () => {
  it("completos primeiro, depois mais carimbos, empate por nome", () => {
    const lista = [cartao("Pedro", 3), cartao("ana", 3), cartao("Bia", 10, true), cartao("Caio", 7), cartao("Davi", 12, true)];
    expect(ordenarCartoes(lista).map((c) => c.nome)).toEqual(["Davi", "Bia", "Caio", "ana", "Pedro"]);
  });
});

describe("historicoPublico (spec 11.1)", () => {
  const d = (dia: number) => new Date(`2026-11-${String(dia).padStart(2, "0")}T12:00:00Z`);

  it("mais novos primeiro, sem retirados nem desfeitos", () => {
    const r = historicoPublico(
      [
        { criadoEm: d(1), retiradoEm: null },
        { criadoEm: d(2), retiradoEm: d(3) },
        { criadoEm: d(4), retiradoEm: null },
      ],
      [
        { criadoEm: d(5), desfeitoEm: null },
        { criadoEm: d(6), desfeitoEm: d(6) },
      ],
    );
    expect(r).toEqual([
      { tipo: "resgate", em: d(5) },
      { tipo: "carimbo", em: d(4) },
      { tipo: "carimbo", em: d(1) },
    ]);
  });
});

describe("combinaBusca", () => {
  const joao = { nome: "João Silva", telefone: "5561900000010" };

  it("nome sem acento nem maiúscula", () => {
    expect(combinaBusca(joao, "joao")).toBe(true);
    expect(combinaBusca(joao, "SILVA")).toBe(true);
    expect(combinaBusca(joao, "maria")).toBe(false);
  });

  it("telefone em qualquer formato, a partir de 3 dígitos", () => {
    expect(combinaBusca(joao, "(61) 90000-0010")).toBe(true);
    expect(combinaBusca(joao, "0010")).toBe(true);
    expect(combinaBusca(joao, "55")).toBe(false);
  });

  it("busca vazia mostra todos", () => {
    expect(combinaBusca(joao, "  ")).toBe(true);
  });
});
