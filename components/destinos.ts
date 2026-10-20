/** Os três destinos da navegação inferior (DESIGN.md seção 6). */
export const DESTINOS = [
  { href: "/vendas/nova", nome: "Nova venda" },
  { href: "/vendas", nome: "Vendas" },
  { href: "/indicadores", nome: "Indicadores" },
] as const;

export type Destino = (typeof DESTINOS)[number]["href"];

/** Qual destino marcar como atual; telas internas marcam o destino de onde vieram. */
export function destinoAtual(pathname: string): Destino | null {
  if (pathname === "/vendas/nova" || pathname.startsWith("/vendas/nova/")) return "/vendas/nova";
  if (pathname === "/vendas" || pathname.startsWith("/vendas/")) return "/vendas";
  if (pathname === "/indicadores" || pathname.startsWith("/indicadores/")) return "/indicadores";
  return null;
}
