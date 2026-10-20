import { ExigeModulo } from "@/components/exige-modulo";

/** Telas do módulo de Indicação: só com ele ativo (spec 000, RE5). */
export default function LayoutIndicadores({ children }: LayoutProps<"/indicadores">) {
  return <ExigeModulo modulo="indicacao">{children}</ExigeModulo>;
}
