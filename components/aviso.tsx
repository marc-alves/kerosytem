import type { ReactNode } from "react";
import { IconeAlerta, IconeCheck, IconeX } from "@/components/icones";

export type TipoAviso = "aviso" | "erro" | "sucesso";

const estilo: Record<TipoAviso, { classes: string; icone: ReactNode }> = {
  aviso: { classes: "border-aviso-texto bg-aviso-fundo text-aviso-texto", icone: <IconeAlerta /> },
  erro: { classes: "border-erro-texto bg-erro-fundo text-erro-texto", icone: <IconeX /> },
  sucesso: { classes: "border-pago-texto bg-pago-fundo text-pago-texto", icone: <IconeCheck /> },
};

/**
 * Faixa com ícone e frase curta; não some sozinha (DESIGN.md seção 7).
 * `acao` é um botão opcional, ex.: "Criar novo código" no limite de usos.
 */
export function Aviso({ tipo = "aviso", children, acao }: { tipo?: TipoAviso; children: ReactNode; acao?: ReactNode }) {
  const { classes, icone } = estilo[tipo];
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={`flex flex-col gap-3 rounded-cartao border-2 p-4 ${classes}`}>
      <p className="flex items-start gap-2 text-base font-semibold">
        {icone}
        <span>{children}</span>
      </p>
      {acao}
    </div>
  );
}
