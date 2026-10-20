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

/** Tudo o que o banco guarda; cada empresa só enxerga as próprias linhas. */
export type Banco = {
  empresas: Empresa[];
  indicadores: Indicador[];
  clientes: Cliente[];
  codigos: Codigo[];
  vendas: Venda[];
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
  /** Marca como confirmada e, se `vincularA`, cria o vínculo do cliente (RN6). */
  confirmarVenda(id: string, vincularA: string | null, agora: Date): Promise<void>;
  cancelarVenda(id: string, agora: Date): Promise<void>;
}
