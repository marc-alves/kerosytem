import type { ButtonHTMLAttributes } from "react";

export type VarianteBotao = "primario" | "secundario" | "perigo" | "link";

const base =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-cartao px-4 py-3 text-center text-botao font-semibold " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-laranja-escuro " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variantes: Record<VarianteBotao, string> = {
  // Texto marrom, nunca branco, sobre o laranja (contraste, DESIGN.md seção 4).
  primario: "border border-laranja-escuro bg-laranja text-texto active:bg-laranja-pressionado",
  secundario: "border-2 border-borda-campo bg-superficie text-texto active:bg-creme",
  perigo: "border border-erro-texto bg-erro-texto text-superficie active:opacity-90",
  link: "text-laranja-escuro underline underline-offset-4 active:text-texto",
};

/** Classes do botão, para usar também em `<Link>` com cara de botão. */
export function classesBotao(variante: VarianteBotao = "primario"): string {
  return `${base} ${variantes[variante]}`;
}

/** Botão de largura total, com o nome da ação escrito (DESIGN.md seção 7). Um único primário por tela. */
export function Botao({
  variante = "primario",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBotao }) {
  return <button type={type} className={`${classesBotao(variante)} ${className}`} {...props} />;
}
