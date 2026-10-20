import { Suspense } from "react";
import { destinosAtivos } from "@/components/destinos";
import { Itens, ItensComDestinoAtual } from "@/components/itens-navegacao";
import { empresaDaSessao } from "@/lib/dados/sessao";

/** Os destinos dependem dos módulos ativos da empresa (spec 000, RE5 e RE7). */
async function ItensDaEmpresa() {
  const empresa = await empresaDaSessao();
  return <ItensComDestinoAtual destinos={destinosAtivos(empresa)} />;
}

/**
 * Navegação fixa embaixo, com ícone e nome sempre visíveis (DESIGN.md seção 6).
 * O `Suspense` é exigido pelo `cacheComponents`: a empresa vem da sessão, a cada requisição.
 */
export function NavegacaoInferior() {
  return (
    <nav aria-label="Principal" className="shrink-0 border-t border-borda bg-superficie">
      <Suspense fallback={<Itens destinos={[]} atual={null} />}>
        <ItensDaEmpresa />
      </Suspense>
    </nav>
  );
}
