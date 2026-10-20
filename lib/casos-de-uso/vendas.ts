import { recusa, temErros, type Recusa } from "@/lib/casos-de-uso/resultado";
import type { RepositorioIndicacao } from "@/lib/dados/tipos";
import { lerReais } from "@/lib/formato/leitura";
import { normalizarCodigo, validarCodigo } from "@/lib/indicacao/codigo";
import { normalizarTelefone } from "@/lib/indicacao/telefone";
import type { AvisoCodigo, CalculoVenda, PontosBase, Telefone } from "@/lib/indicacao/tipos";
import { calcularVenda } from "@/lib/indicacao/venda";

type CamposCliente = "telefone" | "nome";
type CamposVenda = CamposCliente | "codigo" | "valor";

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
  if (textoCodigo !== "") {
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
): Promise<{ ok: true; vendaId: string } | Recusa<CamposVenda>> {
  const resultado = await previaVenda(repo, entrada, agora);
  if (!resultado.ok) return resultado;
  const { cliente, codigo, calculo } = resultado.previa;

  const clienteId = cliente.id ?? (await repo.inserirCliente({ nome: cliente.nome, telefone: cliente.telefone }, agora)).id;
  const venda = await repo.inserirVenda({ clienteId, codigoId: codigo?.id ?? null, calculo }, agora);
  return { ok: true, vendaId: venda.id };
}
