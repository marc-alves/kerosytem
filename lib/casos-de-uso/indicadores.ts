import { recusa, temErros, type Recusa } from "@/lib/casos-de-uso/resultado";
import { ViolacaoUnicidade, type RepositorioIndicacao } from "@/lib/dados/tipos";
import { lerPercentual } from "@/lib/formato/leitura";
import { normalizarCodigo } from "@/lib/indicacao/codigo";
import { dataEmBrasilia } from "@/lib/indicacao/periodo";
import { normalizarTelefone } from "@/lib/indicacao/telefone";
import type { Data, PontosBase, TipoCodigo } from "@/lib/indicacao/tipos";

const TELEFONE_REPETIDO = "Este telefone já é de outro indicador.";
const CODIGO_REPETIDO = "Este código já existe. Escolha outro.";

/** Spec 10.2: nome obrigatório, telefone válido (RN4) e único na empresa. */
export async function cadastrarIndicador(
  repo: RepositorioIndicacao,
  entrada: { nome: string; telefone: string },
  agora: Date,
): Promise<{ ok: true; id: string; nome: string } | Recusa<"nome" | "telefone">> {
  const nome = entrada.nome.trim();
  const telefone = normalizarTelefone(entrada.telefone);
  const erros: Partial<Record<"nome" | "telefone", string>> = {};
  if (nome === "") erros.nome = "Digite o nome do indicador.";
  if (!telefone.ok) erros.telefone = telefone.mensagem;
  if (temErros(erros) || !telefone.ok) return recusa(erros);

  try {
    const indicador = await repo.inserirIndicador({ nome, telefone: telefone.telefone }, agora);
    return { ok: true, id: indicador.id, nome: indicador.nome };
  } catch (e) {
    if (e instanceof ViolacaoUnicidade) return recusa({ telefone: TELEFONE_REPETIDO });
    throw e;
  }
}

type CamposPasso1 = "codigo" | "desconto";
type CamposPasso2 = "validade" | "limite";

/** Passo 1 da spec 10.4: código (RN1, único na empresa) e desconto de 0% a 100%. */
export async function conferirPasso1Codigo(
  repo: RepositorioIndicacao,
  entrada: { codigo: string; desconto: string },
): Promise<{ ok: true; codigo: string; descontoBp: PontosBase } | Recusa<CamposPasso1>> {
  const codigo = normalizarCodigo(entrada.codigo);
  const desconto = lerPercentual(entrada.desconto);
  const erros: Partial<Record<CamposPasso1, string>> = {};
  if (codigo === "") erros.codigo = "Digite o código.";
  else if (await repo.codigoExiste(codigo)) erros.codigo = CODIGO_REPETIDO;
  if (!desconto.ok) erros.desconto = desconto.mensagem;
  if (temErros(erros) || !desconto.ok) return recusa(erros);
  return { ok: true, codigo, descontoBp: desconto.bp };
}

/** `AAAA-MM-DD` de um dia que existe. */
function dataValida(texto: string): texto is Data {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** Spec 10.4, os dois passos de novo no servidor, e grava (RN1). */
export async function criarCodigo(
  repo: RepositorioIndicacao,
  entrada: {
    indicadorId: string;
    codigo: string;
    tipo: string;
    desconto: string;
    /** `null` = sem validade; senão `AAAA-MM-DD`. */
    validoAte: string | null;
    limite: string;
  },
  agora: Date,
): Promise<{ ok: true; codigo: string } | Recusa<CamposPasso1 | CamposPasso2 | "tipo">> {
  const indicador = await repo.detalheIndicador(entrada.indicadorId);
  if (!indicador) return recusa({ geral: "Indicador não encontrado." });

  const passo1 = await conferirPasso1Codigo(repo, entrada);
  const erros: Partial<Record<CamposPasso1 | CamposPasso2 | "tipo", string>> = passo1.ok ? {} : { ...passo1.erros };

  if (entrada.tipo !== "normal" && entrada.tipo !== "primeira_compra") erros.tipo = "Escolha o tipo do código.";

  const { validoAte } = entrada;
  if (validoAte !== null && (!dataValida(validoAte) || validoAte < dataEmBrasilia(agora))) {
    erros.validade = "Escolha uma data de hoje em diante.";
  }

  const limite = /^\s*\d+\s*$/.test(entrada.limite) ? Number(entrada.limite) : 0;
  if (!Number.isSafeInteger(limite) || limite < 1) erros.limite = "O limite precisa ser de pelo menos 1 uso.";

  if (temErros(erros) || !passo1.ok) return recusa(erros);

  try {
    await repo.inserirCodigo(
      {
        codigo: passo1.codigo,
        indicadorId: entrada.indicadorId,
        tipo: entrada.tipo as TipoCodigo,
        descontoBp: passo1.descontoBp,
        validoAte,
        limiteUsos: limite,
      },
      agora,
    );
    return { ok: true, codigo: passo1.codigo };
  } catch (e) {
    if (e instanceof ViolacaoUnicidade) return recusa({ codigo: CODIGO_REPETIDO });
    throw e;
  }
}

/** RN2: desativar e reativar é o único ajuste depois de criado. */
export async function definirCodigoAtivo(
  repo: RepositorioIndicacao,
  entrada: { codigoId: string; ativo: boolean },
): Promise<{ ok: true } | Recusa<never>> {
  const achou = await repo.definirCodigoAtivo(entrada.codigoId, entrada.ativo);
  return achou ? { ok: true } : recusa({ geral: "Código não encontrado." });
}
