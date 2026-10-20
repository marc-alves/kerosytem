import { recusa, type Recusa } from "@/lib/casos-de-uso/resultado";
import type { Programa, RepositorioFidelidade } from "@/lib/dados/tipos";
import { escolherCarimbosDoResgate, podeDesfazerResgate } from "@/lib/fidelidade/cartao";
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
