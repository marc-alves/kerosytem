// Linhas das tabelas (plan.md, "Modelo de dados") e a interface de acesso a elas.
// Hoje implementada em memória (memoria.ts); na T43, pelo Supabase.
import type {
  CalculoVenda,
  Centavos,
  ClienteParaValidar,
  CodigoParaValidar,
  Data,
  PontosBase,
  StatusVenda,
  Telefone,
  TipoCodigo,
} from "@/lib/indicacao/tipos";

export type Modulo = "indicacao" | "fidelidade";

export type Empresa = { id: string; nome: string; modulosAtivos: Modulo[]; criadoEm: Date };

export type Indicador = { id: string; empresaId: string; nome: string; telefone: Telefone; criadoEm: Date };

export type Cliente = {
  id: string;
  empresaId: string;
  nome: string;
  telefone: Telefone;
  /** Vínculo da RN6: preenchido na primeira confirmação com código e não desfeito. */
  indicadorId: string | null;
  criadoEm: Date;
};

export type Codigo = {
  id: string;
  empresaId: string;
  /** Em minúsculas, sem espaços (RN1). */
  codigo: string;
  indicadorId: string;
  tipo: TipoCodigo;
  descontoBp: PontosBase;
  validoAte: Data | null;
  limiteUsos: number;
  ativo: boolean;
  criadoEm: Date;
};

export type Venda = {
  id: string;
  empresaId: string;
  clienteId: string;
  codigoId: string | null;
  valorOriginal: Centavos;
  descontoBp: PontosBase;
  valorDesconto: Centavos;
  valorFinal: Centavos;
  status: StatusVenda;
  criadoEm: Date;
  confirmadaEm: Date | null;
  canceladaEm: Date | null;
};

// ---- Fidelidade (spec 002, plan.md da 002, "Modelo de dados") ----

/** Um por empresa (RF1). */
export type Programa = {
  empresaId: string;
  meta: number;
  premio: string;
  valorMinimo: Centavos | null;
  diasLiberacao: number;
  criadoEm: Date;
  atualizadoEm: Date;
};

/** Gravado na confirmação da venda (RF3, RF4); nunca apagado. */
export type Carimbo = {
  id: string;
  empresaId: string;
  clienteId: string;
  /** Única: uma venda dá no máximo 1 carimbo. */
  vendaId: string;
  valorMinimoAplicado: Centavos | null;
  /** = `confirmadaEm` da venda. */
  criadoEm: Date;
  liberadoEm: Date;
  /** Resgate não desfeito que usou o carimbo (RF6); nunca junto com `retiradoEm`. */
  resgateId: string | null;
  /** Venda cancelada (RF5). */
  retiradoEm: Date | null;
};

export type Resgate = {
  id: string;
  empresaId: string;
  clienteId: string;
  /** Meta e prêmio da época (RF6). */
  meta: number;
  premio: string;
  criadoEm: Date;
  desfeitoEm: Date | null;
};

/** Link do cartão (RF8): a chave é única no sistema todo e pode ser trocada. */
export type CartaoFidelidade = {
  empresaId: string;
  clienteId: string;
  chave: string;
  criadoEm: Date;
  chaveTrocadaEm: Date | null;
};

/** Tudo o que o banco guarda; cada empresa só enxerga as próprias linhas. */
export type Banco = {
  empresas: Empresa[];
  indicadores: Indicador[];
  clientes: Cliente[];
  codigos: Codigo[];
  vendas: Venda[];
  programas: Programa[];
  carimbos: Carimbo[];
  resgates: Resgate[];
  cartoes: CartaoFidelidade[];
};

// ---- Leituras (fazem o papel das views da T11) ----

/** Cartão da lista de indicadores (spec 10.2). */
export type ResumoIndicador = {
  id: string;
  nome: string;
  telefone: Telefone;
  codigosAtivos: number;
  vendasPagas: number;
  /** Soma do valor final das vendas confirmadas com códigos dele. */
  totalVendido: Centavos;
};

/** Cartão de código no detalhe do indicador (spec 10.3); `usos` só conta confirmadas (RN3). */
export type CodigoComUsos = Omit<Codigo, "empresaId" | "indicadorId"> & { usos: number };

/** Venda com o que os cartões mostram (spec 10.3, 10.6, 10.7). */
export type VendaListada = Omit<Venda, "empresaId" | "clienteId" | "codigoId"> & {
  cliente: { id: string; nome: string; telefone: Telefone };
  codigo: { id: string; codigo: string; tipo: TipoCodigo; indicadorId: string; indicadorNome: string } | null;
};

export type DetalheIndicador = {
  indicador: ResumoIndicador;
  /** Ativos primeiro, depois desativados; mais novos primeiro. */
  codigos: CodigoComUsos[];
  /** Só aguardando pagamento e pagas: as que aguardam primeiro, mais novas primeiro em cada grupo. */
  vendas: VendaListada[];
};

export type FiltroVendas = {
  /** Id de um indicador, "sem_codigo" ou "todos". */
  indicador: string;
  /** Primeiro dia (Brasília) do período; `null` = tudo. */
  desde: Data | null;
  situacao: StatusVenda | "todas";
};

