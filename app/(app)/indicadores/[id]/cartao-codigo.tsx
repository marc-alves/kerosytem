"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { acaoDefinirCodigoAtivo } from "@/app/(app)/indicadores/acoes";
import { Aviso } from "@/components/aviso";
import { Botao, classesBotao } from "@/components/botao";
import { Cartao } from "@/components/cartao";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import { SeloCodigo } from "@/components/selo-status";
import type { CodigoComUsos } from "@/lib/dados/tipos";
import { formatarPercentual } from "@/lib/formato/numero";
import { formatarData } from "@/lib/indicacao/periodo";
import type { Data } from "@/lib/indicacao/tipos";

const ROTULO_TIPO = { normal: "Normal", primeira_compra: "Primeira compra" } as const;

/** "Sem validade", "Vale até 31/12/2026" ou "Venceu em 31/12/2026" (spec 10.3, RN2). */
function descreverValidade(validoAte: Data | null, hoje: Data): string {
  if (validoAte === null) return "Sem validade";
  return validoAte < hoje ? `Venceu em ${formatarData(validoAte)}` : `Vale até ${formatarData(validoAte)}`;
}

/** Cartão de código do detalhe do indicador (spec 10.3), com desativar/reativar (RN2). */
export function CartaoCodigo({
  codigo,
  hoje,
  indicadorNome,
  novoCodigoHref,
}: {
  codigo: CodigoComUsos;
  /** Dia de hoje em Brasília, calculado no servidor. */
  hoje: Data;
  indicadorNome: string;
  novoCodigoHref: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const ativar = !codigo.ativo;

  function confirmar() {
    iniciar(async () => {
      try {
        const resultado = await acaoDefinirCodigoAtivo(codigo.id, ativar);
        setErro(resultado.ok ? null : (resultado.erros.geral ?? ERRO_AO_SALVAR));
      } catch {
        setErro(ERRO_AO_SALVAR);
      }
      setAberto(false);
    });
  }

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-valor font-semibold">{codigo.codigo}</p>
        <p className="text-base">
          {ROTULO_TIPO[codigo.tipo]} · {formatarPercentual(codigo.descontoBp)} de desconto
        </p>
        <p className="text-base">{descreverValidade(codigo.validoAte, hoje)}</p>
        <p className="text-base">
          Usos: {codigo.usos} de {codigo.limiteUsos}
        </p>
      </div>
      <div>
        <SeloCodigo ativo={codigo.ativo} />
      </div>

      {codigo.usos >= codigo.limiteUsos && (
        <Aviso
          acao={
            <Link href={novoCodigoHref} className={classesBotao("secundario")}>
              Criar novo código
            </Link>
          }
        >
          Este código atingiu {codigo.usos} usos, considere gerar um novo código para {indicadorNome}.
        </Aviso>
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <Botao variante="secundario" onClick={() => setAberto(true)}>
        {ativar ? "Reativar código" : "Desativar código"}
      </Botao>

      <DialogoConfirmacao
        aberto={aberto}
        titulo={ativar ? "Reativar código" : "Desativar código"}
        textoConfirmar={ativar ? "Sim, reativar código" : "Sim, desativar código"}
        ocupado={ocupado}
        onConfirmar={confirmar}
        onVoltar={() => setAberto(false)}
      >
        {ativar ? (
          <p>Reativar o código {codigo.codigo}? Ele volta a ser aceito em novas vendas.</p>
        ) : (
          <p>
            Desativar o código {codigo.codigo}? Ele deixa de ser aceito em novas vendas. As vendas antigas não mudam.
          </p>
        )}
      </DialogoConfirmacao>
    </Cartao>
  );
}
