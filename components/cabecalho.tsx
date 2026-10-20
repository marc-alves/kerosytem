import Link from "next/link";
import { IconeVoltar } from "@/components/icones";

/**
 * Título da tela e, fora dos três destinos, o botão "Voltar" escrito (DESIGN.md seção 6).
 * `voltarPara` é explícito para o botão sempre levar ao mesmo lugar.
 */
export function Cabecalho({ titulo, voltarPara }: { titulo: string; voltarPara?: string }) {
  return (
    <header className="flex flex-col gap-3 bg-creme px-4 pt-3 pb-4">
      <div className="flex min-h-14 items-center justify-between gap-3">
        {voltarPara ? (
          <Link
            href={voltarPara}
            className={
              "-ml-2 inline-flex min-h-14 items-center gap-1 rounded-cartao px-2 text-botao font-semibold text-laranja-escuro " +
              "focus-visible:outline-3 focus-visible:outline-laranja-escuro"
            }
          >
            <IconeVoltar />
            Voltar
          </Link>
        ) : (
          <span />
        )}
        {/* Logo pequeno: entra na T28, com o arquivo oficial. */}
        <span className="text-pequeno font-bold text-texto-suave">Kero Salgados</span>
      </div>
      <h1 className="text-titulo font-semibold">{titulo}</h1>
    </header>
  );
}
