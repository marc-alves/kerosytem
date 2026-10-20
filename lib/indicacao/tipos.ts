// Tipos do domínio da indicação (spec 001).
// Dinheiro sempre em centavos inteiros; percentuais em centésimos de ponto (500 = 5%).

/** Resultado recusado: `motivo` é para o código, `mensagem` é para mostrar na tela. */
export type Falha<M extends string> = {
  ok: false;
  motivo: M;
  mensagem: string;
};

/** Telefone só com dígitos, com DDI 55 (12 ou 13 dígitos), conforme a RN4. */
export type Telefone = string;

export type ResultadoTelefone =
  | { ok: true; telefone: Telefone }
  | Falha<"telefone_vazio" | "telefone_invalido">;

/** Valor em centavos inteiros (R$ 110,00 = 11000). */
export type Centavos = number;

/** Percentual em centésimos de ponto (500 = 5%, 750 = 7,5%). */
export type PontosBase = number;

/** Valores de uma venda, gravados no lançamento (RN8). */
export type CalculoVenda = {
  valorOriginal: Centavos;
  descontoBp: PontosBase;
  valorDesconto: Centavos;
  valorFinal: Centavos;
  comissaoBp: PontosBase;
  comissao: Centavos;
};

/** Data no formato do Postgres `date` (`AAAA-MM-DD`). */
export type Data = string;

export type TipoCodigo = "normal" | "primeira_compra";

export type StatusVenda = "pendente" | "confirmada" | "cancelada";

/** Código já carregado do banco, com os usos contados (só vendas confirmadas, RN3). */
export type CodigoParaValidar = {
  codigo: string;
  indicadorId: string;
  indicadorNome: string;
  /** Para recusar autoindicação (RN7). */
  indicadorTelefone: Telefone;
  tipo: TipoCodigo;
  descontoBp: PontosBase;
  comissaoBp: PontosBase;
  /** Último dia em que vale, até 23h59 de Brasília; `null` = sem validade (RN2). */
  validoAte: Data | null;
  ativo: boolean;
  limiteUsos: number;
  usos: number;
};

/** Cliente da venda, com o que importa para validar o código (RN5, RN6, RN7). */
export type ClienteParaValidar = {
  /** Telefone já normalizado (RN4); cliente novo também tem. */
  telefone: Telefone;
  /** Vínculo criado na primeira venda confirmada com código (RN6); `null` enquanto não houver. */
  vinculo: { indicadorId: string; indicadorNome: string } | null;
  temVendaConfirmada: boolean;
  temVendaPendente: boolean;
};

/** Avisos não recusam a venda; aparecem na tela (RN3, RN5). */
export type AvisoCodigo = {
  tipo: "limite_atingido" | "cliente_com_venda_pendente";
  mensagem: string;
};

export type ResultadoCodigo =
  | { ok: true; codigo: CodigoParaValidar; avisos: AvisoCodigo[] }
  | Falha<
      | "codigo_nao_encontrado"
      | "codigo_desativado"
      | "codigo_vencido"
      | "autoindicacao"
      | "cliente_de_outro_indicador"
      | "primeira_compra_ja_feita"
    >;
