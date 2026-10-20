import Link from "next/link";
import { IconeVoltar } from "@/components/icones";

const classesVoltar =
  "-ml-2 inline-flex min-h-14 items-center gap-1 rounded-cartao px-2 text-botao font-semibold text-laranja-escuro " +
  "focus-visible:outline-3 focus-visible:outline-laranja-escuro";

/**
 * Título da tela e, fora dos três destinos, o botão "Voltar" escrito (DESIGN.md seção 6).
 * `voltarPara` é explícito para o botão sempre levar ao mesmo lugar; `onVoltar` é para
 * voltar um passo dentro da mesma tela (Nova venda, Criar código).
 */
export function Cabecalho({
  titulo,
  voltarPara,
  onVoltar,
  subtitulo,
}: {
  titulo: string;
  voltarPara?: string;
  onVoltar?: () => void;
  /** Linha abaixo do título, ex.: "Passo 1 de 3". */
  subtitulo?: string;
}) {
  return (
    <header className="flex flex-col gap-3 bg-creme px-4 pt-3 pb-4">
      <div className="flex min-h-14 items-center justify-between gap-3">
        {onVoltar ? (
          <button type="button" onClick={onVoltar} className={classesVoltar}>
            <IconeVoltar />
            Voltar
          </button>
        ) : voltarPara ? (
          <Link href={voltarPara} className={classesVoltar}>
            <IconeVoltar />
            Voltar
          </Link>
        ) : (
          <span />
        )}
        {/* Logo pequeno: entra na E3, com o arquivo oficial; o nome da empresa entra na E9. */}
        <span className="text-pequeno font-bold text-texto-suave">Kero System</span>
      </div>
      <h1 className="text-titulo font-semibold">{titulo}</h1>
      {subtitulo && <p className="-mt-2 text-base font-semibold text-texto-suave">{subtitulo}</p>}
    </header>
  );
}
