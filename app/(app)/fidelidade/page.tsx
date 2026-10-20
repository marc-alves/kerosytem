import Link from "next/link";
import { Suspense } from "react";
import { FormularioPrograma } from "@/app/(app)/fidelidade/formulario-programa";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Carregando, Vazio } from "@/components/estados";
import { SeloCartaoCompleto } from "@/components/selo-status";
import { listarCartoes } from "@/lib/casos-de-uso/fidelidade";
import { repositorioFidelidade } from "@/lib/dados/sessao";
import { formatarReais } from "@/lib/formato/numero";
import { formatarTelefone } from "@/lib/formato/telefone";
import { dataEmBrasilia } from "@/lib/indicacao/periodo";
import type { EstadoCartao } from "@/lib/fidelidade/tipos";
import { frasePrazo, resumoPrograma } from "@/lib/fidelidade/textos";

const SALVO: Record<string, string> = {
  criado: "Cartão fidelidade criado. As próximas vendas pagas já ganham carimbo.",
  ajustado: "Ajustes salvos.",
};

/** "08/11", para caber no selo. */
const diaMes = (d: Date) => dataEmBrasilia(d).slice(5).split("-").reverse().join("/");

/** "N de M carimbos" com a barra; a barra só repete o texto (nunca só a cor). */
function Progresso({ estado }: { estado: EstadoCartao }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-base font-semibold">
        {estado.exibido} de {estado.meta} carimbos
      </span>
      <span aria-hidden="true" className="h-3 overflow-hidden rounded-full border border-borda-campo bg-superficie">
        <span className="block h-full bg-laranja" style={{ width: `${(estado.exibido / estado.meta) * 100}%` }} />
      </span>
    </div>
  );
}

async function Fidelidade({ searchParams }: { searchParams: PageProps<"/fidelidade">["searchParams"] }) {
  const { salvo, busca } = await searchParams;
  const textoBusca = typeof busca === "string" ? busca : "";
  const { programa, total, cartoes } = await listarCartoes(await repositorioFidelidade(), textoBusca, new Date());

  if (!programa) return <FormularioPrograma inicial={null} />;

  return (
    <>
      <Cabecalho titulo="Fidelidade" />
      <div className="flex flex-col gap-6 px-4 py-4">
        {/* Vem do formulário; fica até sair da tela (nada some sozinho). */}
        {typeof salvo === "string" && SALVO[salvo] && <Aviso tipo="sucesso">{SALVO[salvo]}</Aviso>}
        <section aria-label="Seu cartão" className="flex flex-col gap-1">
          <p className="text-botao font-semibold">{resumoPrograma(programa)}</p>
          {programa.valorMinimo !== null && (
            <p className="text-base">Compras a partir de {formatarReais(programa.valorMinimo)}</p>
          )}
          <p className="text-base">{frasePrazo(programa.diasLiberacao)}</p>
          <Link
            href="/fidelidade/ajustar"
            className="mt-2 inline-flex min-h-14 items-center self-start text-botao font-semibold text-laranja-escuro underline underline-offset-4"
          >
            Ajustar cartão
          </Link>
        </section>

        {total === 0 ? (
          <Vazio mensagem="Nenhum cliente com carimbo ainda. Os carimbos aparecem quando você confirma o recebimento de uma venda." />
        ) : (
          <section aria-label="Cartões dos clientes" className="flex flex-col gap-4">
            {/* GET comum: a busca fica na URL e funciona mesmo antes do JavaScript carregar. */}
            <form action="/fidelidade" className="flex flex-col gap-3" role="search">
              <label htmlFor="busca" className="text-base font-semibold">
                Buscar cliente
              </label>
              <p id="busca-exemplo" className="-mt-2 text-pequeno text-texto-suave">
                Nome ou telefone. Ex.: João ou <span className="whitespace-nowrap">(61) 99999-9999</span>
              </p>
              <input
                id="busca"
                name="busca"
                type="search"
                defaultValue={textoBusca}
                aria-describedby="busca-exemplo"
                autoComplete="off"
                enterKeyHint="search"
                className={
                  "min-h-14 w-full rounded-cartao border-2 border-borda-campo bg-superficie px-4 text-base text-texto " +
                  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-laranja-escuro"
                }
              />
              <Botao type="submit" variante="secundario">
                Buscar
              </Botao>
            </form>

            {cartoes.length === 0 ? (
              <Vazio mensagem="Nenhum cliente encontrado." />
            ) : (
              <ul className="flex flex-col gap-3">
                {cartoes.map(({ cliente, estado }) => (
                  <li key={cliente.id}>
                    <Link
                      href={`/fidelidade/clientes/${cliente.id}`}
                      className={
                        "flex flex-col gap-2 rounded-cartao border border-borda bg-superficie p-4 active:bg-creme " +
                        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-laranja-escuro"
                      }
                    >
                      <span className="text-botao font-semibold text-laranja-escuro underline underline-offset-4">
                        {cliente.nome}
                      </span>
                      <span className="text-base text-texto-suave">{formatarTelefone(cliente.telefone)}</span>
                      <Progresso estado={estado} />
                      {estado.completo && (
                        <span>
                          <SeloCartaoCompleto
                            liberadoEm={estado.premioLiberadoEm && diaMes(estado.premioLiberadoEm)}
                          />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  );
}

/** Spec 10.1. */
export default function PaginaFidelidade({ searchParams }: PageProps<"/fidelidade">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Fidelidade searchParams={searchParams} />
    </Suspense>
  );
}
