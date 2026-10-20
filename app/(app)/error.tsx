"use client";

import { Erro } from "@/components/estados";

/** Erro ao carregar qualquer tela do app: mensagem clara + "Tentar de novo" (DESIGN.md seção 9). */
export default function ErroDoApp({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="px-4">
      <Erro mensagem="Não deu para carregar esta tela." onTentarDeNovo={retry} />
    </div>
  );
}
