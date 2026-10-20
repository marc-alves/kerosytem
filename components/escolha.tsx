import { IconeCheck } from "@/components/icones";

export type OpcaoEscolha<V extends string> = { valor: V; rotulo: string; descricao?: string };

/**
 * Botões grandes de escolha única: tipo do código, validade, filtros (DESIGN.md seção 7).
 * São botões de rádio de verdade: funcionam em formulário, com teclado e leitor de tela.
 * Passe `valor` + `onChange` para controlar, ou `valorInicial` para deixar o formulário cuidar.
 */
export function Escolha<V extends string>({
  nome,
  legenda,
  opcoes,
  valor,
  valorInicial,
  onChange,
  colunas = 1,
}: {
  nome: string;
  legenda: string;
  opcoes: ReadonlyArray<OpcaoEscolha<V>>;
  valor?: V;
  valorInicial?: V;
  onChange?: (valor: V) => void;
  /** 2 só para opções curtas, como "Hoje" e "Tudo"; o padrão é uma embaixo da outra. */
  colunas?: 1 | 2;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-base font-semibold">{legenda}</legend>
      <div className={`grid gap-3 ${colunas === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {opcoes.map((opcao) => (
          <label
            key={opcao.valor}
            className={
              "group flex min-h-14 cursor-pointer items-center gap-3 rounded-cartao border-2 border-borda-campo bg-superficie px-4 py-3 " +
              "has-checked:border-laranja-escuro has-checked:bg-creme " +
              "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-laranja-escuro"
            }
          >
            <input
              type="radio"
              name={nome}
              value={opcao.valor}
              className="sr-only"
              {...(valor !== undefined
                ? { checked: valor === opcao.valor, onChange: () => onChange?.(opcao.valor) }
                : { defaultChecked: valorInicial === opcao.valor })}
            />
            <span
              aria-hidden="true"
              className={
                "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-borda-campo bg-superficie text-transparent " +
                "group-has-checked:border-laranja-escuro group-has-checked:bg-laranja-escuro group-has-checked:text-superficie"
              }
            >
              <IconeCheck />
            </span>
            <span className="flex flex-col">
              <span className="text-botao font-semibold">{opcao.rotulo}</span>
              {opcao.descricao && <span className="text-base text-texto-suave">{opcao.descricao}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
