import type { ReactNode } from "react";

/** Botão principal preso embaixo, ao alcance do polegar, quando a tela rola (DESIGN.md seção 6). */
export function AcaoFixa({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-fundo px-4 pt-3 pb-4">{children}</div>;
}
