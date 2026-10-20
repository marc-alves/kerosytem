"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Aviso } from "@/components/aviso";
import { Botao, type VarianteBotao } from "@/components/botao";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { ERRO_AO_SALVAR } from "@/components/mensagens";

type Resultado = { ok: true } | { ok: false; erros: { geral?: string } };

/**
 * Botão que abre o diálogo de confirmação e chama a Server Action (já presa ao item no servidor).
 * A recusa e a frase de sucesso ficam embaixo do botão até a próxima ação (nada some sozinho).
 */
export function AcaoComDialogo({
  texto,
  variante = "primario",
  titulo,
  textoConfirmar,
  perigo = false,
  sucesso,
  irPara,
  acao,
  children,
}: {
  texto: string;
  variante?: VarianteBotao;
  titulo: string;
  textoConfirmar: string;
  perigo?: boolean;
  /** Ex.: "Prêmio entregue." */
  sucesso?: string;
  /** Endereço para abrir depois de dar certo, quando o botão some da tela (ex.: `?entregue=1`). */
  irPara?: string;
  acao: () => Promise<Resultado>;
  /** Resumo do diálogo, com a consequência. */
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [resposta, setResposta] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();
  const router = useRouter();

  function confirmar() {
    iniciar(async () => {
      try {
        const r = await acao();
        if (r.ok && irPara) router.replace(irPara, { scroll: false });
        setResposta(r.ok ? (sucesso ? { tipo: "sucesso", texto: sucesso } : null) : { tipo: "erro", texto: r.erros.geral ?? ERRO_AO_SALVAR });
      } catch {
        setResposta({ tipo: "erro", texto: ERRO_AO_SALVAR });
      }
      setAberto(false);
    });
  }

  return (
    <>
      <Botao variante={variante} onClick={() => setAberto(true)} disabled={ocupado}>
        {texto}
      </Botao>
      {resposta && <Aviso tipo={resposta.tipo}>{resposta.texto}</Aviso>}
      <DialogoConfirmacao
        aberto={aberto}
        titulo={titulo}
        textoConfirmar={textoConfirmar}
        perigo={perigo}
        ocupado={ocupado}
        onConfirmar={confirmar}
        onVoltar={() => setAberto(false)}
      >
        {children}
      </DialogoConfirmacao>
    </>
  );
}
