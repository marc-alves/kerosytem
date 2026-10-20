import { validarPrograma, type EntradaPrograma } from "@/lib/fidelidade/programa";

const valido: EntradaPrograma = { meta: "10", premio: " 1 salgado grátis ", valorMinimo: "", diasLiberacao: "7" };

describe("validarPrograma (RF1, spec 10.4)", () => {
  it("aceita e converte; valor mínimo vazio = qualquer valor", () => {
    expect(validarPrograma(valido)).toEqual({
      ok: true,
      programa: { meta: 10, premio: "1 salgado grátis", valorMinimo: null, diasLiberacao: 7 },
    });
  });

  it("valor mínimo em centavos e prazo zero", () => {
    expect(validarPrograma({ ...valido, valorMinimo: "15,50", diasLiberacao: "0" })).toEqual({
      ok: true,
      programa: { meta: 10, premio: "1 salgado grátis", valorMinimo: 1550, diasLiberacao: 0 },
    });
  });

  it.each(["1", "51", "", "10,5", "dez", "-3"])("meta %p recusada", (meta) => {
    expect(validarPrograma({ ...valido, meta })).toEqual({
      ok: false,
      erros: { meta: "O cartão precisa ter de 2 a 50 carimbos." },
    });
  });

  it("limites da meta aceitos", () => {
    expect(validarPrograma({ ...valido, meta: "2" }).ok).toBe(true);
    expect(validarPrograma({ ...valido, meta: "50" }).ok).toBe(true);
  });

  it("prêmio vazio ou longo", () => {
    expect(validarPrograma({ ...valido, premio: "   " })).toEqual({
      ok: false,
      erros: { premio: "Digite o prêmio. Ex.: 1 salgado grátis." },
    });
    expect(validarPrograma({ ...valido, premio: "x".repeat(60) }).ok).toBe(true);
    expect(validarPrograma({ ...valido, premio: "x".repeat(61) })).toEqual({
      ok: false,
      erros: { premio: "O prêmio pode ter até 60 letras." },
    });
  });

  it("valor mínimo inválido", () => {
    expect(validarPrograma({ ...valido, valorMinimo: "0" })).toEqual({
      ok: false,
      erros: { valorMinimo: "Digite um valor. Ex.: 15 ou 15,50." },
    });
  });

  it.each(["91", "", "1,5"])("prazo %p recusado", (diasLiberacao) => {
    expect(validarPrograma({ ...valido, diasLiberacao })).toEqual({
      ok: false,
      erros: { diasLiberacao: "O prazo precisa ser de 0 a 90 dias." },
    });
  });

  it("junta os erros de todos os campos", () => {
    const r = validarPrograma({ meta: "1", premio: "", valorMinimo: "abc", diasLiberacao: "100" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).sort()).toEqual(["diasLiberacao", "meta", "premio", "valorMinimo"]);
  });
});
