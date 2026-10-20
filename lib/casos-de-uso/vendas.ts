import { recusa, temErros, type Recusa } from "@/lib/casos-de-uso/resultado";
import type { RepositorioFidelidade, RepositorioIndicacao } from "@/lib/dados/tipos";
import { dataLiberacao, ganhaCarimbo } from "@/lib/fidelidade/carimbo";
import { estadoCartao, podeCancelarPorFidelidade } from "@/lib/fidelidade/cartao";
import { escolherMensagem } from "@/lib/fidelidade/mensagem";
import { lerReais } from "@/lib/formato/leitura";
import { normalizarCodigo, validarCodigo } from "@/lib/indicacao/codigo";
import { podeCancelarVenda, podeConfirmar } from "@/lib/indicacao/status";
import { normalizarTelefone } from "@/lib/indicacao/telefone";
import type { AvisoCodigo, CalculoVenda, PontosBase, Telefone } from "@/lib/indicacao/tipos";
import { calcularVenda } from "@/lib/indicacao/venda";

type CamposCliente = "telefone" | "nome";
type CamposVenda = CamposCliente | "codigo" | "valor";

/** Com o módulo de Indicação desligado, a venda é sempre sem código (spec 000, RE7). */
export type OpcoesVenda = { comCodigo: boolean };
const COM_CODIGO: OpcoesVenda = { comCodigo: true };

/** O que a pessoa digitou nas telas 1 e 2 da Nova venda (spec 10.5), sem nada calculado. */
export type EntradaVenda = { telefone: string; nome: string; codigo: string; valor: string };

/** Tela 3 da spec 10.5. */
export type PreviaVenda = {
  cliente: { id: string | null; nome: string; telefone: Telefone };
  codigo: { id: string; codigo: string; indicadorNome: string; descontoBp: PontosBase } | null;
  calculo: CalculoVenda;
  avisos: AvisoCodigo[];
};

/** Tela 1: "Cliente: {nome}" se existe; senão, o campo de nome aparece. */
export async function buscarClientePorTelefone(
  repo: RepositorioIndicacao,
  texto: string,
): Promise<{ ok: true; telefone: Telefone; nome: string | null } | Recusa<"telefone">> {
  const telefone = normalizarTelefone(texto);
  if (!telefone.ok) return recusa({ telefone: telefone.mensagem });
  const { cliente } = await repo.buscarCliente(telefone.telefone);
  return { ok: true, telefone: telefone.telefone, nome: cliente?.nome ?? null };
}

/**
 * Valida e calcula sem gravar (telas 1 e 2 da spec 10.5): telefone (RN4), nome de cliente novo,
 * código (RN2 a RN7, opcional, RN9) e valor; calcula o desconto no servidor (RN8).
 */
export async function previaVenda(
  repo: RepositorioIndicacao,
  entrada: EntradaVenda,
  agora: Date,
  opcoes: OpcoesVenda = COM_CODIGO,
): Promise<{ ok: true; previa: PreviaVenda } | Recusa<CamposVenda>> {
  const telefone = normalizarTelefone(entrada.telefone);
  if (!telefone.ok) return recusa({ telefone: telefone.mensagem });

  const { cliente, paraValidar } = await repo.buscarCliente(telefone.telefone);
  const nome = cliente?.nome ?? entrada.nome.trim();
  if (nome === "") return recusa({ nome: "Digite o nome do cliente." });

  const erros: Partial<Record<CamposVenda, string>> = {};
  const valor = lerReais(entrada.valor);
  if (!valor.ok) erros.valor = valor.mensagem;

  const textoCodigo = normalizarCodigo(entrada.codigo);
  let codigo: PreviaVenda["codigo"] = null;
  let avisos: AvisoCodigo[] = [];
  if (textoCodigo !== "" && !opcoes.comCodigo) {
    erros.codigo = "Esta empresa não usa códigos de desconto. Lance sem código.";
  } else if (textoCodigo !== "") {
    const encontrado = await repo.buscarCodigo(textoCodigo);
    const validacao = validarCodigo({ codigo: encontrado, cliente: paraValidar, agora });
    if (!validacao.ok) erros.codigo = validacao.mensagem;
    else {
      codigo = {
        id: encontrado!.id,
        codigo: validacao.codigo.codigo,
        indicadorNome: validacao.codigo.indicadorNome,
        descontoBp: validacao.codigo.descontoBp,
      };
      avisos = validacao.avisos;
    }
  }

  if (temErros(erros) || !valor.ok) return recusa(erros);

  return {
    ok: true,
    previa: {
      cliente: { id: cliente?.id ?? null, nome, telefone: telefone.telefone },
      codigo,
      calculo: calcularVenda({ valorOriginal: valor.centavos, descontoBp: codigo?.descontoBp ?? 0 }),
      avisos,
    },
  };
}

/**
 * Tela 3: valida e calcula de novo (algo pode ter mudado desde a prévia), cria o cliente
 * se for novo e grava a venda como pendente (RN10).
 */
