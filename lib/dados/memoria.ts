import { dataEmBrasilia } from "@/lib/indicacao/periodo";
import type { Telefone } from "@/lib/indicacao/tipos";
import {
  ViolacaoUnicidade,
  type Banco,
  type CartaoDoCliente,
  type CartaoPublicoDados,
  type RepositorioFidelidade,
  type Codigo,
  type CodigoComUsos,
  type RepositorioIndicacao,
  type ResumoIndicador,
  type Venda,
  type VendaListada,
} from "@/lib/dados/tipos";

/** Mais novo primeiro. */
const maisNovoPrimeiro = (a: { criadoEm: Date }, b: { criadoEm: Date }) =>
  b.criadoEm.getTime() - a.criadoEm.getTime();

/**
 * Banco em memória (provisório, até a T43). Tudo é filtrado por `empresaId`,
 * como a RLS faria; quem chama nunca escolhe a empresa.
 */
export function criarRepositorioEmMemoria(
  banco: Banco,
  empresaId: string,
  gerarId: () => string = () => crypto.randomUUID(),
): RepositorioIndicacao {
  const daEmpresa = <T extends { empresaId: string }>(linhas: T[]) => linhas.filter((l) => l.empresaId === empresaId);
  const indicadores = () => daEmpresa(banco.indicadores);
  const clientes = () => daEmpresa(banco.clientes);
  const codigos = () => daEmpresa(banco.codigos);
  const vendas = () => daEmpresa(banco.vendas);

  const usos = (codigoId: string) =>
    vendas().filter((v) => v.codigoId === codigoId && v.status === "confirmada").length;

  function resumo(indicadorId: string): ResumoIndicador {
    const ind = indicadores().find((i) => i.id === indicadorId)!;
    const seus = codigos().filter((c) => c.indicadorId === indicadorId);
    const ids = new Set(seus.map((c) => c.id));
    const pagas = vendas().filter((v) => v.status === "confirmada" && v.codigoId !== null && ids.has(v.codigoId));
    return {
      id: ind.id,
      nome: ind.nome,
      telefone: ind.telefone,
      codigosAtivos: seus.filter((c) => c.ativo).length,
      vendasPagas: pagas.length,
      totalVendido: pagas.reduce((soma, v) => soma + v.valorFinal, 0),
    };
  }

  function comUsos(c: Codigo): CodigoComUsos {
    return {
      id: c.id,
      codigo: c.codigo,
      tipo: c.tipo,
      descontoBp: c.descontoBp,
      validoAte: c.validoAte,
      limiteUsos: c.limiteUsos,
      ativo: c.ativo,
      criadoEm: c.criadoEm,
      usos: usos(c.id),
    };
  }

  function listada(v: Venda): VendaListada {
    const cliente = clientes().find((c) => c.id === v.clienteId)!;
    const codigo = v.codigoId === null ? null : codigos().find((c) => c.id === v.codigoId)!;
    const indicador = codigo && indicadores().find((i) => i.id === codigo.indicadorId)!;
    return {
      id: v.id,
      valorOriginal: v.valorOriginal,
      descontoBp: v.descontoBp,
      valorDesconto: v.valorDesconto,
      valorFinal: v.valorFinal,
      status: v.status,
      criadoEm: v.criadoEm,
      confirmadaEm: v.confirmadaEm,
      canceladaEm: v.canceladaEm,
      cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone },
      codigo:
        codigo && indicador
          ? {
              id: codigo.id,
              codigo: codigo.codigo,
              tipo: codigo.tipo,
              indicadorId: indicador.id,
              indicadorNome: indicador.nome,
            }
          : null,
    };
  }

  function vendaDaEmpresa(id: string): Venda {
    const venda = vendas().find((v) => v.id === id);
    if (!venda) throw new Error(`venda não encontrada: ${id}`);
    return venda;
  }

  const telefoneDeIndicadorUsado = (telefone: Telefone) => indicadores().some((i) => i.telefone === telefone);

  return {
    async listarIndicadores() {
      return indicadores()
        .map((i) => resumo(i.id))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    },

    async detalheIndicador(id) {
      if (!indicadores().some((i) => i.id === id)) return null;
      const seus = codigos().filter((c) => c.indicadorId === id);
      const ids = new Set(seus.map((c) => c.id));
      const ordemStatus = { pendente: 0, confirmada: 1, cancelada: 2 } as const;
      return {
        indicador: resumo(id),
        codigos: seus
          .sort((a, b) => Number(b.ativo) - Number(a.ativo) || maisNovoPrimeiro(a, b))
          .map(comUsos),
        vendas: vendas()
          .filter((v) => v.status !== "cancelada" && v.codigoId !== null && ids.has(v.codigoId))
          .sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status] || maisNovoPrimeiro(a, b))
          .map(listada),
      };
    },

    async buscarCliente(telefone) {
      const cliente = clientes().find((c) => c.telefone === telefone) ?? null;
      const suas = cliente ? vendas().filter((v) => v.clienteId === cliente.id) : [];
      const vinculo = cliente?.indicadorId ? indicadores().find((i) => i.id === cliente.indicadorId)! : null;
      return {
        cliente: cliente && { id: cliente.id, nome: cliente.nome },
        paraValidar: {
          telefone,
          vinculo: vinculo && { indicadorId: vinculo.id, indicadorNome: vinculo.nome },
          temVendaConfirmada: suas.some((v) => v.status === "confirmada"),
          temVendaPendente: suas.some((v) => v.status === "pendente"),
        },
      };
    },

    async buscarCodigo(texto) {
      const codigo = codigos().find((c) => c.codigo === texto);
      if (!codigo) return null;
      const indicador = indicadores().find((i) => i.id === codigo.indicadorId)!;
      return {
        id: codigo.id,
        codigo: codigo.codigo,
        indicadorId: indicador.id,
        indicadorNome: indicador.nome,
        indicadorTelefone: indicador.telefone,
        tipo: codigo.tipo,
        descontoBp: codigo.descontoBp,
        validoAte: codigo.validoAte,
        ativo: codigo.ativo,
        limiteUsos: codigo.limiteUsos,
        usos: usos(codigo.id),
      };
    },

    async codigoExiste(texto) {
      return codigos().some((c) => c.codigo === texto);
    },

    async venda(id) {
      const venda = vendas().find((v) => v.id === id);
      return venda ? listada(venda) : null;
    },

    async listarVendas({ indicador, desde, situacao }) {
      const doIndicador = new Set(codigos().filter((c) => c.indicadorId === indicador).map((c) => c.id));
      return vendas()
        .filter((v) => situacao === "todas" || v.status === situacao)
        .filter((v) => desde === null || dataEmBrasilia(v.criadoEm) >= desde)
        .filter((v) =>
          indicador === "todos"
            ? true
            : indicador === "sem_codigo"
              ? v.codigoId === null
              : v.codigoId !== null && doIndicador.has(v.codigoId),
        )
        .sort(maisNovoPrimeiro)
        .map(listada);
    },

    async inserirIndicador({ nome, telefone }, agora) {
      if (telefoneDeIndicadorUsado(telefone)) throw new ViolacaoUnicidade("telefone");
      const indicador = { id: gerarId(), empresaId, nome, telefone, criadoEm: agora };
      banco.indicadores.push(indicador);
      return indicador;
    },

    async inserirCodigo(dados, agora) {
      if (!indicadores().some((i) => i.id === dados.indicadorId)) {
        throw new Error(`indicador não encontrado: ${dados.indicadorId}`);
      }
      if (codigos().some((c) => c.codigo === dados.codigo)) throw new ViolacaoUnicidade("codigo");
      const codigo = { ...dados, id: gerarId(), empresaId, ativo: true, criadoEm: agora };
      banco.codigos.push(codigo);
      return codigo;
    },

    async definirCodigoAtivo(id, ativo) {
      const codigo = codigos().find((c) => c.id === id);
      if (!codigo) return false;
      codigo.ativo = ativo;
      return true;
    },

    async inserirCliente({ nome, telefone }, agora) {
      if (clientes().some((c) => c.telefone === telefone)) throw new ViolacaoUnicidade("telefone");
      const cliente = { id: gerarId(), empresaId, nome, telefone, indicadorId: null, criadoEm: agora };
      banco.clientes.push(cliente);
      return cliente;
    },

    async inserirVenda({ clienteId, codigoId, calculo }, agora) {
      if (!clientes().some((c) => c.id === clienteId)) throw new Error(`cliente não encontrado: ${clienteId}`);
      if (codigoId !== null && !codigos().some((c) => c.id === codigoId)) {
        throw new Error(`código não encontrado: ${codigoId}`);
      }
      const venda: Venda = {
        id: gerarId(),
        empresaId,
        clienteId,
        codigoId,
        ...calculo,
        status: "pendente",
        criadoEm: agora,
        confirmadaEm: null,
        canceladaEm: null,
      };
      banco.vendas.push(venda);
      return venda;
    },

    async confirmarVenda(id, vincularA, agora, carimbo = null) {
      const venda = vendaDaEmpresa(id);
      if (carimbo && banco.carimbos.some((c) => c.vendaId === id)) throw new Error(`venda já tem carimbo: ${id}`);
      venda.status = "confirmada";
      venda.confirmadaEm = agora;
      if (vincularA !== null) {
        const cliente = clientes().find((c) => c.id === venda.clienteId)!;
        cliente.indicadorId ??= vincularA;
      }
      if (carimbo) {
        banco.carimbos.push({
          id: gerarId(),
          empresaId,
          clienteId: venda.clienteId,
          vendaId: id,
          valorMinimoAplicado: carimbo.valorMinimoAplicado,
          criadoEm: agora,
          liberadoEm: carimbo.liberadoEm,
          resgateId: null,
          retiradoEm: null,
        });
        const temCartao = banco.cartoes.some((c) => c.empresaId === empresaId && c.clienteId === venda.clienteId);
        if (!temCartao) {
          banco.cartoes.push({ empresaId, clienteId: venda.clienteId, chave: carimbo.chave, criadoEm: agora, chaveTrocadaEm: null });
        }
      }
    },

    async cancelarVenda(id, agora) {
      const venda = vendaDaEmpresa(id);
      const carimbo = banco.carimbos.find((c) => c.empresaId === empresaId && c.vendaId === id);
      // Como a RPC: a venda usada num resgate não é cancelada (spec 002, RF5).
      if (carimbo?.resgateId) throw new Error(`venda em resgate: ${id}`);
      venda.status = "cancelada";
      venda.canceladaEm = agora;
      if (carimbo && carimbo.retiradoEm === null) carimbo.retiradoEm = agora;
    },
  };
}

