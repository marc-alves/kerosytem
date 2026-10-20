"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Botao } from "@/components/botao";

/**
 * Diálogo para ações que mexem em dinheiro (DESIGN.md seção 7).
 * Os dois botões trazem a ação completa: ex. "Sim, confirmar recebimento" e "Não, voltar".
 */
export function DialogoConfirmacao({
  aberto,
  titulo,
  children,
  textoConfirmar,
  textoVoltar = "Não, voltar",
  perigo = false,
  ocupado = false,
  onConfirmar,
  onVoltar,
}: {
  aberto: boolean;
  titulo: string;
  /** Resumo com nome e valor; pode incluir a consequência ("Ela deixa de contar como uso do código."). */
  children: ReactNode;
  textoConfirmar: string;
  textoVoltar?: string;
  perigo?: boolean;
  /** Enquanto grava: botões travados para não confirmar duas vezes. */
  ocupado?: boolean;
  onConfirmar: () => void;
  onVoltar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialogo-titulo"
      onCancel={(e) => {
        // Tecla Voltar/Esc: mesmo efeito de "Não, voltar".
        e.preventDefault();
        if (!ocupado) onVoltar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-app rounded-cartao border border-borda bg-superficie p-0 text-texto backdrop:bg-texto/60"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id="dialogo-titulo" className="text-titulo font-semibold">
          {titulo}
        </h2>
        <div className="text-base">{children}</div>
        <div className="mt-2 flex flex-col gap-6">
          <Botao variante={perigo ? "perigo" : "primario"} onClick={onConfirmar} disabled={ocupado}>
            {ocupado ? "Salvando…" : textoConfirmar}
          </Botao>
          <Botao variante="secundario" onClick={onVoltar} disabled={ocupado}>
            {textoVoltar}
          </Botao>
        </div>
      </div>
    </dialog>
  );
}
