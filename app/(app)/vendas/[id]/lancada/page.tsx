import Link from "next/link";
import { Suspense } from "react";
import { BotaoCopiar } from "@/app/(app)/vendas/[id]/lancada/botao-copiar";
import { classesBotao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Cartao } from "@/components/cartao";
import { Carregando, Vazio } from "@/components/estados";
import { SeloStatus } from "@/components/selo-status";
import { repositorio } from "@/lib/dados/sessao";
import { formatarReais } from "@/lib/formato/numero";
import { gerarMensagem } from "@/lib/indicacao/mensagem";

async function VendaLancada({ params }: { params: PageProps<"/vendas/[id]/lancada">["params"] }) {
  const { id } = await params;
  const venda = await (await repositorio()).venda(id);
  if (!venda) return <Vazio mensagem="Venda não encontrada." />;

  // A mensagem sai dos valores gravados na venda: recarregar mostra a mesma (spec 10.6).
  const mensagem =
    venda.codigo && venda.status !== "cancelada"
      ? gerarMensagem({
          nome: venda.cliente.nome,
          descontoBp: venda.descontoBp,
          codigo: venda.codigo.codigo,
          valorOriginal: venda.valorOriginal,
          valorFinal: venda.valorFinal,
        })
      : null;

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-4">
        <div>
          <SeloStatus status={venda.status} />
        </div>
        {mensagem ? (
          <Cartao>
            <p className="mb-2 text-base text-texto-suave">Mensagem para {venda.cliente.nome}:</p>
            <p className="text-base whitespace-pre-wrap select-all">{mensagem}</p>
          </Cartao>
        ) : (
          <Cartao className="flex flex-col gap-1">
            <p className="text-botao font-semibold">{venda.cliente.nome}</p>
            <p className="text-valor-destaque font-semibold whitespace-nowrap tabular-nums">
              {formatarReais(venda.valorFinal)}
            </p>
          </Cartao>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-3 px-4 pt-3 pb-4">
        {mensagem && <BotaoCopiar texto={mensagem} />}
        <Link href="/vendas/nova" className={classesBotao(mensagem ? "secundario" : "primario")}>
          Nova venda
        </Link>
      </div>
    </>
  );
}

/** Spec 10.6: a tela pertence à venda, não ao formulário. */
export default function PaginaVendaLancada({ params }: PageProps<"/vendas/[id]/lancada">) {
  return (
    <div className="flex flex-1 flex-col">
      <Cabecalho titulo="Venda lançada" />
      <Suspense fallback={<Carregando />}>
        <VendaLancada params={params} />
      </Suspense>
    </div>
  );
}
