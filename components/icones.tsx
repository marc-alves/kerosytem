// Ícones simples, sempre acompanhados de texto (DESIGN.md seção 4). Escalam com a fonte.
import type { SVGProps } from "react";

function Icone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      {...props}
    />
  );
}

export function IconeRelogio() {
  return (
    <Icone>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icone>
  );
}

export function IconeCheck() {
  return (
    <Icone>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icone>
  );
}

export function IconeX() {
  return (
    <Icone>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icone>
  );
}

export function IconeAlerta() {
  return (
    <Icone>
      <path d="M12 3.5L2.5 20h19L12 3.5z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </Icone>
  );
}

export function IconeSemInternet() {
  return (
    <Icone>
      <path d="M3 3l18 18" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14 10.3a10 10 0 0 1 5 2.7M12 20v.01" />
    </Icone>
  );
}

export function IconeMais() {
  return (
    <Icone>
      <path d="M12 5v14M5 12h14" />
    </Icone>
  );
}

export function IconeLista() {
  return (
    <Icone>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </Icone>
  );
}

export function IconePessoas() {
  return (
    <Icone>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </Icone>
  );
}

export function IconeVoltar() {
  return (
    <Icone>
      <path d="M15 5l-7 7 7 7" />
    </Icone>
  );
}

export function IconeDesativado() {
  return (
    <Icone>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </Icone>
  );
}
