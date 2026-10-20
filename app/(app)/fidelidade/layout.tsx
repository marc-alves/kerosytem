import { ExigeModulo } from "@/components/exige-modulo";

/** Telas do cartão fidelidade: só com o módulo ativo (spec 002, RF10). */
export default function LayoutFidelidade({ children }: LayoutProps<"/fidelidade">) {
  return <ExigeModulo modulo="fidelidade">{children}</ExigeModulo>;
}
