import type { Falha } from "@/lib/indicacao/tipos";

export const NOME_EMPRESA_MAXIMO = 60;
export const SENHA_MINIMO = 8;

export type ResultadoNomeEmpresa =
  | { ok: true; nome: string }
  | Falha<"nome_vazio" | "nome_longo">;
export type ResultadoEmail = { ok: true; email: string } | Falha<"email_invalido">;
export type ResultadoSenha = { ok: true } | Falha<"senha_curta">;

/** RE1: obrigatório, sem espaços nas pontas, até 60 caracteres. */
export function validarNomeEmpresa(texto: string): ResultadoNomeEmpresa {
  const nome = texto.trim();
  if (nome === "") {
    return { ok: false, motivo: "nome_vazio", mensagem: "Digite o nome da empresa." };
  }
  if (nome.length > NOME_EMPRESA_MAXIMO) {
    return {
      ok: false,
      motivo: "nome_longo",
      mensagem: `O nome da empresa pode ter até ${NOME_EMPRESA_MAXIMO} letras.`,
    };
  }
  return { ok: true, nome };
}

/**
 * Spec 9.1: confere só o formato (algo@dominio.tld, sem espaços); devolve sem espaços
 * nas pontas e em minúsculas. "Já tem conta" é resposta do Supabase Auth, não daqui.
 */
export function validarEmail(texto: string): ResultadoEmail {
  const email = texto.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      motivo: "email_invalido",
      mensagem: "Digite um e-mail válido. Ex.: maria@gmail.com",
    };
  }
  return { ok: true, email };
}

/** RE1: pelo menos 8 caracteres, contados como digitados (espaços valem). */
export function validarSenha(texto: string): ResultadoSenha {
  if (texto.length < SENHA_MINIMO) {
    return {
      ok: false,
      motivo: "senha_curta",
      mensagem: "A senha precisa ter pelo menos 8 letras ou números.",
    };
  }
  return { ok: true };
}
