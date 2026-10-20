import { Suspense, type ReactNode } from "react";
import { Carregando, SemConexao, Vazio } from "@/components/estados";
import { NavegacaoInferior } from "@/components/navegacao-inferior";
import { empresaDaSessao } from "@/lib/dados/sessao";
import { temAlgumModulo } from "@/lib/empresas/modulos";

/** Spec 000, RE7: empresa sem nenhum módulo ativo só vê o aviso. */
async function ComAlgumModulo({ children }: { children: ReactNode }) {
  if (!temAlgumModulo(await empresaDaSessao())) {
    return (
      <div className="px-4">
        <Vazio mensagem="Nenhum módulo ativo. Fale com o Kero System." />
      </div>
    );
  }
  return children;
}

/**
 * Telas do app (todas menos o login): conteúdo rola, navegação fica sempre embaixo.
 * A proteção por login entra na T10.
 */
export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh flex-col">
      <SemConexao />
      <main className="mx-auto flex w-full max-w-app flex-1 flex-col overflow-y-auto">
        <Suspense fallback={<Carregando />}>
          <ComAlgumModulo>{children}</ComAlgumModulo>
        </Suspense>
      </main>
      <NavegacaoInferior />
    </div>
  );
}
