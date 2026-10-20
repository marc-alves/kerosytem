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
