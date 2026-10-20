import { exigirModulo } from "@/lib/dados/sessao";

/** Telas do módulo de Indicação: só com ele ativo (spec 000, RE5). */
export default async function LayoutIndicadores({ children }: LayoutProps<"/indicadores">) {
  await exigirModulo("indicacao");
  return children;
}
