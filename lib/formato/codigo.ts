/**
 * "camila5, de Camila" ou "Sem código" (spec 10.5, 10.7). A spec escreve "da Camila";
 * "de" serve para qualquer nome, sem supor se é ela ou ele.
 */
export function descreverCodigo(codigo: { codigo: string; indicadorNome: string } | null): string {
  return codigo ? `${codigo.codigo}, de ${codigo.indicadorNome}` : "Sem código";
}
