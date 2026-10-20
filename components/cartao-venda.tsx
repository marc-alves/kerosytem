"use client";

import { useState, useTransition } from "react";
import { acaoCancelarVenda, acaoConfirmarRecebimento } from "@/app/(app)/vendas/acoes";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Cartao } from "@/components/cartao";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import { SeloStatus } from "@/components/selo-status";
import type { VendaListada } from "@/lib/dados/tipos";
import { descreverCodigo } from "@/lib/formato/codigo";
import { formatarReais } from "@/lib/formato/numero";
import { dataEmBrasilia, formatarData, formatarDataHora } from "@/lib/indicacao/periodo";

/**
 * Venda com **Confirmar recebimento** (só aguardando) e **Cancelar venda** (não nas canceladas),
 * cada um com o diálogo da spec 10.8. Recusas do servidor ficam no cartão até a próxima ação.
 */
export function CartaoVenda({ venda }: { venda: VendaListada }) {
  const [dialogo, setDialogo] = useState<"confirmar" | "cancelar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  // "R$" e o número nunca em linhas diferentes.
  const valor = <span className="whitespace-nowrap">{formatarReais(venda.valorFinal)}</span>;
  const nome = venda.cliente.nome;

  function executar(acao: (id: string) => Promise<{ ok: true } | { ok: false; erros: { geral?: string } }>) {
    iniciar(async () => {
      try {
        const resultado = await acao(venda.id);
        setErro(resultado.ok ? null : (resultado.erros.geral ?? ERRO_AO_SALVAR));
      } catch {
        setErro(ERRO_AO_SALVAR);
      }
      setDialogo(null);
    });
  }

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-botao font-semibold">{nome}</p>
        <p className="text-base">{descreverCodigo(venda.codigo)}</p>
        <p className="text-valor font-semibold tabular-nums">{valor}</p>
        <p className="text-base text-texto-suave">Lançada em {formatarDataHora(venda.criadoEm)}</p>
        {venda.canceladaEm && (
          <p className="text-base text-texto-suave">Cancelada em {formatarData(dataEmBrasilia(venda.canceladaEm))}</p>
        )}
      </div>
      <div>
        <SeloStatus status={venda.status} />
      </div>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {venda.status === "pendente" && (
        <Botao onClick={() => setDialogo("confirmar")}>Confirmar recebimento</Botao>
      )}
      {venda.status !== "cancelada" && (
        // Afastado do botão principal (DESIGN.md seção 3).
        <Botao variante="perigo" className="mt-4" onClick={() => setDialogo("cancelar")}>
          Cancelar venda
        </Botao>
      )}

      <DialogoConfirmacao
        aberto={dialogo === "confirmar"}
        titulo="Confirmar recebimento"
        textoConfirmar="Sim, confirmar recebimento"
        ocupado={ocupado}
        onConfirmar={() => executar(acaoConfirmarRecebimento)}
        onVoltar={() => setDialogo(null)}
      >
        <p>
          Confirmar recebimento de {valor} de {nome}?
        </p>
      </DialogoConfirmacao>

      <DialogoConfirmacao
        aberto={dialogo === "cancelar"}
        titulo="Cancelar venda"
        textoConfirmar="Sim, cancelar venda"
        perigo
        ocupado={ocupado}
        onConfirmar={() => executar(acaoCancelarVenda)}
        onVoltar={() => setDialogo(null)}
      >
        <p>
          Cancelar esta venda de {valor} de {nome}?
        </p>
        {venda.status === "confirmada" && venda.codigo && <p>Ela deixa de contar como uso do código.</p>}
      </DialogoConfirmacao>
    </Cartao>
  );
}
