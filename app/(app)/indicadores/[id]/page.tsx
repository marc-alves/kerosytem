import Link from "next/link";
import { Suspense } from "react";
import { CartaoCodigo } from "@/app/(app)/indicadores/[id]/cartao-codigo";
import { Aviso } from "@/components/aviso";
import { classesBotao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { CartaoVenda } from "@/components/cartao-venda";
import { Carregando, Vazio } from "@/components/estados";
import { repositorio } from "@/lib/dados/sessao";
import { formatarReais } from "@/lib/formato/numero";
import { contar } from "@/lib/formato/plural";
import { formatarTelefone } from "@/lib/formato/telefone";
import { dataEmBrasilia } from "@/lib/indicacao/periodo";

async function Detalhe({ params, searchParams }: PageProps<"/indicadores/[id]">) {
  const { id } = await params;
  const { criado } = await searchParams;
  const detalhe = await (await repositorio()).detalheIndicador(id);

  if (!detalhe) {
    return (
      <>
        <Cabecalho titulo="Indicador" voltarPara="/indicadores" />
        <div className="px-4">
          <Vazio mensagem="Indicador não encontrado." />
        </div>
      </>
    );
  }

  const { indicador, codigos, vendas } = detalhe;
  const hoje = dataEmBrasilia(new Date());
  const novoCodigoHref = `/indicadores/${indicador.id}/codigos/novo`;
  const botaoCriarCodigo = (
    <Link href={novoCodigoHref} className={classesBotao("secundario")}>
      Criar código
    </Link>
  );

  return (
    <>
      <Cabecalho titulo={indicador.nome} voltarPara="/indicadores" />
      <div className="flex flex-col gap-8 px-4 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-base text-texto-suave">{formatarTelefone(indicador.telefone)}</p>
          <p className="text-base">{contar(indicador.vendasPagas, "venda paga", "vendas pagas")}</p>
          <p className="text-base">
            Total vendido: <strong className="text-valor tabular-nums">{formatarReais(indicador.totalVendido)}</strong>
          </p>
        </div>

        {/* Vem da tela Criar código; fica até sair da tela (nada some sozinho). */}
        {typeof criado === "string" && <Aviso tipo="sucesso">Código {criado} criado.</Aviso>}

        <section className="flex flex-col gap-3" aria-labelledby="titulo-codigos">
          <h2 id="titulo-codigos" className="text-titulo font-semibold">
            Códigos
          </h2>
          {codigos.length === 0 ? (
            <Vazio mensagem="Nenhum código ainda." acao={botaoCriarCodigo} />
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {codigos.map((c) => (
                  <li key={c.id}>
                    <CartaoCodigo
                      codigo={c}
                      hoje={hoje}
                      indicadorNome={indicador.nome}
                      novoCodigoHref={novoCodigoHref}
                    />
                  </li>
                ))}
              </ul>
              {botaoCriarCodigo}
            </>
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="titulo-vendas">
          <h2 id="titulo-vendas" className="text-titulo font-semibold">
            Vendas
          </h2>
          {vendas.length === 0 ? (
            <Vazio mensagem={`Nenhuma venda com os códigos de ${indicador.nome} ainda.`} />
          ) : (
            <ul className="flex flex-col gap-3">
              {vendas.map((v) => (
                <li key={v.id}>
                  <CartaoVenda venda={v} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** Spec 10.3. */
export default function PaginaIndicador(props: PageProps<"/indicadores/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Cabecalho titulo="Indicador" voltarPara="/indicadores" />
          <Carregando />
        </>
      }
    >
      <Detalhe {...props} />
    </Suspense>
  );
}
