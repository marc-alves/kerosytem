import { IconeEstrela, IconeRelogio } from "@/components/icones";
import { liberadosExibidos } from "@/lib/fidelidade/cartao";
import type { EstadoCartao } from "@/lib/fidelidade/tipos";

type Espaco = "liberado" | "a_liberar" | "vazio";

const estilo: Record<Espaco, string> = {
  liberado: "border-laranja-escuro bg-laranja text-texto",
  // A liberar: outra forma (borda tracejada + relógio), não só outra cor (DESIGN.md seção 11).
  a_liberar: "border-dashed border-laranja-escuro bg-creme text-laranja-escuro",
  vazio: "border-borda-campo bg-superficie",
};

/**
 * Os M espaços do cartão, preenchidos até os carimbos exibidos (spec 002, 10.2, 10.4, 11.1).
 * `mostrarALiberar = false` na página do cliente, que não fala em prazo.
 */
export function CartaoCarimbos({
  estado,
  mostrarALiberar = true,
  legenda = `${estado.exibido} de ${estado.meta} carimbos`,
}: {
  estado: EstadoCartao;
  mostrarALiberar?: boolean;
  /** Página do cliente: "Você tem N de M carimbos". */
  legenda?: string;
}) {
  const liberados = mostrarALiberar ? liberadosExibidos(estado) : estado.exibido;
  const espacos: Espaco[] = Array.from({ length: estado.meta }, (_, i) =>
    i < liberados ? "liberado" : i < estado.exibido ? "a_liberar" : "vazio",
  );
  return (
    <div className="flex flex-col gap-3">
      <ul
        role="img"
        aria-label={`${estado.exibido} de ${estado.meta} carimbos`}
        className="grid grid-cols-5 gap-2"
      >
        {espacos.map((tipo, i) => (
          <li
            key={i}
            className={`flex aspect-square items-center justify-center rounded-full border-2 text-titulo ${estilo[tipo]}`}
          >
            {tipo === "liberado" && <IconeEstrela />}
            {tipo === "a_liberar" && <IconeRelogio />}
          </li>
        ))}
      </ul>
      <p className="text-botao font-semibold">{legenda}</p>
    </div>
  );
}
