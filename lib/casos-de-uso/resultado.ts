/**
 * Resposta de um caso de uso para a tela (plan.md, "Gravações"): `erros` traz, por campo,
 * a mensagem da spec para mostrar embaixo dele; `geral` é o que não pertence a um campo.
 */
export type Recusa<C extends string> = { ok: false; erros: Partial<Record<C | "geral", string>> };

export function recusa<C extends string>(erros: Partial<Record<C | "geral", string>>): Recusa<C> {
  return { ok: false, erros };
}

export const temErros = (erros: object) => Object.keys(erros).length > 0;