/** Fidelidade em memória (provisório, até a F30), filtrada por `empresaId` como a RLS. */
export function criarRepositorioFidelidadeEmMemoria(
  banco: Banco,
  empresaId: string,
  gerarId: () => string = () => crypto.randomUUID(),
): RepositorioFidelidade {
  const daEmpresa = <T extends { empresaId: string }>(linhas: T[]) => linhas.filter((l) => l.empresaId === empresaId);

  function montar(clienteId: string): CartaoDoCliente | null {
    const cliente = daEmpresa(banco.clientes).find((c) => c.id === clienteId);
    const cartao = daEmpresa(banco.cartoes).find((c) => c.clienteId === clienteId);
    if (!cliente || !cartao) return null;
    const vendas = daEmpresa(banco.vendas);
    return {
      cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone },
      chave: cartao.chave,
      carimbos: daEmpresa(banco.carimbos)
        .filter((c) => c.clienteId === clienteId)
        .map((c) => {
          const venda = vendas.find((v) => v.id === c.vendaId)!;
          return { ...c, venda: { valorFinal: venda.valorFinal, canceladaEm: venda.canceladaEm } };
        }),
      resgates: daEmpresa(banco.resgates).filter((r) => r.clienteId === clienteId),
    };
  }

  return {
    async programa() {
      return daEmpresa(banco.programas)[0] ?? null;
    },

    async listarCartoes() {
      return daEmpresa(banco.cartoes).map((c) => montar(c.clienteId)!);
    },

    async cartaoCliente(clienteId) {
      return montar(clienteId);
    },

    async carimboDaVenda(vendaId) {
      return daEmpresa(banco.carimbos).find((c) => c.vendaId === vendaId) ?? null;
    },

    async salvarPrograma(dados, agora) {
      const atual = daEmpresa(banco.programas)[0];
      if (atual) {
        Object.assign(atual, dados, { atualizadoEm: agora });
        return atual;
      }
      const novo = { ...dados, empresaId, criadoEm: agora, atualizadoEm: agora };
      banco.programas.push(novo);
      return novo;
    },

    async inserirResgate({ clienteId, meta, premio, carimboIds }, agora) {
      const carimbos = carimboIds.map((id) => daEmpresa(banco.carimbos).find((c) => c.id === id));
      const livres = carimbos.every(
        (c) => c && c.clienteId === clienteId && c.resgateId === null && c.retiradoEm === null && c.liberadoEm <= agora,
      );
      if (!livres || carimbos.length !== meta) throw new Error("carimbos do resgate não estão livres no cartão");
      const resgate = { id: gerarId(), empresaId, clienteId, meta, premio, criadoEm: agora, desfeitoEm: null };
      banco.resgates.push(resgate);
      for (const c of carimbos) c!.resgateId = resgate.id;
      return resgate;
    },

    async desfazerResgate(id, agora) {
      const resgate = daEmpresa(banco.resgates).find((r) => r.id === id);
      if (!resgate || resgate.desfeitoEm !== null) throw new Error(`resgate não pode ser desfeito: ${id}`);
      resgate.desfeitoEm = agora;
      for (const c of daEmpresa(banco.carimbos)) if (c.resgateId === id) c.resgateId = null;
    },

    async trocarChave(clienteId, chave, agora) {
      const cartao = daEmpresa(banco.cartoes).find((c) => c.clienteId === clienteId);
      if (!cartao) throw new Error(`cliente sem cartão: ${clienteId}`);
      cartao.chave = chave;
      cartao.chaveTrocadaEm = agora;
    },
  };
}

