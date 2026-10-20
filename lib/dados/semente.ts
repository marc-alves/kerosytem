import type { Banco, Carimbo, CartaoFidelidade, Resgate, Venda } from "@/lib/dados/tipos";
import { dataLiberacao } from "@/lib/fidelidade/carimbo";
import { calcularVenda } from "@/lib/indicacao/venda";
import type { Centavos, PontosBase, StatusVenda } from "@/lib/indicacao/tipos";

// Dados fictícios de desenvolvimento (T13). Telefones inventados, no formato (61) 90000-00NN.
/** Mude ao mudar a semente ou o formato das linhas (lib/dados/sessao.ts troca o banco em memória). */
export const VERSAO_SEMENTE = 4;

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

  // Fidelidade da empresa A (spec 002): programa de 30 dias atrás, 10 carimbos, prazo de 7 dias.
  // Ana: cartão completo e liberado. Bia: completo, mas os carimbos dos últimos 6 dias ainda a liberar.
  // Carla: já resgatou um prêmio (as vendas dele não podem ser canceladas) e tem 2 carimbos.
  const fieis = [
    { id: "a-cli-ana", nome: "Ana Souza", telefone: "5561900000012", vendas: 10, primeiraHa: 25 },
    { id: "a-cli-bia", nome: "Bia", telefone: "5561900000013", vendas: 10, primeiraHa: 12 },
    { id: "a-cli-carla", nome: "Carla", telefone: "5561900000014", vendas: 12, primeiraHa: 26 },
  ];
  const vendasFieis = fieis.flatMap((f) =>
    Array.from({ length: f.vendas }, (_, i) =>
      venda(`a-ven-${f.id.slice(6)}-${i + 1}`, EMPRESA_A, f.id, null, 1500 + i * 100, "confirmada", (f.primeiraHa - i) * DIA),
    ),
  );

  const base: Omit<Banco, "programas" | "carimbos" | "resgates" | "cartoes"> = {
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
      ...fieis.map((f) => ({ id: f.id, empresaId: EMPRESA_A, nome: f.nome, telefone: f.telefone, indicadorId: null, criadoEm: antes(f.primeiraHa * DIA) })),
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
      ...vendasFieis,
    ],
  };

  const programa = { empresaId: EMPRESA_A, meta: 10, premio: "1 salgado grátis", valorMinimo: null, diasLiberacao: 7, criadoEm: antes(30 * DIA), atualizadoEm: antes(30 * DIA) };
  // Um carimbo por venda confirmada da A (todas lançadas depois do programa), como a confirmação faria.
  const carimbos: Carimbo[] = base.vendas
    .filter((v) => v.empresaId === EMPRESA_A && v.status === "confirmada" && v.confirmadaEm)
    .map((v) => ({
      id: `car-${v.id}`,
      empresaId: EMPRESA_A,
      clienteId: v.clienteId,
      vendaId: v.id,
      valorMinimoAplicado: null,
      criadoEm: v.confirmadaEm!,
      liberadoEm: dataLiberacao({ confirmadaEm: v.confirmadaEm!, diasLiberacao: programa.diasLiberacao }),
      resgateId: null,
      retiradoEm: null,
    }));
  const resgates: Resgate[] = [
    { id: "a-res-carla-1", empresaId: EMPRESA_A, clienteId: "a-cli-carla", meta: 10, premio: "1 salgado grátis", criadoEm: antes(5 * DIA), desfeitoEm: null },
    // Registrado por engano e desfeito na hora (RF7).
    { id: "a-res-carla-0", empresaId: EMPRESA_A, clienteId: "a-cli-carla", meta: 10, premio: "1 salgado grátis", criadoEm: antes(6 * DIA), desfeitoEm: antes(6 * DIA - HORA) },
  ];
  for (const c of carimbos.filter((c) => c.clienteId === "a-cli-carla").slice(0, 10)) c.resgateId = "a-res-carla-1";
  // Chaves fixas só para a /teste; as de verdade são aleatórias (RF8).
  const cartoes: CartaoFidelidade[] = [...new Set(carimbos.map((c) => c.clienteId))].map((clienteId) => ({
    empresaId: EMPRESA_A,
    clienteId,
    chave: `teste-${clienteId.slice(6)}`,
    criadoEm: carimbos.find((c) => c.clienteId === clienteId)!.criadoEm,
    chaveTrocadaEm: null,
  }));

  return { ...base, programas: [programa], carimbos, resgates, cartoes };
}
