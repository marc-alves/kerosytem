import { exigirModulo } from "@/lib/dados/sessao";

/** Telas do cartão fidelidade: só com o módulo ativo (spec 002, RF10). */
export default async function LayoutFidelidade({ children }: LayoutProps<"/fidelidade">) {
  await exigirModulo("fidelidade");
  return children;
}
