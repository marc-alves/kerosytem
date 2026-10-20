import type { Metadata } from "next";
import { Suspense } from "react";
import { CartaoCarimbos } from "@/components/cartao-carimbos";
import { Carregando, SemConexao } from "@/components/estados";
import { verCartaoPublico } from "@/lib/casos-de-uso/fidelidade";
import { cartaoPublico } from "@/lib/dados/sessao";
import { fraseRegra } from "@/lib/fidelidade/textos";
import { dataEmBrasilia, formatarData } from "@/lib/indicacao/periodo";

// RF9: link pessoal, fora de buscadores; o endereço não vaza para outros sites.
export const metadata: Metadata = {
  title: "Cartão fidelidade",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const dia = (d: Date) => formatarData(dataEmBrasilia(d));

/** Sem revelar se o cliente ou a empresa existem (spec 11.1). */
function NaoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-titulo font-semibold">Este cartão não foi encontrado.</p>
      <p className="text-base">Peça um novo link para a empresa.</p>
    </div>
  );
}

async function MeuCartao({ params }: { params: PageProps<"/cartao/[chave]">["params"] }) {
  const { chave } = await params;
  const cartao = verCartaoPublico(await cartaoPublico(chave), new Date());
  if (!cartao) return <NaoEncontrado />;
  const { estado } = cartao;

  return (
    <>
      <header className="flex flex-col gap-1 bg-creme px-4 pt-6 pb-5">
        <p className="text-titulo font-semibold">{cartao.empresaNome}</p>
        <p className="text-base font-semibold text-texto-suave">Cartão fidelidade</p>
      </header>
      <div className="flex flex-col gap-6 px-4 py-5">
        <p className="text-titulo font-semibold">Olá, {cartao.primeiroNome}!</p>

        <section aria-label="Seus carimbos" className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-4">
          <CartaoCarimbos
            estado={estado}
            mostrarALiberar={false}
            legenda={`Você tem ${estado.exibido} de ${estado.meta} carimbos`}
          />
          {estado.completo ? (
            <p className="text-botao font-semibold text-pago-texto">
              Cartão completo! Você ganhou {cartao.premio}.{" "}
              {estado.podeResgatar || !estado.premioLiberadoEm
                ? "É só pedir na próxima visita."
                : `Pode pedir a partir de ${dia(estado.premioLiberadoEm)}.`}
            </p>
          ) : (
            <p className="text-base">
              Faltam {estado.faltam} para ganhar <strong>{cartao.premio}</strong>
            </p>
          )}
          <p className="text-base text-texto-suave">{fraseRegra(cartao.valorMinimo)}</p>
        </section>

        {cartao.historico.length > 0 && (
          <section aria-labelledby="titulo-historico" className="flex flex-col gap-2">
            <h2 id="titulo-historico" className="text-botao font-semibold">
              Histórico
            </h2>
            <ul className="flex flex-col divide-y divide-borda rounded-cartao border border-borda bg-superficie">
              {cartao.historico.map((item, i) => (
                <li key={i} className="px-4 py-3 text-base">
                  {item.tipo === "carimbo" ? "Carimbo" : "Prêmio resgatado"} · {dia(item.em)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

/** Spec 11.1: sem login, sem cabeçalho nem navegação do app. */
export default function PaginaMeuCartao({ params }: PageProps<"/cartao/[chave]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SemConexao />
      <main className="mx-auto flex w-full max-w-app flex-1 flex-col">
        <Suspense fallback={<Carregando />}>
          <MeuCartao params={params} />
        </Suspense>
      </main>
      <footer className="py-6 text-center text-pequeno text-texto-suave">Feito com Kero System</footer>
    </div>
  );
}
