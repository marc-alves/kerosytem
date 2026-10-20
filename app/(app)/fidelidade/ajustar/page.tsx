import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormularioPrograma } from "@/app/(app)/fidelidade/formulario-programa";
import { programaEmTexto } from "@/app/(app)/fidelidade/programa-em-texto";
import { Carregando } from "@/components/estados";
import { repositorioFidelidade } from "@/lib/dados/sessao";

async function Ajustar() {
  const programa = await (await repositorioFidelidade()).programa();
  if (!programa) redirect("/fidelidade");
  return <FormularioPrograma inicial={programaEmTexto(programa)} />;
}

/** Spec 10.4, ajustar. Sem programa ainda, a criação fica na própria /fidelidade. */
export default function PaginaAjustarCartao() {
  return (
    <Suspense fallback={<Carregando />}>
      <Ajustar />
    </Suspense>
  );
}
