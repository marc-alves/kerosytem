import { FormularioVenda } from "@/app/(app)/vendas/nova/formulario-venda";
import { empresaDaSessao } from "@/lib/dados/sessao";
import { moduloAtivo } from "@/lib/empresas/modulos";

/** Spec 10.5. */
export default async function PaginaNovaVenda() {
  return <FormularioVenda comCodigo={moduloAtivo(await empresaDaSessao(), "indicacao")} />;
}