/** O cliente de um telefone, com o que a validação do código precisa (RN5, RN6, RN7). */
export type ClienteComHistorico = {
  cliente: { id: string; nome: string } | null;
  paraValidar: ClienteParaValidar;
};

/** Conflito de unicidade, como o erro 23505 do Postgres. */
export class ViolacaoUnicidade extends Error {
  constructor(public readonly campo: "telefone" | "codigo") {
    super(`${campo} repetido na empresa`);
  }
}

/**
 * Acesso aos dados de **uma** empresa (a da sessão). Nenhum método recebe `empresa_id`
 * (RE3 da spec 000): o isolamento é responsabilidade da implementação, como a RLS.
 */
export interface RepositorioIndicacao {
  // Leituras (T39)
  listarIndicadores(): Promise<ResumoIndicador[]>;
  detalheIndicador(id: string): Promise<DetalheIndicador | null>;
  buscarCliente(telefone: Telefone): Promise<ClienteComHistorico>;
  /** Código para validar na venda, pelo texto já normalizado; `null` se não existe na empresa. */
  buscarCodigo(codigo: string): Promise<(CodigoParaValidar & { id: string }) | null>;
  codigoExiste(codigo: string): Promise<boolean>;
  venda(id: string): Promise<VendaListada | null>;
  /** Mais novas primeiro. */
  listarVendas(filtro: FiltroVendas): Promise<VendaListada[]>;

  // Gravações (fazem o papel das RPCs da T11); lançam `ViolacaoUnicidade` em conflito.
  inserirIndicador(dados: { nome: string; telefone: Telefone }, agora: Date): Promise<Indicador>;
  inserirCodigo(
    dados: Pick<Codigo, "codigo" | "indicadorId" | "tipo" | "descontoBp" | "validoAte" | "limiteUsos">,
    agora: Date,
  ): Promise<Codigo>;
  /** `false` se o código não existe na empresa. */
  definirCodigoAtivo(id: string, ativo: boolean): Promise<boolean>;
  inserirCliente(dados: { nome: string; telefone: Telefone }, agora: Date): Promise<Cliente>;
  inserirVenda(
    dados: { clienteId: string; codigoId: string | null; calculo: CalculoVenda },
    agora: Date,
  ): Promise<Venda>;
  /**
   * Marca como confirmada e, se `vincularA`, cria o vínculo do cliente (RN6). Com `carimbo`,
   * grava o carimbo da venda e, se o cliente ainda não tem cartão, cria com `chave` (spec 002, RF3, RF8).
   */
  confirmarVenda(
    id: string,
    vincularA: string | null,
    agora: Date,
    carimbo?: { valorMinimoAplicado: Centavos | null; liberadoEm: Date; chave: string } | null,
  ): Promise<void>;
  /** Cancela e retira o carimbo da venda, se houver; lança erro se ele estiver num resgate (spec 002, RF5). */
  cancelarVenda(id: string, agora: Date): Promise<void>;
}

/** Carimbo com a venda que o gerou, para o histórico do cartão (spec 10.2). */
export type CarimboComVenda = Carimbo & { venda: { valorFinal: Centavos; canceladaEm: Date | null } };

/** Cliente que tem cartão (pelo menos 1 carimbo ou 1 resgate), com tudo o que o cartão precisa. */
export type CartaoDoCliente = {
  cliente: { id: string; nome: string; telefone: Telefone };
  chave: string;
  carimbos: CarimboComVenda[];
  resgates: Resgate[];
};

/**
 * Leitura da página do cliente, sem login (faz o papel da RPC `cartao_publico`): só o que a RF9
 * deixa mostrar. Sem telefone, valores, códigos ou indicador.
 */
export type CartaoPublicoDados = {
  empresaNome: string;
  clienteNome: string;
  programa: Pick<Programa, "meta" | "premio" | "valorMinimo">;
  carimbos: Pick<Carimbo, "id" | "criadoEm" | "liberadoEm" | "resgateId" | "retiradoEm">[];
  resgates: Pick<Resgate, "id" | "criadoEm" | "desfeitoEm">[];
};

/** Fidelidade de **uma** empresa (a da sessão), como a `RepositorioIndicacao` (RE3). */
export interface RepositorioFidelidade {
  programa(): Promise<Programa | null>;
  /** Clientes com cartão. */
  listarCartoes(): Promise<CartaoDoCliente[]>;
  /** `null` se o cliente não é da empresa ou ainda não tem cartão. */
  cartaoCliente(clienteId: string): Promise<CartaoDoCliente | null>;
  carimboDaVenda(vendaId: string): Promise<Carimbo | null>;

  salvarPrograma(
    dados: Pick<Programa, "meta" | "premio" | "valorMinimo" | "diasLiberacao">,
    agora: Date,
  ): Promise<Programa>;
  /** Liga os carimbos ao resgate na mesma gravação; lança erro se algum não estiver livre no cartão. */
  inserirResgate(
    dados: { clienteId: string; meta: number; premio: string; carimboIds: string[] },
    agora: Date,
  ): Promise<Resgate>;
  /** Marca como desfeito e solta os carimbos (RF7). */
  desfazerResgate(id: string, agora: Date): Promise<void>;
  trocarChave(clienteId: string, chave: string, agora: Date): Promise<void>;
}
