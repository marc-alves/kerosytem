import { Suspense } from "react";
import { FormularioCodigo } from "@/app/(app)/indicadores/[id]/codigos/novo/formulario-codigo";
import { Cabecalho } from "@/components/cabecalho";
import { Carregando, Vazio } from "@/components/estados";
import { repositorio } from "@/lib/dados/sessao";
import { dataEmBrasilia } from "@/lib/indicacao/periodo";

async function Conteudo({ params }: { params: PageProps<"/indicadores/[id]/codigos/novo">["params"] }) {
  const { id } = await params;
  const detalhe = await (await repositorio()).detalheIndicador(id);
  if (!detalhe) {
    return (
      <>
        <Cabecalho titulo="Novo código" voltarPara="/indicadores" />
        <div className="px-4">
          <Vazio mensagem="Indicador não encontrado." />
        </div>
      </>
    );
  }
  return (
    <FormularioCodigo
      indicadorId={detalhe.indicador.id}
      indicadorNome={detalhe.indicador.nome}
      hoje={dataEmBrasilia(new Date())}
    />
  );
}

/** Spec 10.4. */
export default function PaginaNovoCodigo({ params }: PageProps<"/indicadores/[id]/codigos/novo">) {
  return (
    <Suspense
      fallback={
        <>
          <Cabecalho titulo="Novo código" />
          <Carregando />
        </>
      }
    >
      <Conteudo params={params} />
    </Suspense>
  );
}
