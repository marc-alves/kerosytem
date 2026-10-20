"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, destinoAtual, type Destino } from "@/components/destinos";
import { IconeLista, IconeMais, IconePessoas } from "@/components/icones";
import type { ReactNode } from "react";

const icones: Record<Destino, ReactNode> = {
  "/vendas/nova": <IconeMais />,
  "/vendas": <IconeLista />,
  "/indicadores": <IconePessoas />,
};

/** Itens com o destino atual marcado; `atual = null` não marca nenhum. */
export function Itens({ atual }: { atual: Destino | null }) {
  return (
    <ul className="mx-auto grid max-w-app grid-cols-3">
      {DESTINOS.map(({ href, nome }) => {
        const marcado = href === atual;
        const destaque = href === "/vendas/nova";
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={marcado ? "page" : undefined}
              className={
                "flex min-h-18 flex-col items-center justify-center gap-1 border-t-4 px-1 py-2 text-center text-pequeno " +
                "focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-laranja-escuro " +
                (marcado ? "border-laranja-escuro bg-creme font-bold" : "border-transparent font-semibold")
              }
            >
              <span
                className={
                  "flex size-10 items-center justify-center rounded-full text-botao " +
                  (destaque ? "border border-laranja-escuro bg-laranja" : "")
                }
              >
                {icones[href]}
              </span>
              {nome}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ItensComDestinoAtual() {
  return <Itens atual={destinoAtual(usePathname())} />;
}
