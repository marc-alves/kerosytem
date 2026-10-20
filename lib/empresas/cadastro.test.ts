import { validarEmail, validarNomeEmpresa, validarSenha } from "@/lib/empresas/cadastro";

describe("validarNomeEmpresa (RE1, spec 9.1)", () => {
  it("tira os espaços das pontas", () => {
    expect(validarNomeEmpresa("  Lanchonete da Maria ")).toEqual({
      ok: true,
      nome: "Lanchonete da Maria",
    });
  });

  it.each(["", "   "])('recusa "%s" com a mensagem da spec', (texto) => {
    expect(validarNomeEmpresa(texto)).toEqual({
      ok: false,
      motivo: "nome_vazio",
      mensagem: "Digite o nome da empresa.",
    });
  });

  it("aceita 60 caracteres e recusa 61", () => {
    expect(validarNomeEmpresa("a".repeat(60)).ok).toBe(true);
    expect(validarNomeEmpresa(` ${"a".repeat(60)} `).ok).toBe(true);
    expect(validarNomeEmpresa("a".repeat(61))).toMatchObject({ ok: false, motivo: "nome_longo" });
  });
});

describe("validarEmail (spec 9.1)", () => {
  it.each([
    ["maria@gmail.com", "maria@gmail.com"],
    [" Maria@Gmail.com ", "maria@gmail.com"],
    ["ze.pastel+loja@empresa.com.br", "ze.pastel+loja@empresa.com.br"],
  ])('"%s" → "%s"', (texto, email) => {
    expect(validarEmail(texto)).toEqual({ ok: true, email });
  });

  it.each(["", "   ", "maria", "maria@", "maria@gmail", "@gmail.com", "ma ria@gmail.com", "maria@@gmail.com"])(
    'recusa "%s" com a mensagem da spec',
    (texto) => {
      expect(validarEmail(texto)).toEqual({
        ok: false,
        motivo: "email_invalido",
        mensagem: "Digite um e-mail válido. Ex.: maria@gmail.com",
      });
    },
  );
});

describe("validarSenha (RE1, spec 9.1)", () => {
  it.each(["12345678", "senhaboa", "        "])('aceita "%s"', (texto) => {
    expect(validarSenha(texto)).toEqual({ ok: true });
  });

  it.each(["", "1234567"])('recusa "%s" com a mensagem da spec', (texto) => {
    expect(validarSenha(texto)).toEqual({
      ok: false,
      motivo: "senha_curta",
      mensagem: "A senha precisa ter pelo menos 8 letras ou números.",
    });
  });
});
