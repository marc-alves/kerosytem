"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { acaoCancelarVenda, acaoConfirmarRecebimento } from "@/app/(app)/vendas/acoes";
import { Aviso } from "@/components/aviso";
import { Botao, classesBotao } from "@/components/botao";
import { BotaoCopiar } from "@/components/botao-copiar";
import { Cartao } from "@/components/cartao";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import { SeloStatus } from "@/components/selo-status";
import type { CarimboGanho } from "@/lib/casos-de-uso/vendas";
import type { VendaListada } from "@/lib/dados/tipos";
import { descreverCodigo } from "@/lib/formato/codigo";
import { formatarReais } from "@/lib/formato/numero";
import { dataEmBrasilia, formatarData, formatarDataHora } from "@/lib/indicacao/periodo";

/**
 * Venda com **Confirmar recebimento** (só aguardando) e **Cancelar venda** (não nas canceladas),
 * cada um com o diálogo da spec 10.8. Recusas do servidor ficam no cartão até a próxima ação.
 * `mostrarCodigo = false` sem o módulo de Indicação (spec 000, RE7).
 */
export function CartaoVenda({ venda, mostrarCodigo = true }: { venda: VendaListada; mostrarCodigo?: boolean }) {
  const [dialogo, setDialogo] = useState<"confirmar" | "cancelar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Cancelamento recusado por resgate: link para o cartão do cliente (spec 002, 10.3).
  const [cartaoDoCliente, setCartaoDoCliente] = useState<string | null>(null);
  // Frase e mensagem do carimbo depois de confirmar; ficam até sair da tela (spec 002, 10.3).
  const [carimbo, setCarimbo] = useState<CarimboGanho | null>(null);
  const [ocupado, iniciar] = useTransition();
  // "R$" e o número nunca em linhas diferentes.
  const valor = <span className="whitespace-nowrap">{formatarReais(venda.valorFinal)}</span>;
  const nome = venda.cliente.nome;

  function executar(
    acao: (
      id: string,
    ) => Promise<
      | { ok: true; carimbo?: CarimboGanho | null }
      | { ok: false; erros: { geral?: string }; cartaoClienteId?: string }
    >,
  ) {
    iniciar(async () => {
      try {
        const resultado = await acao(venda.id);
        setErro(resultado.ok ? null : (resultado.erros.geral ?? ERRO_AO_SALVAR));
        setCartaoDoCliente(resultado.ok ? null : (resultado.cartaoClienteId ?? null));
        if (resultado.ok && resultado.carimbo) setCarimbo(resultado.carimbo);
      } catch {
        setErro(ERRO_AO_SALVAR);
      }
      setDialogo(null);
    });
  }

  // Carimbo que ainda está no cartão: o cancelamento o retira (spec 002, 10.3).
  const tiraCarimbo = venda.carimbo !== null && !venda.carimbo.retirado && !venda.carimbo.usadoEmResgate;

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-botao font-semibold">{nome}</p>
        {mostrarCodigo && <p className="text-base">{descreverCodigo(venda.codigo)}</p>}
        <p className="text-valor font-semibold tabular-nums">{valor}</p>
        <p className="text-base text-texto-suave">Lançada em {formatarDataHora(venda.criadoEm)}</p>
        {venda.canceladaEm && (
          <p className="text-base text-texto-suave">Cancelada em {formatarData(dataEmBrasilia(venda.canceladaEm))}</p>
        )}
      </div>
      <div>
        <SeloStatus status={venda.status} />
      </div>

      {carimbo && (
        <Aviso
          tipo="sucesso"
          acao={<BotaoCopiar texto={carimbo.mensagem} rotulo="Copiar mensagem do cartão" variante="secundario" />}
        >
          {carimbo.completo
            ? `${carimbo.nome} completou o cartão!`
            : `${carimbo.nome} ganhou 1 carimbo: ${carimbo.exibido} de ${carimbo.meta}.`}
        </Aviso>
      )}

      {erro && (
        <Aviso
          tipo="erro"
          acao={
            cartaoDoCliente && (
              <Link href={`/fidelidade/clientes/${cartaoDoCliente}`} className={classesBotao("secundario")}>
                Abrir cartão de {nome}
              </Link>
            )
          }
        >
          {erro}
        </Aviso>
      )}

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
        {tiraCarimbo && <p>O carimbo desta venda sai do cartão de {nome}.</p>}
      </DialogoConfirmacao>
    </Cartao>
  );
}
