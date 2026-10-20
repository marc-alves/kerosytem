import Link from "next/link";
import { Suspense } from "react";
import { FiltrosVendas, type Filtros } from "@/app/(app)/vendas/filtros-vendas";
import { classesBotao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { CartaoVenda } from "@/components/cartao-venda";
import { Carregando, Vazio } from "@/components/estados";
import { empresaDaSessao, repositorio } from "@/lib/dados/sessao";
import { moduloAtivo } from "@/lib/empresas/modulos";
import { inicioDoPeriodo, PERIODOS } from "@/lib/indicacao/periodo";

type Parametros = Awaited<PageProps<"/vendas">["searchParams"]>;

/**
 * Filtros da URL, com o padrão ao abrir: Todos / Últimos 7 dias / Todas
 * (proposta da spec 10.7, **[a confirmar]**). Valor desconhecido volta ao padrão.
 */
function lerFiltros(parametros: Parametros, indicadores: ReadonlyArray<{ id: string }>): Filtros {
  const um = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const indicador = um(parametros.indicador);
  const periodo = PERIODOS.find((p) => p.valor === um(parametros.periodo))?.valor ?? "7dias";
  const situacao = um(parametros.situacao);
  return {
    indicador:
      indicador === "sem_codigo" || indicadores.some((i) => i.id === indicador) ? indicador! : "todos",
    periodo,
    situacao:
      situacao === "pendente" || situacao === "confirmada" || situacao === "cancelada" ? situacao : "todas",
  };
}

async function ListaVendas({ searchParams }: { searchParams: PageProps<"/vendas">["searchParams"] }) {
  const repo = await repositorio();
  const comIndicacao = moduloAtivo(await empresaDaSessao(), "indicacao");
  // Sem o módulo de Indicação, nada de filtro Indicador nem código nos cartões (spec 000, RE7).
  const indicadores = comIndicacao ? await repo.listarIndicadores() : [];
  const lidos = lerFiltros(await searchParams, indicadores);
  const filtros = comIndicacao ? lidos : { ...lidos, indicador: "todos" };
  const vendas = await repo.listarVendas({
    indicador: filtros.indicador,
    desde: inicioDoPeriodo(filtros.periodo, new Date()),
    situacao: filtros.situacao,
  });

  return (
    <>
      <FiltrosVendas
        filtros={filtros}
        indicadores={comIndicacao ? indicadores.map(({ id, nome }) => ({ id, nome })) : null}
      />
      {vendas.length === 0 ? (
        <Vazio
          mensagem="Nenhuma venda neste filtro."
          acao={
            <Link href="/vendas/nova" className={classesBotao()}>
              Nova venda
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Vendas">
          {vendas.map((v) => (
            <li key={v.id}>
              <CartaoVenda venda={v} mostrarCodigo={comIndicacao} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Spec 10.7. */
export default function PaginaVendas({ searchParams }: PageProps<"/vendas">) {
  return (
    <>
      <Cabecalho titulo="Vendas" />
      <div className="flex flex-col gap-6 px-4 py-4">
        <Suspense fallback={<Carregando />}>
          <ListaVendas searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
