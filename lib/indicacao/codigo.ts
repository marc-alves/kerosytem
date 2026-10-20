import type {
  AvisoCodigo,
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
 * RN2 e RN3. `codigo` é `null` quando o digitado não existe no banco.
 * O limite de usos nunca recusa: só devolve o aviso.
 */
export function validarCodigo(entrada: {
  codigo: CodigoParaValidar | null;
  agora: Date;
}): ResultadoCodigo {
  const { codigo, agora } = entrada;

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

  const avisos: AvisoCodigo[] = [];
  if (codigo.usos >= codigo.limiteUsos) {
    avisos.push({
      tipo: "limite_atingido",
      mensagem: `Este código atingiu ${codigo.usos} usos, considere gerar um novo código para ${codigo.indicadorNome}.`,
    });
  }

  return { ok: true, codigo, avisos };
}
