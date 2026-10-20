/** "1 venda paga", "2 vendas pagas", "0 vendas pagas". */
export function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
