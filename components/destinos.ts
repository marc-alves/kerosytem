import type { Modulo } from "@/lib/dados/tipos";
import { moduloAtivo, temAlgumModulo } from "@/lib/empresas/modulos";

/**
 * Destinos da navegação inferior (DESIGN.md seção 6, spec 002 seção 10), na ordem da tela.
 * `modulo: null` = base comum (spec 000, RE7).
 */
export const DESTINOS = [
  { href: "/vendas/nova", nome: "Nova venda", modulo: null },
  { href: "/vendas", nome: "Vendas", modulo: null },
  { href: "/indicadores", nome: "Indicadores", modulo: "indicacao" },
  { href: "/fidelidade", nome: "Fidelidade", modulo: "fidelidade" },
] as const satisfies ReadonlyArray<{ href: string; nome: string; modulo: Modulo | null }>;

export type Destino = (typeof DESTINOS)[number]["href"];

/** Só os destinos dos módulos ativos; sem nenhum módulo, nenhum destino. */
export function destinosAtivos(empresa: { modulosAtivos: readonly Modulo[] }): Destino[] {
  if (!temAlgumModulo(empresa)) return [];
  return DESTINOS.filter((d) => d.modulo === null || moduloAtivo(empresa, d.modulo)).map((d) => d.href);
}

/** Qual destino marcar como atual; telas internas marcam o destino de onde vieram. */
export function destinoAtual(pathname: string): Destino | null {
  if (pathname === "/vendas/nova" || pathname.startsWith("/vendas/nova/")) return "/vendas/nova";
  if (pathname === "/vendas" || pathname.startsWith("/vendas/")) return "/vendas";
  if (pathname === "/indicadores" || pathname.startsWith("/indicadores/")) return "/indicadores";
  if (pathname === "/fidelidade" || pathname.startsWith("/fidelidade/")) return "/fidelidade";
  return null;
}
