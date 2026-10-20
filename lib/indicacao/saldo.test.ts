import { calcularSaldo, podePagar } from "@/lib/indicacao/saldo";

describe("calcularSaldo (RN11)", () => {
  it("Venda com código normal pendente: saldo continua R$ 0,00, comissão aparece a confirmar", () => {
    expect(calcularSaldo({ vendas: [{ status: "pendente", comissao: 314 }], pagamentos: [] })).toEqual({
      saldo: 0,
      aConfirmar: 314,
    });
  });

  it("Confirmar recebimento: saldo vira R$ 3,14", () => {
    expect(calcularSaldo({ vendas: [{ status: "confirmada", comissao: 314 }], pagamentos: [] })).toEqual({
      saldo: 314,
      aConfirmar: 0,
    });
  });

  it("desconta pagamentos ativos e ignora cancelados e vendas canceladas", () => {
    const r = calcularSaldo({
      vendas: [
        { status: "confirmada", comissao: 1000 },
        { status: "confirmada", comissao: 500 },
        { status: "pendente", comissao: 200 },
        { status: "cancelada", comissao: 900 },
      ],
      pagamentos: [
        { status: "ativo", valor: 600 },
        { status: "cancelado", valor: 400 },
      ],
    });
    expect(r).toEqual({ saldo: 900, aConfirmar: 200 });
  });

  it("sem vendas nem pagamentos, tudo zero", () => {
    expect(calcularSaldo({ vendas: [], pagamentos: [] })).toEqual({ saldo: 0, aConfirmar: 0 });
  });
});

describe("podePagar (RN11)", () => {
  it("Pagamento acima do saldo: saldo R$ 10,00, pagamento R$ 15,00 é recusado", () => {
    expect(podePagar(1500, 1000)).toEqual({
      ok: false,
      motivo: "acima_do_saldo",
      mensagem: "O valor passa do saldo, que é R$ 10,00. Digite até R$ 10,00.",
    });
  });

  it("pagar exatamente o saldo é permitido", () => {
    expect(podePagar(1000, 1000)).toEqual({ ok: true });
  });

  it("valor zero, negativo ou fracionado é recusado", () => {
    for (const valor of [0, -100, 10.5]) {
      expect(podePagar(valor, 1000)).toMatchObject({ ok: false, motivo: "valor_invalido" });
    }
  });
});
