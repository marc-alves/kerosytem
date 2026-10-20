import Link from "next/link";
import { FormularioPrograma } from "@/app/(app)/fidelidade/formulario-programa";
import { Aviso } from "@/components/aviso";
import { Cabecalho } from "@/components/cabecalho";
import { listarCartoes } from "@/lib/casos-de-uso/fidelidade";
import { repositorioFidelidade } from "@/lib/dados/sessao";
import { formatarReais } from "@/lib/formato/numero";
import { frasePrazo, resumoPrograma } from "@/lib/fidelidade/textos";

const SALVO: Record<string, string> = {
  criado: "Cartão fidelidade criado. As próximas vendas pagas já ganham carimbo.",
  ajustado: "Ajustes salvos.",
};

/** Spec 10.1. */
export default async function PaginaFidelidade({ searchParams }: PageProps<"/fidelidade">) {
  const { salvo, busca } = await searchParams;
  const textoBusca = typeof busca === "string" ? busca : "";
  const { programa } = await listarCartoes(await repositorioFidelidade(), textoBusca, new Date());

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
      </div>
    </>
  );
}
