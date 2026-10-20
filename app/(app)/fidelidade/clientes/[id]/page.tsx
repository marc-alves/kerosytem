import { Suspense } from "react";
import { acaoDesfazerResgate, acaoGerarNovoLink, acaoRegistrarResgate } from "@/app/(app)/fidelidade/acoes";
import { AcaoComDialogo } from "@/components/acao-com-dialogo";
import { Aviso } from "@/components/aviso";
import { BotaoCopiar } from "@/components/botao-copiar";
import { Cabecalho } from "@/components/cabecalho";
import { Cartao } from "@/components/cartao";
import { CartaoCarimbos } from "@/components/cartao-carimbos";
import { Carregando, Vazio } from "@/components/estados";
import { verCartaoCliente, type ItemHistorico } from "@/lib/casos-de-uso/fidelidade";
import { empresaDaSessao, montarLinkDoCartao, repositorioFidelidade } from "@/lib/dados/sessao";
import { formatarReais } from "@/lib/formato/numero";
import { contar } from "@/lib/formato/plural";
import { formatarTelefone } from "@/lib/formato/telefone";
import { dataEmBrasilia, formatarData, formatarDataHora } from "@/lib/indicacao/periodo";

const dia = (d: Date) => formatarData(dataEmBrasilia(d));

function LinhaHistorico({ item, clienteId, nome }: { item: ItemHistorico; clienteId: string; nome: string }) {
  if (item.tipo === "carimbo") {
    return (
      <Cartao className="flex flex-col gap-1">
        <p className="text-botao font-semibold">+1 carimbo</p>
        <p className="text-base">
          {dia(item.em)} · <span className="whitespace-nowrap tabular-nums">{formatarReais(item.valorFinal)}</span>
        </p>
        {item.retiradoEm ? (
          <p className="text-base font-semibold text-erro-texto">Carimbo retirado: venda cancelada em {dia(item.retiradoEm)}</p>
        ) : (
          <p className="text-base text-texto-suave">{item.liberado ? "Liberado" : `Libera em ${dia(item.liberadoEm)}`}</p>
        )}
      </Cartao>
    );
  }
  return (
    <Cartao className="flex flex-col gap-2">
      <p className="text-botao font-semibold">Resgate: {item.premio}</p>
      <p className="text-base">{formatarDataHora(item.em)}</p>
      {item.desfeitoEm ? (
        <p className="text-base text-texto-suave">Resgate desfeito em {dia(item.desfeitoEm)}</p>
      ) : (
        <AcaoComDialogo
          texto="Desfazer resgate"
          variante="link"
          titulo="Desfazer resgate"
          textoConfirmar="Sim, desfazer resgate"
          irPara={`/fidelidade/clientes/${clienteId}`}
          acao={acaoDesfazerResgate.bind(null, clienteId, item.id)}
        >
          <p>
            Desfazer o resgate de {dia(item.em)}? Os {item.meta} carimbos voltam para o cartão de {nome}.
          </p>
        </AcaoComDialogo>
      )}
    </Cartao>
  );
}

async function CartaoCliente({ params, searchParams }: PageProps<"/fidelidade/clientes/[id]">) {
  const { id } = await params;
  const { entregue } = await searchParams;
  const empresa = await empresaDaSessao();
  const cartao = await verCartaoCliente(await repositorioFidelidade(), id, new Date(), {
    empresaNome: empresa.nome,
    link: await montarLinkDoCartao(),
  });

  if (!cartao) {
    return (
      <>
        <Cabecalho titulo="Cartão" voltarPara="/fidelidade" />
        <div className="px-4">
          <Vazio mensagem="Cartão não encontrado." />
        </div>
      </>
    );
  }

  const { cliente, programa, estado, mensagem, historico } = cartao;
  const nome = cliente.nome;

  return (
    <>
      <Cabecalho titulo={nome} voltarPara="/fidelidade" />
      <div className="flex flex-col gap-6 px-4 py-4">
        <p className="-mt-2 text-base text-texto-suave">{formatarTelefone(cliente.telefone)}</p>
        {/* Depois do resgate o botão sai da tela; a frase fica até sair dela (nada some sozinho). */}
        {entregue === "1" && <Aviso tipo="sucesso">Prêmio entregue.</Aviso>}

        <Cartao className="flex flex-col gap-3">
          <CartaoCarimbos estado={estado} />
          <p className="text-base">
            Prêmio: <strong>{programa.premio}</strong>
          </p>
          {estado.aLiberar > 0 && estado.proximaLiberacao && (
            <p className="text-base text-texto-suave">
              {contar(estado.aLiberar, "carimbo a liberar", "carimbos a liberar")}; o próximo libera em{" "}
              {dia(estado.proximaLiberacao)}.
            </p>
          )}
          {estado.sobra > 0 && (
            <p className="text-base font-semibold">
              + {contar(estado.sobra, "carimbo", "carimbos")} para o próximo cartão
            </p>
          )}
        </Cartao>

        {estado.podeResgatar ? (
          <AcaoComDialogo
            texto="Registrar resgate"
            titulo="Entregar prêmio"
            textoConfirmar="Sim, entregar prêmio"
            irPara={`/fidelidade/clientes/${cliente.id}?entregue=1`}
            acao={acaoRegistrarResgate.bind(null, cliente.id)}
          >
            <p>
              Entregar {programa.premio} para {nome}? O cartão volta para {estado.noCartao - estado.meta} de{" "}
              {estado.meta}.
            </p>
          </AcaoComDialogo>
        ) : (
          estado.premioLiberadoEm && (
            <Aviso>
              Prêmio liberado a partir de {dia(estado.premioLiberadoEm)}. Antes disso, as vendas ainda estão no prazo de
              devolução.
            </Aviso>
          )
        )}

        <section aria-labelledby="titulo-mensagem" className="flex flex-col gap-3">
          <h2 id="titulo-mensagem" className="text-titulo font-semibold">
            Mensagem para {nome}
          </h2>
          <Cartao>
            <p className="text-base break-words whitespace-pre-wrap select-all">{mensagem}</p>
          </Cartao>
          <BotaoCopiar texto={mensagem} variante={estado.podeResgatar ? "secundario" : "primario"} />
        </section>

        <section aria-labelledby="titulo-historico" className="flex flex-col gap-3">
          <h2 id="titulo-historico" className="text-titulo font-semibold">
            Histórico
          </h2>
          <ul className="flex flex-col gap-3">
            {historico.map((item) => (
              <li key={`${item.tipo}-${item.id}`}>
                <LinhaHistorico item={item} clienteId={cliente.id} nome={nome} />
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-4 flex flex-col gap-3">
          <AcaoComDialogo
            texto="Gerar novo link"
            variante="link"
            titulo="Gerar novo link"
            textoConfirmar="Sim, gerar novo link"
            sucesso="Link novo pronto. O antigo parou de funcionar."
            acao={acaoGerarNovoLink.bind(null, cliente.id)}
          >
            <p>Gerar um novo link para o cartão de {nome}? O link antigo para de funcionar.</p>
          </AcaoComDialogo>
        </div>
      </div>
    </>
  );
}

/** Spec 10.2. */
export default function PaginaCartaoCliente(props: PageProps<"/fidelidade/clientes/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Cabecalho titulo="Cartão" voltarPara="/fidelidade" />
          <Carregando />
        </>
      }
    >
      <CartaoCliente {...props} />
    </Suspense>
  );
}
