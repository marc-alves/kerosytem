import type { Data } from "@/lib/indicacao/tipos";

const FUSO_BRASILIA = "America/Sao_Paulo";

/** Dia de um instante em Brasília, no formato `AAAA-MM-DD`. */
export function dataEmBrasilia(instante: Date): Data {
  // O formato en-CA já sai como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_BRASILIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** `AAAA-MM-DD` menos `dias` dias corridos. */
export function diasAntes(data: Data, dias: number): Data {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia - dias)).toISOString().slice(0, 10);
}

/** "2026-12-31" → "31/12/2026". */
export function formatarData(data: Data): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "31/12/2026 às 14:05", no horário de Brasília. */
export function formatarDataHora(instante: Date): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_BRASILIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instante);
  const p = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((x) => x.type === tipo)!.value;
  return `${p("day")}/${p("month")}/${p("year")} às ${p("hour")}:${p("minute")}`;
}

export type Periodo = "hoje" | "7dias" | "30dias" | "tudo";

export const PERIODOS: ReadonlyArray<{ valor: Periodo; rotulo: string }> = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7dias", rotulo: "Últimos 7 dias" },
  { valor: "30dias", rotulo: "Últimos 30 dias" },
  { valor: "tudo", rotulo: "Tudo" },
];

/**
 * Spec 10.7: primeiro dia (em Brasília) que entra no período, contando hoje;
 * `null` em "Tudo". "Últimos 7 dias" = hoje e os 6 dias antes.
 */
export function inicioDoPeriodo(periodo: Periodo, agora: Date): Data | null {
  const hoje = dataEmBrasilia(agora);
  switch (periodo) {
    case "hoje":
      return hoje;
    case "7dias":
      return diasAntes(hoje, 6);
    case "30dias":
      return diasAntes(hoje, 29);
    case "tudo":
      return null;
  }
}
