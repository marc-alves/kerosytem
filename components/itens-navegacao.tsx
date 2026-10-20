"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, destinoAtual, type Destino } from "@/components/destinos";
import { IconeEstrela, IconeLista, IconeMais, IconePessoas } from "@/components/icones";
import type { ReactNode } from "react";

const icones: Record<Destino, ReactNode> = {
  "/vendas/nova": <IconeMais />,
  "/vendas": <IconeLista />,
  "/indicadores": <IconePessoas />,
  "/fidelidade": <IconeEstrela />,
};

const nomes = Object.fromEntries(DESTINOS.map((d) => [d.href, d.nome])) as Record<Destino, string>;

/** Itens dos módulos ativos, com o destino atual marcado; `atual = null` não marca nenhum. */
export function Itens({ destinos, atual }: { destinos: readonly Destino[]; atual: Destino | null }) {
  return (
    // Colunas iguais, mas nenhuma menor que a palavra mais longa ("Indicadores" em 360px com 4 destinos).
    <ul className="mx-auto flex min-h-18 max-w-app">
      {destinos.map((href) => {
        const nome = nomes[href];
        const marcado = href === atual;
        const destaque = href === "/vendas/nova";
        return (
          <li key={href} className="flex-1 basis-0">
            <Link
              href={href}
              aria-current={marcado ? "page" : undefined}
              className={
                "flex min-h-18 flex-col items-center justify-center gap-1 border-t-4 px-1 py-2 text-center text-pequeno break-words " +
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

export function ItensComDestinoAtual({ destinos }: { destinos: readonly Destino[] }) {
  return <Itens destinos={destinos} atual={destinoAtual(usePathname())} />;
}
