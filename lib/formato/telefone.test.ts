import { formatarTelefone, mascararTelefone } from "@/lib/formato/telefone";
import { normalizarTelefone } from "@/lib/indicacao/telefone";

describe("mascararTelefone", () => {
  it("formata celular enquanto digita", () => {
    const digitado = "61999999999";
    const passos = [...digitado].map((_, i) => mascararTelefone(digitado.slice(0, i + 1)));
    expect(passos).toEqual([
      "(6",
      "(61",
      "(61) 9",
      "(61) 99",
      "(61) 999",
      "(61) 9999",
      "(61) 9999-9",
      "(61) 9999-99",
      "(61) 9999-999",
      "(61) 9999-9999",
      "(61) 99999-9999",
    ]);
  });

  it("formata telefone fixo", () => {
    expect(mascararTelefone("6133334444")).toBe("(61) 3333-4444");
  });

  it("refaz a máscara a partir do que já está formatado", () => {
    expect(mascararTelefone("(61) 9999-99999")).toBe("(61) 99999-9999");
    expect(mascararTelefone("61 99999-9999")).toBe("(61) 99999-9999");
  });

  it("mostra o DDI quando a pessoa digita com +55", () => {
    expect(mascararTelefone("+55 61 99999-9999")).toBe("+55 (61) 99999-9999");
    expect(mascararTelefone("556133334444")).toBe("+55 (61) 3333-4444");
  });

  it("ignora letras e para em 13 dígitos", () => {
    expect(mascararTelefone("abc")).toBe("");
    expect(mascararTelefone("55619999999991234")).toBe("+55 (61) 99999-9999");
  });

  it("o texto mascarado normaliza para o mesmo telefone", () => {
    expect(normalizarTelefone(mascararTelefone("61999999999"))).toEqual({ ok: true, telefone: "5561999999999" });
  });
});

describe("formatarTelefone", () => {
  it("exibe o telefone gravado sem o DDI", () => {
    expect(formatarTelefone("5561999999999")).toBe("(61) 99999-9999");
    expect(formatarTelefone("556133334444")).toBe("(61) 3333-4444");
  });
});
