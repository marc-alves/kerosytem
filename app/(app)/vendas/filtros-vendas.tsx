"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Escolha } from "@/components/escolha";
import { PERIODOS, type Periodo } from "@/lib/indicacao/periodo";
import type { StatusVenda } from "@/lib/indicacao/tipos";

export type Filtros = { indicador: string; periodo: Periodo; situacao: StatusVenda | "todas" };

const SITUACOES: ReadonlyArray<{ valor: Filtros["situacao"]; rotulo: string }> = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "pendente", rotulo: "Aguardando pagamento" },
  { valor: "confirmada", rotulo: "Pago" },
  { valor: "cancelada", rotulo: "Cancelada" },
];

/** Spec 10.7: o resultado muda ao escolher, sem botão "Filtrar"; os filtros ficam na URL. */
export function FiltrosVendas({
  filtros,
  indicadores,
}: {
  filtros: Filtros;
  indicadores: ReadonlyArray<{ id: string; nome: string }>;
}) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  // Marca a escolha na hora; a lista chega do servidor logo depois.
  const [atual, marcar] = useOptimistic(filtros);

  function escolher(mudanca: Partial<Filtros>) {
    const novos = { ...atual, ...mudanca };
    iniciar(() => {
      marcar(novos);
      router.replace(`/vendas?${new URLSearchParams(novos)}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-indicador" className="text-base font-semibold">
          Indicador
        </label>
        <select
          id="filtro-indicador"
          value={atual.indicador}
          onChange={(e) => escolher({ indicador: e.target.value })}
          className={
            "min-h-14 w-full rounded-cartao border-2 border-borda-campo bg-superficie px-4 text-base text-texto " +
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-laranja-escuro"
          }
        >
          <option value="todos">Todos</option>
          <option value="sem_codigo">Sem código</option>
          {indicadores.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </select>
      </div>
      <Escolha<Periodo>
        nome="periodo"
        legenda="Período"
        colunas={2}
        valor={atual.periodo}
        onChange={(periodo) => escolher({ periodo })}
        opcoes={PERIODOS}
      />
      <Escolha<Filtros["situacao"]>
        nome="situacao"
        legenda="Situação"
        valor={atual.situacao}
        onChange={(situacao) => escolher({ situacao })}
        opcoes={SITUACOES}
      />
    </div>
  );
}
