import type { EstadoCartao } from "@/lib/fidelidade/tipos";
import { dataEmBrasilia, formatarData } from "@/lib/indicacao/periodo";

/** RF9 e seção 8: "João Silva" → "João". */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

type Base = { nome: string; empresa: string; link: string };

// Seção 8: formato WhatsApp (`*negrito*`); o texto cru é o que o botão copia.

export function gerarMensagemCarimbo(e: Base & { carimbos: number; meta: number; faltam: number; premio: string }): string {
  return (
    `*${primeiroNome(e.nome)}*, sua compra na ${e.empresa} valeu 1 carimbo!\n` +
    `Você tem ${e.carimbos} de ${e.meta}. Faltam ${e.faltam} para ganhar *${e.premio}*.\n` +
    `Veja seu cartão: ${e.link}`
  );
}

export function gerarMensagemCompleto(e: Base & { premio: string }): string {
  return (
    `*${primeiroNome(e.nome)}*, seu cartão da ${e.empresa} está completo!\n` +
    `Você ganhou *${e.premio}*. É só pedir na próxima visita.\n` +
    `Veja seu cartão: ${e.link}`
  );
}

export function gerarMensagemCompletoALiberar(e: Base & { premio: string; liberadoEm: Date }): string {
  return (
    `*${primeiroNome(e.nome)}*, seu cartão da ${e.empresa} está completo!\n` +
    `Você ganhou *${e.premio}*. Pode pedir a partir de ${formatarData(dataEmBrasilia(e.liberadoEm))}.\n` +
    `Veja seu cartão: ${e.link}`
  );
}

export function gerarMensagemLink(e: Base): string {
  return `*${primeiroNome(e.nome)}*, este é o seu cartão fidelidade da ${e.empresa}:\n${e.link}`;
}

/**
 * Qual mensagem copiar: completo (liberado ou a liberar) em qualquer momento; senão,
 * "carimbo ganho" logo depois da confirmação e "só o link" no cartão do cliente (spec 10.2, 10.3).
 */
export function escolherMensagem(
  e: Base & { estado: EstadoCartao; premio: string; momento: "carimbo" | "cartao" },
): string {
  const { estado } = e;
  if (estado.completo) {
    return estado.podeResgatar || estado.premioLiberadoEm === null
      ? gerarMensagemCompleto(e)
      : gerarMensagemCompletoALiberar({ ...e, liberadoEm: estado.premioLiberadoEm });
  }
  if (e.momento === "carimbo") {
    return gerarMensagemCarimbo({ ...e, carimbos: estado.noCartao, meta: estado.meta, faltam: estado.faltam });
  }
  return gerarMensagemLink(e);
}
