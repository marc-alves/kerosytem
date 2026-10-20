import type { ResultadoTelefone } from "@/lib/indicacao/tipos";

const DDI_BRASIL = "55";

/**
 * RN4: deixa só os dígitos e acrescenta o DDI 55 quando falta.
 * Com DDD e sem DDI o número tem 10 (fixo) ou 11 (celular) dígitos;
 * com DDI, 12 ou 13. Qualquer outra coisa é recusada.
 */
export function normalizarTelefone(texto: string): ResultadoTelefone {
  const digitos = texto.replace(/\D/g, "");

  if (digitos === "") {
    return {
      ok: false,
      motivo: "telefone_vazio",
      mensagem: "Digite o telefone com DDD. Ex.: (61) 99999-9999.",
    };
  }

  if (digitos.length === 10 || digitos.length === 11) {
    return { ok: true, telefone: DDI_BRASIL + digitos };
  }

  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith(DDI_BRASIL)) {
    return { ok: true, telefone: digitos };
  }

  return {
    ok: false,
    motivo: "telefone_invalido",
    mensagem: "O telefone precisa ter DDD e número. Ex.: (61) 99999-9999.",
  };
}
