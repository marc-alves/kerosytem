import { recusa, type Recusa } from "@/lib/casos-de-uso/resultado";
import type { CartaoPublicoDados, Programa, RepositorioFidelidade } from "@/lib/dados/tipos";
import { escolherCarimbosDoResgate, estadoCartao, podeDesfazerResgate } from "@/lib/fidelidade/cartao";
import { combinaBusca, historicoPublico, ordenarCartoes, type ItemHistoricoPublico } from "@/lib/fidelidade/lista";
import { escolherMensagem, primeiroNome } from "@/lib/fidelidade/mensagem";
import type { EstadoCartao } from "@/lib/fidelidade/tipos";
import type { Centavos, Telefone } from "@/lib/indicacao/tipos";
import { validarPrograma, type CamposPrograma, type EntradaPrograma } from "@/lib/fidelidade/programa";

/** Spec 10.4: cria ou ajusta o programa da empresa (RF1, RF2); vale daqui para frente. */
export async function salvarPrograma(
  repo: RepositorioFidelidade,
  entrada: EntradaPrograma,
  agora: Date,
): Promise<{ ok: true; programa: Programa; criado: boolean } | Recusa<CamposPrograma>> {
  const validacao = validarPrograma(entrada);
  if (!validacao.ok) return recusa(validacao.erros);
  const criado = (await repo.programa()) === null;
  return { ok: true, programa: await repo.salvarPrograma(validacao.programa, agora), criado };
}

const SEM_PROGRAMA = "O cartão fidelidade ainda não foi criado.";
const CARTAO_NAO_ENCONTRADO = "Cartão não encontrado.";

/** RF6: entrega o prêmio com os carimbos liberados mais antigos, ou recusa (spec 10.2). */
export async function registrarResgate(
  repo: RepositorioFidelidade,
  clienteId: string,
  agora: Date,
): Promise<{ ok: true; premio: string } | Recusa<never>> {
  const programa = await repo.programa();
  if (!programa) return recusa({ geral: SEM_PROGRAMA });
  const cartao = await repo.cartaoCliente(clienteId);
  if (!cartao) return recusa({ geral: CARTAO_NAO_ENCONTRADO });
  const escolha = escolherCarimbosDoResgate({
    carimbos: cartao.carimbos,
    meta: programa.meta,
    agora,
    nomeCliente: cartao.cliente.nome,
  });
  if (!escolha.ok) return recusa({ geral: escolha.mensagem });
  await repo.inserirResgate(
    { clienteId, meta: programa.meta, premio: programa.premio, carimboIds: escolha.carimboIds },
    agora,
  );
  return { ok: true, premio: programa.premio };
}

/** RF7: os carimbos voltam ao cartão; o resgate fica no histórico como desfeito. */
export async function desfazerResgate(
  repo: RepositorioFidelidade,
  entrada: { clienteId: string; resgateId: string },
  agora: Date,
): Promise<{ ok: true } | Recusa<never>> {
  const resgate = (await repo.cartaoCliente(entrada.clienteId))?.resgates.find((r) => r.id === entrada.resgateId);
  if (!resgate) return recusa({ geral: "Resgate não encontrado." });
  const pode = podeDesfazerResgate(resgate);
  if (!pode.ok) return recusa({ geral: pode.mensagem });
  await repo.desfazerResgate(resgate.id, agora);
  return { ok: true };
}

/** RF8: chave nova; o link antigo para de funcionar na hora. */
export async function gerarNovoLink(
  repo: RepositorioFidelidade,
  clienteId: string,
  agora: Date,
  gerarChave: () => string,
): Promise<{ ok: true } | Recusa<never>> {
  if (!(await repo.cartaoCliente(clienteId))) return recusa({ geral: CARTAO_NAO_ENCONTRADO });
  await repo.trocarChave(clienteId, gerarChave(), agora);
  return { ok: true };
}

// ---- Leituras (F16) ----

type ClienteDoCartao = { id: string; nome: string; telefone: Telefone };

