import type { Banco, Venda } from "@/lib/dados/tipos";
import { calcularVenda } from "@/lib/indicacao/venda";
import type { Centavos, PontosBase, StatusVenda } from "@/lib/indicacao/tipos";

// Dados fictícios de desenvolvimento (T13). Telefones inventados, no formato (61) 90000-00NN.
/** Mude ao mudar a semente ou o formato das linhas (lib/dados/sessao.ts troca o banco em memória). */
export const VERSAO_SEMENTE = 2;

export const EMPRESA_A = "empresa-lanchonete-da-maria";
export const EMPRESA_B = "empresa-pastelaria-do-ze";

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** Duas empresas: a A com dados para todas as telas; a B com o mesmo código e o mesmo telefone de cliente. */
export function criarSemente(agora: Date): Banco {
  const antes = (ms: number) => new Date(agora.getTime() - ms);

  function venda(
    id: string,
    empresaId: string,
    clienteId: string,
    codigo: { id: string; descontoBp: PontosBase } | null,
    valorOriginal: Centavos,
    status: StatusVenda,
    criadoHa: number,
  ): Venda {
    const calculo = calcularVenda({ valorOriginal, descontoBp: codigo?.descontoBp ?? 0 });
    const criadoEm = antes(criadoHa);
    return {
      id,
      empresaId,
      clienteId,
      codigoId: codigo?.id ?? null,
      ...calculo,
      status,
      criadoEm,
      confirmadaEm: status === "confirmada" ? new Date(criadoEm.getTime() + HORA) : null,
      canceladaEm: status === "cancelada" ? new Date(criadoEm.getTime() + HORA) : null,
    };
  }

  const camila5 = { id: "a-cod-camila5", descontoBp: 500 };
  const primeiraamanda = { id: "a-cod-primeiraamanda", descontoBp: 1000 };

  return {
    empresas: [
      { id: EMPRESA_A, nome: "Lanchonete da Maria", modulosAtivos: ["indicacao", "fidelidade"], criadoEm: antes(60 * DIA) },
      { id: EMPRESA_B, nome: "Pastelaria do Zé", modulosAtivos: ["indicacao", "fidelidade"], criadoEm: antes(30 * DIA) },
    ],
    indicadores: [
      { id: "a-ind-camila", empresaId: EMPRESA_A, nome: "Camila", telefone: "5561900000001", criadoEm: antes(50 * DIA) },
      { id: "a-ind-amanda", empresaId: EMPRESA_A, nome: "Amanda", telefone: "5561900000002", criadoEm: antes(40 * DIA) },
      { id: "b-ind-camila", empresaId: EMPRESA_B, nome: "Camila", telefone: "5561900000021", criadoEm: antes(20 * DIA) },
    ],
    clientes: [
      // João já comprou com camila5 e está vinculado à Camila (RN6).
      { id: "a-cli-joao", empresaId: EMPRESA_A, nome: "João", telefone: "5561900000010", indicadorId: "a-ind-camila", criadoEm: antes(10 * DIA) },
      { id: "a-cli-pedro", empresaId: EMPRESA_A, nome: "Pedro", telefone: "5561900000011", indicadorId: null, criadoEm: antes(2 * DIA) },
      // Mesmo telefone do João da empresa A: outro cliente, independente (RE4).
      { id: "b-cli-joao", empresaId: EMPRESA_B, nome: "João", telefone: "5561900000010", indicadorId: null, criadoEm: antes(5 * DIA) },
    ],
    codigos: [
      { ...camila5, empresaId: EMPRESA_A, codigo: "camila5", indicadorId: "a-ind-camila", tipo: "normal", validoAte: null, limiteUsos: 10, ativo: true, criadoEm: antes(50 * DIA) },
      { ...primeiraamanda, empresaId: EMPRESA_A, codigo: "primeiraamanda", indicadorId: "a-ind-amanda", tipo: "primeira_compra", validoAte: null, limiteUsos: 10, ativo: true, criadoEm: antes(40 * DIA) },
      { id: "a-cod-camila10", empresaId: EMPRESA_A, codigo: "camila10", indicadorId: "a-ind-camila", tipo: "normal", descontoBp: 1000, validoAte: null, limiteUsos: 10, ativo: false, criadoEm: antes(55 * DIA) },
      { id: "b-cod-camila5", empresaId: EMPRESA_B, codigo: "camila5", indicadorId: "b-ind-camila", tipo: "normal", descontoBp: 1000, validoAte: null, limiteUsos: 10, ativo: true, criadoEm: antes(20 * DIA) },
    ],
    vendas: [
      venda("a-ven-1", EMPRESA_A, "a-cli-joao", camila5, 11000, "confirmada", 10 * DIA),
      venda("a-ven-2", EMPRESA_A, "a-cli-joao", camila5, 4500, "cancelada", 9 * DIA),
      venda("a-ven-3", EMPRESA_A, "a-cli-joao", camila5, 8000, "confirmada", 3 * DIA),
      venda("a-ven-4", EMPRESA_A, "a-cli-pedro", null, 5000, "confirmada", 2 * DIA),
      venda("a-ven-5", EMPRESA_A, "a-cli-joao", camila5, 11000, "pendente", 2 * HORA),
      venda("b-ven-1", EMPRESA_B, "b-cli-joao", { id: "b-cod-camila5", descontoBp: 1000 }, 3000, "pendente", 1 * HORA),
    ],
  };
}
