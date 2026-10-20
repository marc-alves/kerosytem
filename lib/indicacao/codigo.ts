import type {
  AvisoCodigo,
  ClienteParaValidar,
  CodigoParaValidar,
  Data,
  ResultadoCodigo,
  StatusVenda,
} from "@/lib/indicacao/tipos";

const FUSO_BRASILIA = "America/Sao_Paulo";

/** RN1: códigos não diferenciam maiúsculas e são guardados em minúsculas, sem espaços. */
export function normalizarCodigo(texto: string): string {
  return texto.replace(/\s+/g, "").toLowerCase();
}

/** Dia de hoje em Brasília, no formato `AAAA-MM-DD`. */
function hojeEmBrasilia(agora: Date): Data {
  // O formato en-CA já sai como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_BRASILIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

function formatarData(data: Data): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** RN2: ativo e (sem validade ou ainda dentro do dia de validade, até 23h59 de Brasília). */
export function codigoValido(entrada: {
  codigo: Pick<CodigoParaValidar, "ativo" | "validoAte">;
  agora: Date;
}): boolean {
  const { codigo, agora } = entrada;
  if (!codigo.ativo) return false;
  return codigo.validoAte === null || hojeEmBrasilia(agora) <= codigo.validoAte;
}

/** RN3: cada venda confirmada conta como um uso; pendentes e canceladas não contam. */
export function contarUsos(vendas: ReadonlyArray<{ status: StatusVenda }>): number {
  return vendas.filter((v) => v.status === "confirmada").length;
}

/**
 * RN2, RN3, RN5, RN6 e RN7. `codigo` é `null` quando o digitado não existe no banco.
 * O limite de usos e a venda pendente nunca recusam: só devolvem aviso.
 */
export function validarCodigo(entrada: {
  codigo: CodigoParaValidar | null;
  cliente: ClienteParaValidar;
  agora: Date;
}): ResultadoCodigo {
  const { codigo, cliente, agora } = entrada;

  if (codigo === null) {
    return {
      ok: false,
      motivo: "codigo_nao_encontrado",
      mensagem: "Código não encontrado. Confira se foi digitado certo.",
    };
  }

  if (!codigo.ativo) {
    return {
      ok: false,
      motivo: "codigo_desativado",
      mensagem: `O código ${codigo.codigo} está desativado. Use outro código ou lance sem código.`,
    };
  }

  if (!codigoValido({ codigo, agora })) {
    return {
      ok: false,
      motivo: "codigo_vencido",
      mensagem: `O código ${codigo.codigo} venceu em ${formatarData(codigo.validoAte!)}. Use outro código ou lance sem código.`,
    };
  }

  if (cliente.telefone === codigo.indicadorTelefone) {
    return {
      ok: false,
      motivo: "autoindicacao",
      mensagem: `Este telefone é o mesmo de ${codigo.indicadorNome}. Quem indica não pode usar o próprio código.`,
    };
  }

  if (cliente.vinculo !== null && cliente.vinculo.indicadorId !== codigo.indicadorId) {
    const nome = cliente.vinculo.indicadorNome;
    return {
      ok: false,
      motivo: "cliente_de_outro_indicador",
      mensagem: `Este cliente já usa os códigos de ${nome}. Use um código de ${nome}.`,
    };
  }

  if (codigo.tipo === "primeira_compra" && cliente.temVendaConfirmada) {
    return {
      ok: false,
      motivo: "primeira_compra_ja_feita",
      mensagem: `O código ${codigo.codigo} é só para a primeira compra, e este cliente já comprou. Use outro código.`,
    };
  }

  const avisos: AvisoCodigo[] = [];
  if (codigo.usos >= codigo.limiteUsos) {
    avisos.push({
      tipo: "limite_atingido",
      mensagem: `Este código atingiu ${codigo.usos} usos, considere gerar um novo código para ${codigo.indicadorNome}.`,
    });
  }

  if (codigo.tipo === "primeira_compra" && cliente.temVendaPendente) {
    avisos.push({
      tipo: "cliente_com_venda_pendente",
      mensagem: "Este cliente tem venda aguardando confirmação.",
    });
  }

  return { ok: true, codigo, avisos };
}
