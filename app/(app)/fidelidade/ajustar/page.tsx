import { redirect } from "next/navigation";
import { FormularioPrograma } from "@/app/(app)/fidelidade/formulario-programa";
import { programaEmTexto } from "@/app/(app)/fidelidade/programa-em-texto";
import { repositorioFidelidade } from "@/lib/dados/sessao";

/** Spec 10.4, ajustar. Sem programa ainda, a criação fica na própria /fidelidade. */
export default async function PaginaAjustarCartao() {
  const programa = await (await repositorioFidelidade()).programa();
  if (!programa) redirect("/fidelidade");
  return <FormularioPrograma inicial={programaEmTexto(programa)} />;
}
