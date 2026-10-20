import type {
  ClienteParaValidar,
  ResultadoCancelamento,
  ResultadoConfirmacao,
  VendaParaTransicao,
} from "@/lib/indicacao/tipos";

/**
 * RN10, revalidando RN6 e RN5 no momento da confirmação.
 * `cliente` reflete o estado atual, antes de confirmar esta venda.
 */
export function podeConfirmar(entrada: {
  venda: VendaParaTransicao;
  cliente: Pick<ClienteParaValidar, "vinculo" | "temVendaConfirmada">;
}): ResultadoConfirmacao {
  const { venda, cliente } = entrada;

  if (venda.status !== "pendente") {
    return {
      ok: false,
      motivo: "venda_nao_pendente",
      mensagem:
        venda.status === "confirmada"
          ? "Esta venda já está paga."
          : "Esta venda foi cancelada e não pode ser confirmada.",
    };
  }

  const { codigo } = venda;
  if (codigo === null) return { ok: true, criarVinculo: false };

  if (cliente.vinculo !== null && cliente.vinculo.indicadorId !== codigo.indicadorId) {
    const nome = cliente.vinculo.indicadorNome;
    return {
      ok: false,
      motivo: "cliente_de_outro_indicador",
      mensagem: `Este cliente já usa os códigos de ${nome}. Cancele esta venda e lance de novo com um código de ${nome}.`,
    };
  }

  if (codigo.tipo === "primeira_compra" && cliente.temVendaConfirmada) {
    return {
      ok: false,
      motivo: "primeira_compra_ja_feita",
      mensagem: `Este cliente já tem uma compra paga, então o código ${codigo.codigo} não vale mais. Cancele esta venda e lance de novo com outro código ou sem código.`,
    };
  }

  return { ok: true, criarVinculo: cliente.vinculo === null };
}

/** RN12: cancelar venda pendente ou confirmada é livre; só não cancela duas vezes. */
export function podeCancelarVenda(venda: Pick<VendaParaTransicao, "status">): ResultadoCancelamento {
  if (venda.status === "cancelada") {
    return { ok: false, motivo: "venda_ja_cancelada", mensagem: "Esta venda já foi cancelada." };
  }
  return { ok: true };
}