/**
 * Página do cliente, sem login (faz o papel da RPC `security definer` `cartao_publico`):
 * `null` para chave que não existe, trocada, de empresa sem o módulo ou sem programa.
 */
export function lerCartaoPublico(banco: Banco, chave: string): CartaoPublicoDados | null {
  const cartao = banco.cartoes.find((c) => c.chave === chave);
  if (!cartao) return null;
  const empresa = banco.empresas.find((e) => e.id === cartao.empresaId);
  const programa = banco.programas.find((p) => p.empresaId === cartao.empresaId);
  const cliente = banco.clientes.find((c) => c.id === cartao.clienteId && c.empresaId === cartao.empresaId);
  if (!empresa || !empresa.modulosAtivos.includes("fidelidade") || !programa || !cliente) return null;
  const doCliente = <T extends { empresaId: string; clienteId: string }>(linhas: T[]) =>
    linhas.filter((l) => l.empresaId === cartao.empresaId && l.clienteId === cartao.clienteId);
  return {
    empresaNome: empresa.nome,
    clienteNome: cliente.nome,
    programa: { meta: programa.meta, premio: programa.premio, valorMinimo: programa.valorMinimo },
    carimbos: doCliente(banco.carimbos).map(({ id, criadoEm, liberadoEm, resgateId, retiradoEm }) => ({
      id,
      criadoEm,
      liberadoEm,
      resgateId,
      retiradoEm,
    })),
    resgates: doCliente(banco.resgates).map(({ id, criadoEm, desfeitoEm }) => ({ id, criadoEm, desfeitoEm })),
  };
}
