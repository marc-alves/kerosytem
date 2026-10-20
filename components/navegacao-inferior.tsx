import { Suspense } from "react";
import { Itens, ItensComDestinoAtual } from "@/components/itens-navegacao";

/**
 * Navegação fixa embaixo, com ícone e nome sempre visíveis (DESIGN.md seção 6).
 * O `Suspense` é exigido pelo `cacheComponents` em rotas com parâmetro, como /indicadores/[id].
 */
export function NavegacaoInferior() {
  return (
    <nav aria-label="Principal" className="shrink-0 border-t border-borda bg-superficie">
      <Suspense fallback={<Itens atual={null} />}>
        <ItensComDestinoAtual />
      </Suspense>
    </nav>
  );
}
