import { normalizarTelefone } from "@/lib/indicacao/telefone";

describe("normalizarTelefone (RN4)", () => {
  it("Telefone em outro formato: 61 99999-9999 e +55 (61) 99999-9999 são o mesmo cliente", () => {
    const a = normalizarTelefone("61 99999-9999");
    const b = normalizarTelefone("+55 (61) 99999-9999");
    expect(a).toEqual({ ok: true, telefone: "5561999999999" });
    expect(b).toEqual(a);
  });

  it("acrescenta o DDI 55 quando ausente (fixo, 10 dígitos → 12)", () => {
    expect(normalizarTelefone("(61) 3333-4444")).toEqual({ ok: true, telefone: "556133334444" });
  });

  it("mantém o número que já tem DDI 55 (12 ou 13 dígitos)", () => {
    expect(normalizarTelefone("556133334444")).toEqual({ ok: true, telefone: "556133334444" });
    expect(normalizarTelefone("5561999999999")).toEqual({ ok: true, telefone: "5561999999999" });
  });

  it("DDD 55 sem DDI recebe o DDI normalmente", () => {
    expect(normalizarTelefone("(55) 99999-9999")).toEqual({ ok: true, telefone: "5555999999999" });
  });

  it("Telefone inválido: 1234 é recusado com mensagem clara", () => {
    const r = normalizarTelefone("1234");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe("telefone_invalido");
    expect(r.mensagem).toBe("O telefone precisa ter DDD e número. Ex.: (61) 99999-9999.");
  });

  it("recusa 12 ou 13 dígitos sem o DDI 55 e número longo demais", () => {
    expect(normalizarTelefone("446133334444").ok).toBe(false);
    expect(normalizarTelefone("55619999999999").ok).toBe(false);
  });

  it("recusa campo vazio pedindo o telefone", () => {
    expect(normalizarTelefone("  ")).toEqual({
      ok: false,
      motivo: "telefone_vazio",
      mensagem: "Digite o telefone com DDD. Ex.: (61) 99999-9999.",
    });
  });
});