export async function lancarVenda(
  repo: RepositorioIndicacao,
  entrada: EntradaVenda,
  agora: Date,
  opcoes: OpcoesVenda = COM_CODIGO,
): Promise<{ ok: true; vendaId: string } | Recusa<CamposVenda>> {
  const resultado = await previaVenda(repo, entrada, agora, opcoes);
  if (!resultado.ok) return resultado;
  const { cliente, codigo, calculo } = resultado.previa;

  const clienteId = cliente.id ?? (await repo.inserirCliente({ nome: cliente.nome, telefone: cliente.telefone }, agora)).id;
  const venda = await repo.inserirVenda({ clienteId, codigoId: codigo?.id ?? null, calculo }, agora);
  return { ok: true, vendaId: venda.id };
}

const VENDA_NAO_ENCONTRADA = "Venda não encontrada.";

/** Fidelidade na confirmação (spec 002): só é passada com o módulo ativo na empresa. */
export type FidelidadeNaVenda = {
  repo: RepositorioFidelidade;
  empresaNome: string;
  /** Endereço completo do cartão (RF8). */
  link: (chave: string) => string;
  gerarChave: () => string;
};

/** Frase de sucesso da confirmação com carimbo (spec 002, 10.3). */
export type CarimboGanho = {
  clienteId: string;
  nome: string;
  exibido: number;
  meta: number;
  completo: boolean;
  /** Mensagem da seção 8 da spec 002, para o botão "Copiar mensagem do cartão". */
  mensagem: string;
};

/**
 * RN10: revalida o vínculo (RN6) e a primeira compra (RN5) com o estado de agora;
 * na primeira venda confirmada com código, liga o cliente ao indicador.
 * Com a fidelidade, dá o carimbo na mesma gravação (spec 002, RF3, RF4).
 */
export async function confirmarRecebimento(
  repo: RepositorioIndicacao,
  vendaId: string,
  agora: Date,
  fidelidade: FidelidadeNaVenda | null = null,
): Promise<{ ok: true; carimbo: CarimboGanho | null } | Recusa<never>> {
  const venda = await repo.venda(vendaId);
  if (!venda) return recusa({ geral: VENDA_NAO_ENCONTRADA });
  const { paraValidar } = await repo.buscarCliente(venda.cliente.telefone);
  const resultado = podeConfirmar({ venda, cliente: paraValidar });
  if (!resultado.ok) return recusa({ geral: resultado.mensagem });
  const vincularA = resultado.criarVinculo && venda.codigo ? venda.codigo.indicadorId : null;

  const programa = fidelidade && (await fidelidade.repo.programa());
  const daCarimbo = programa && ganhaCarimbo({ venda: { ...venda, status: "confirmada" }, programa });
  const carimbo = daCarimbo
    ? {
        valorMinimoAplicado: programa.valorMinimo,
        liberadoEm: dataLiberacao({ confirmadaEm: agora, diasLiberacao: programa.diasLiberacao }),
        chave: fidelidade!.gerarChave(),
      }
    : null;
  await repo.confirmarVenda(vendaId, vincularA, agora, carimbo);
  if (!daCarimbo) return { ok: true, carimbo: null };

  const cartao = (await fidelidade!.repo.cartaoCliente(venda.cliente.id))!;
  const estado = estadoCartao({ carimbos: cartao.carimbos, meta: programa.meta, agora });
  return {
    ok: true,
    carimbo: {
      clienteId: venda.cliente.id,
      nome: venda.cliente.nome,
      exibido: estado.exibido,
      meta: estado.meta,
      completo: estado.completo,
      mensagem: escolherMensagem({
        nome: venda.cliente.nome,
        empresa: fidelidade!.empresaNome,
        link: fidelidade!.link(cartao.chave),
        premio: programa.premio,
        estado,
        momento: "carimbo",
      }),
    },
  };
}

/**
 * RN12: pendente ou paga, cancelar é livre; o vínculo do cliente não é desfeito (RN6).
 * Exceção (spec 002, RF5): venda já usada num resgate é recusada, com o cliente para o link
 * "Abrir cartão". Vale mesmo com a fidelidade desligada, para o cartão não ficar errado se ela voltar.
 */
export async function cancelarVenda(
  repo: RepositorioIndicacao,
  vendaId: string,
  agora: Date,
  fidelidade: RepositorioFidelidade | null = null,
): Promise<{ ok: true } | (Recusa<never> & { cartaoClienteId?: string })> {
  const venda = await repo.venda(vendaId);
  if (!venda) return recusa({ geral: VENDA_NAO_ENCONTRADA });
  const resultado = podeCancelarVenda(venda);
  if (!resultado.ok) return recusa({ geral: resultado.mensagem });
  if (fidelidade) {
    const carimbo = await fidelidade.carimboDaVenda(vendaId);
    const porFidelidade = podeCancelarPorFidelidade({ carimbo, nomeCliente: venda.cliente.nome });
    if (!porFidelidade.ok) return { ...recusa({ geral: porFidelidade.mensagem }), cartaoClienteId: venda.cliente.id };
  }
  await repo.cancelarVenda(vendaId, agora);
  return { ok: true };
}
