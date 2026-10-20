import type { HTMLAttributes } from "react";

/** Superfície branca com borda, um por item de lista (DESIGN.md seção 7). */
export function Cartao({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-cartao border border-borda bg-superficie p-4 ${className}`} {...props} />;
}
