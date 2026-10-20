import { SemConexao } from "@/components/estados";
import { NavegacaoInferior } from "@/components/navegacao-inferior";

/**
 * Telas do app (todas menos o login): conteúdo rola, navegação fica sempre embaixo.
 * A proteção por login entra na T10.
 */
export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh flex-col">
      <SemConexao />
      <main className="mx-auto flex w-full max-w-app flex-1 flex-col overflow-y-auto">{children}</main>
      <NavegacaoInferior />
    </div>
  );
}