/** Spec 10.1: programa e cartões, já filtrados pela busca e na ordem da tela. */
export async function listarCartoes(
  repo: RepositorioFidelidade,
  busca: string,
  agora: Date,
): Promise<{ programa: Programa | null; total: number; cartoes: { cliente: ClienteDoCartao; estado: EstadoCartao }[] }> {
  const programa = await repo.programa();
  if (!programa) return { programa: null, total: 0, cartoes: [] };
  const todos = (await repo.listarCartoes()).map((c) => ({
    nome: c.cliente.nome,
    cliente: c.cliente,
    estado: estadoCartao({ carimbos: c.carimbos, meta: programa.meta, agora }),
  }));
  const achados = todos.filter((c) => combinaBusca(c.cliente, busca));
  return {
    programa,
    total: todos.length,
    cartoes: ordenarCartoes(achados).map(({ cliente, estado }) => ({ cliente, estado })),
  };
}

export type ItemHistorico =
  | {
      tipo: "carimbo";
      id: string;
      em: Date;
      valorFinal: Centavos;
      liberadoEm: Date;
      liberado: boolean;
      /** Venda cancelada: carimbo retirado (RF5). */
      retiradoEm: Date | null;
    }
  | { tipo: "resgate"; id: string; em: Date; premio: string; meta: number; desfeitoEm: Date | null };

export type CartaoClienteVisto = {
  cliente: ClienteDoCartao;
  programa: Programa;
  estado: EstadoCartao;
  link: string;
  /** Mensagem do botão "Copiar mensagem" (spec 10.2). */
  mensagem: string;
  /** Mais novos primeiro. */
  historico: ItemHistorico[];
};

/** Spec 10.2; `null` se não há programa ou o cliente não tem cartão nesta empresa. */
export async function verCartaoCliente(
  repo: RepositorioFidelidade,
  clienteId: string,
  agora: Date,
  contexto: { empresaNome: string; link: (chave: string) => string },
): Promise<CartaoClienteVisto | null> {
  const [programa, cartao] = await Promise.all([repo.programa(), repo.cartaoCliente(clienteId)]);
  if (!programa || !cartao) return null;
  const estado = estadoCartao({ carimbos: cartao.carimbos, meta: programa.meta, agora });
  const link = contexto.link(cartao.chave);
  const historico: ItemHistorico[] = [
    ...cartao.carimbos.map((c) => ({
      tipo: "carimbo" as const,
      id: c.id,
      em: c.criadoEm,
      valorFinal: c.venda.valorFinal,
      liberadoEm: c.liberadoEm,
      liberado: c.liberadoEm.getTime() <= agora.getTime(),
      retiradoEm: c.retiradoEm,
    })),
    ...cartao.resgates.map((r) => ({
      tipo: "resgate" as const,
      id: r.id,
      em: r.criadoEm,
      premio: r.premio,
      meta: r.meta,
      desfeitoEm: r.desfeitoEm,
    })),
  ].sort((a, b) => b.em.getTime() - a.em.getTime());
  return {
    cliente: cartao.cliente,
    programa,
    estado,
    link,
    mensagem: escolherMensagem({
      nome: cartao.cliente.nome,
      empresa: contexto.empresaNome,
      link,
      premio: programa.premio,
      estado,
      momento: "cartao",
    }),
    historico,
  };
}

export type CartaoPublicoVisto = {
  empresaNome: string;
  primeiroNome: string;
  premio: string;
  valorMinimo: Centavos | null;
  estado: EstadoCartao;
  historico: ItemHistoricoPublico[];
};

/** Spec 11.1: monta a página do cliente só com o que a RF9 deixa; `null` = "não encontrado". */
export function verCartaoPublico(dados: CartaoPublicoDados | null, agora: Date): CartaoPublicoVisto | null {
  if (!dados) return null;
  return {
    empresaNome: dados.empresaNome,
    primeiroNome: primeiroNome(dados.clienteNome),
    premio: dados.programa.premio,
    valorMinimo: dados.programa.valorMinimo,
    estado: estadoCartao({ carimbos: dados.carimbos, meta: dados.programa.meta, agora }),
    historico: historicoPublico(dados.carimbos, dados.resgates),
  };
}
