import { Suspense } from "react";
import { FormularioVenda } from "@/app/(app)/vendas/nova/formulario-venda";
import { Carregando } from "@/components/estados";
import { empresaDaSessao } from "@/lib/dados/sessao";
import { moduloAtivo } from "@/lib/empresas/modulos";

async function Formulario() {
  return <FormularioVenda comCodigo={moduloAtivo(await empresaDaSessao(), "indicacao")} />;
}

/** Spec 10.5. */
export default function PaginaNovaVenda() {
  return (
    <Suspense fallback={<Carregando />}>
      <Formulario />
    </Suspense>
  );
}
