"use client";

import { useState } from "react";
import { Botao, type VarianteBotao } from "@/components/botao";

/** Reserva para quando não há `navigator.clipboard` (só existe em HTTPS, ex.: testando pela rede local). */
function copiarSemClipboard(texto: string): boolean {
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } finally {
    area.remove();
  }
}

/**
 * Copia o texto cru, com `*` e `~` (seção 8); vira "✓ Copiado" e fica assim enquanto estiver na tela.
 * `variante = "secundario"` quando a tela já tem outro botão principal.
 */
export function BotaoCopiar({
  texto,
  rotulo = "Copiar mensagem",
  variante = "primario",
}: {
  texto: string;
  rotulo?: string;
  variante?: VarianteBotao;
}) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState(false);

  async function copiar() {
    let ok: boolean;
    try {
      await navigator.clipboard.writeText(texto);
      ok = true;
    } catch {
      ok = copiarSemClipboard(texto);
    }
    setCopiado(ok);
    setErro(!ok);
  }

  return (
    <>
      <Botao variante={variante} onClick={copiar} aria-live="polite">
        {copiado ? "✓ Copiado" : rotulo}
      </Botao>
      {erro && (
        <p role="alert" className="text-base font-semibold text-erro-texto">
          Não deu para copiar. Tente de novo.
        </p>
      )}
    </>
  );
}
