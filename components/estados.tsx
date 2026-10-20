"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Botao } from "@/components/botao";
import { IconeSemInternet } from "@/components/icones";

/** Nunca tela em branco (DESIGN.md seção 9). */
export function Carregando() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-12 text-titulo font-semibold">
      <span
        aria-hidden="true"
        className="size-12 animate-spin rounded-full border-4 border-borda border-t-laranja-escuro"
      />
      Carregando…
    </div>
  );
}

/** Frase curta e o botão para começar, ex.: "Nenhum indicador ainda." + "Cadastrar o primeiro". */
export function Vazio({ mensagem, acao }: { mensagem: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="text-titulo font-semibold">{mensagem}</p>
      {acao}
    </div>
  );
}

/** Mensagem clara em texto grande + "Tentar de novo". */
export function Erro({ mensagem, onTentarDeNovo }: { mensagem: string; onTentarDeNovo: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-6 py-12 text-center">
      <p className="text-titulo font-semibold text-erro-texto">{mensagem}</p>
      <Botao variante="secundario" onClick={onTentarDeNovo}>
        Tentar de novo
      </Botao>
    </div>
  );
}

function assinarConexao(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** Faixa fixa no topo enquanto estiver sem internet. */
export function SemConexao() {
  const online = useSyncExternalStore(
    assinarConexao,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-20 flex items-center justify-center gap-2 bg-erro-texto px-4 py-3 text-base font-semibold text-superficie"
    >
      <IconeSemInternet />
      Sem internet. Nada foi salvo.
    </div>
  );
}
