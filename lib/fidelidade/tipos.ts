// Tipos do domínio da fidelidade (spec 002).
import type { Centavos } from "@/lib/indicacao/tipos";

/** RF1: a regra do cartão da empresa. */
export type ProgramaFidelidade = {
  /** Carimbos que completam o cartão, de 2 a 50. */
  meta: number;
  premio: string;
  /** `null` = qualquer valor ganha carimbo. */
  valorMinimo: Centavos | null;
  /** Dias depois do pagamento até o carimbo poder entrar num resgate (RF4); 0 = na hora. */
  diasLiberacao: number;
  /** Vendas lançadas antes disso não dão carimbo (RF3). */
  criadoEm: Date;
};

/** Carimbo já gravado, com o que o cartão precisa (RF4 a RF6). */
export type CarimboParaCartao = {
  id: string;
  /** Data da confirmação da venda. */
  criadoEm: Date;
  liberadoEm: Date;
  /** Resgate não desfeito que usou o carimbo; desfazer o resgate volta a `null` (RF7). */
  resgateId: string | null;
  /** Venda cancelada (RF5). */
  retiradoEm: Date | null;
};

export type ResgateParaHistorico = { id: string; criadoEm: Date; desfeitoEm: Date | null };

/** Situação do cartão de um cliente agora (glossário da spec). */
export type EstadoCartao = {
  meta: number;
  /** Carimbos não retirados nem usados em resgate (liberados + a liberar). */
  noCartao: number;
  liberados: number;
  aLiberar: number;
  /** O que o cartão desenha: de 0 à meta. */
  exibido: number;
  completo: boolean;
  /** Carimbos além da meta, para o próximo cartão. */
  sobra: number;
  faltam: number;
  /** RF6: carimbos liberados ≥ meta. */
  podeResgatar: boolean;
  /** Cartão completo que ainda não dá para resgatar: quando dá. */
  premioLiberadoEm: Date | null;
  /** Quando o próximo carimbo a liberar é liberado. */
  proximaLiberacao: Date | null;
};
