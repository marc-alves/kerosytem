import Link from "next/link";
import { Suspense } from "react";
import { FormularioIndicador } from "@/app/(app)/indicadores/formulario-indicador";
import { Cabecalho } from "@/components/cabecalho";
import { Carregando, Vazio } from "@/components/estados";
import { repositorio } from "@/lib/dados/sessao";
import { formatarReais } from "@/lib/formato/numero";
import { contar } from "@/lib/formato/plural";
import { formatarTelefone } from "@/lib/formato/telefone";

async function ListaIndicadores() {
  const indicadores = await (await repositorio()).listarIndicadores();
  if (indicadores.length === 0) return <Vazio mensagem="Nenhum indicador ainda. Cadastre o primeiro acima." />;

  return (
    <ul className="flex flex-col gap-3">
      {indicadores.map((i) => (
        <li key={i.id}>
          <Link
            href={`/indicadores/${i.id}`}
            className={
              "flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-4 active:bg-creme " +
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-laranja-escuro"
            }
          >
            <span className="text-botao font-semibold text-laranja-escuro underline underline-offset-4">{i.nome}</span>
            <span className="text-base text-texto-suave">{formatarTelefone(i.telefone)}</span>
            <span className="text-base">
              {contar(i.codigosAtivos, "código ativo", "códigos ativos")} ·{" "}
              {contar(i.vendasPagas, "venda paga", "vendas pagas")}
            </span>
            <span className="text-base">
              Total vendido: <strong className="tabular-nums">{formatarReais(i.totalVendido)}</strong>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Spec 10.2. */
export default function PaginaIndicadores() {
  return (
    <>
      <Cabecalho titulo="Indicadores" />
      <div className="flex flex-col gap-8 px-4 py-4">
        <FormularioIndicador />
        <section aria-label="Lista de indicadores">
          <Suspense fallback={<Carregando />}>
            <ListaIndicadores />
          </Suspense>
        </section>
      </div>
    </>
  );
}
