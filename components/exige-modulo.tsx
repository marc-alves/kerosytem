import { Suspense, type ReactNode } from "react";
import { Carregando } from "@/components/estados";
import type { Modulo } from "@/lib/dados/tipos";
import { exigirModulo } from "@/lib/dados/sessao";

async function Conferir({ modulo, children }: { modulo: Modulo; children: ReactNode }) {
  await exigirModulo(modulo);
  return children;
}

/**
 * Telas de um módulo só com ele ativo (spec 000, RE5). O `Suspense` é exigido pelo
 * `cacheComponents`: a empresa vem da sessão, a cada requisição.
 */
export function ExigeModulo({ modulo, children }: { modulo: Modulo; children: ReactNode }) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conferir modulo={modulo}>{children}</Conferir>
    </Suspense>
  );
}
