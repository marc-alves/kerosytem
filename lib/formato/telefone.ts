import type { Telefone } from "@/lib/indicacao/tipos";

const DDI_BRASIL = "55";
const MAXIMO_DIGITOS = 13;

/** (DD) XXXX-XXXX ou (DD) XXXXX-XXXX, aceitando o número pela metade. */
function mascararNacional(digitos: string): string {
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  if (numero === "") return `(${ddd}`;
  // Até 8 dígitos o hífen vem depois do 4º (fixo); com 9, depois do 5º (celular).
  const corte = numero.length > 8 ? 5 : 4;
  const parte1 = numero.slice(0, corte);
  const parte2 = numero.slice(corte);
  return `(${ddd}) ${parte1}${parte2 ? `-${parte2}` : ""}`;
}

/**
 * Máscara enquanto a pessoa digita: "61999999999" → "(61) 99999-9999".
 * Com 12 ou 13 dígitos começando por 55, mostra o DDI: "+55 (61) 99999-9999".
 * Só formata; quem valida é `normalizarTelefone` (RN4).
 */
export function mascararTelefone(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, MAXIMO_DIGITOS);
  if (digitos === "") return "";
  if (digitos.length > 11 && digitos.startsWith(DDI_BRASIL)) {
    return `+55 ${mascararNacional(digitos.slice(2))}`;
  }
  return mascararNacional(digitos);
}

/** Telefone já normalizado (com DDI) para exibir: "5561999999999" → "(61) 99999-9999". */
export function formatarTelefone(telefone: Telefone): string {
  return mascararNacional(telefone.slice(DDI_BRASIL.length));
}
