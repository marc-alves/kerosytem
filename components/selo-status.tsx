import type { ReactNode } from "react";
import { IconeCheck, IconeDesativado, IconeRelogio, IconeX } from "@/components/icones";
import type { StatusVenda } from "@/lib/indicacao/tipos";

/** Rótulos fixos da venda na tela (spec RN10, DESIGN.md seção 10). */
export const ROTULO_STATUS: Record<StatusVenda, string> = {
  pendente: "Aguardando pagamento",
  confirmada: "Pago",
  cancelada: "Cancelada",
};

const estiloVenda: Record<StatusVenda, { classes: string; icone: ReactNode }> = {
  pendente: { classes: "bg-aviso-fundo text-aviso-texto", icone: <IconeRelogio /> },
  confirmada: { classes: "bg-pago-fundo text-pago-texto", icone: <IconeCheck /> },
  cancelada: { classes: "bg-erro-fundo text-erro-texto", icone: <IconeX /> },
};

/** Pílula com ícone + texto; nunca só a cor. */
function Pilula({ classes, icone, children }: { classes: string; icone: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold ${classes}`}>
      {icone}
      {children}
    </span>
  );
}

export function SeloStatus({ status }: { status: StatusVenda }) {
  const { classes, icone } = estiloVenda[status];
  return (
    <Pilula classes={classes} icone={icone}>
      {ROTULO_STATUS[status]}
    </Pilula>
  );
}

/** Selo do código no detalhe do indicador (spec 10.3). */
export function SeloCodigo({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <Pilula classes="bg-pago-fundo text-pago-texto" icone={<IconeCheck />}>
      Ativo
    </Pilula>
  ) : (
    <Pilula classes="bg-creme text-texto-suave" icone={<IconeDesativado />}>
      Desativado
    </Pilula>
  );
}
