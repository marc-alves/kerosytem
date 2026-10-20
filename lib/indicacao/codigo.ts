/** RN1: códigos não diferenciam maiúsculas e são guardados em minúsculas, sem espaços. */
export function normalizarCodigo(texto: string): string {
  return texto.replace(/\s+/g, "").toLowerCase();
}
