"use client";

import { useState, useTransition } from "react";
import { acaoCancelarVenda } from "@/app/(app)/vendas/acoes";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { ERRO_AO_SALVAR } from "@/components/mensagens";

/** Link "Desfazer esta venda" (spec 10.6, RN12): cancela a venda recém-lançada. */
export function DesfazerVenda({ vendaId, valor, cliente }: { vendaId: string; valor: string; cliente: string }) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function desfazer() {
    iniciar(async () => {
      try {
        const r = await acaoCancelarVenda(vendaId);
        setErro(r.ok ? null : (r.erros.geral ?? ERRO_AO_SALVAR));
      } catch {
        setErro(ERRO_AO_SALVAR);
      }
      setAberto(false);
    });
  }

  return (
    <>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao variante="link" onClick={() => setAberto(true)}>
        Desfazer esta venda
      </Botao>
      <DialogoConfirmacao
        aberto={aberto}
        titulo="Desfazer venda"
        textoConfirmar="Sim, desfazer venda"
        perigo
        ocupado={ocupado}
        onConfirmar={desfazer}
        onVoltar={() => setAberto(false)}
      >
        <p>
          Desfazer esta venda de <span className="whitespace-nowrap">{valor}</span> de {cliente}? Ela fica como
          cancelada.
        </p>
      </DialogoConfirmacao>
    </>
  );
}
