import { formatarReais } from "@/lib/formato/numero";
import type {
  Centavos,
  ResultadoPagamento,
  Saldo,
  StatusPagamento,
  StatusVenda,
} from "@/lib/indicacao/tipos";

function somar(valores: Centavos[]): Centavos {
  return valores.reduce((total, v) => total + v, 0);
}

/**
 * RN11: `vendas` são as feitas com os códigos do indicador; `pagamentos`, os feitos a ele.
 * Vendas canceladas e pagamentos cancelados não contam.
 */
export function calcularSaldo(entrada: {
  vendas: ReadonlyArray<{ status: StatusVenda; comissao: Centavos }>;
  pagamentos: ReadonlyArray<{ status: StatusPagamento; valor: Centavos }>;
}): Saldo {
  const { vendas, pagamentos } = entrada;
  const comissoes = (status: StatusVenda) =>
    somar(vendas.filter((v) => v.status === status).map((v) => v.comissao));

  return {
    saldo: comissoes("confirmada") - somar(pagamentos.filter((p) => p.status === "ativo").map((p) => p.valor)),
    aConfirmar: comissoes("pendente"),
  };
}

/** RN11: pagamento ao indicador precisa ser positivo e não pode passar do saldo. */
export function podePagar(valor: Centavos, saldo: Centavos): ResultadoPagamento {
  if (!Number.isSafeInteger(valor) || valor <= 0) {
    return {
      ok: false,
      motivo: "valor_invalido",
      mensagem: "Digite um valor maior que zero. Ex.: 10,00.",
    };
  }

  if (valor > saldo) {
    return {
      ok: false,
      motivo: "acima_do_saldo",
      mensagem: `O valor passa do saldo, que é ${formatarReais(saldo)}. Digite até ${formatarReais(saldo)}.`,
    };
  }

  return { ok: true };
}
