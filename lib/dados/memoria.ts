import { dataEmBrasilia } from "@/lib/indicacao/periodo";
import type { Telefone } from "@/lib/indicacao/tipos";
import {
  ViolacaoUnicidade,
  type Banco,
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

    async confirmarVenda(id, vincularA, agora) {
      const venda = vendaDaEmpresa(id);
      venda.status = "confirmada";
      venda.confirmadaEm = agora;
      if (vincularA !== null) {
        const cliente = clientes().find((c) => c.id === venda.clienteId)!;
        cliente.indicadorId ??= vincularA;
      }
    },

    async cancelarVenda(id, agora) {
      const venda = vendaDaEmpresa(id);
      venda.status = "cancelada";
      venda.canceladaEm = agora;
    },
  };
}
