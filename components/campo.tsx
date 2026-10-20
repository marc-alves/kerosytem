import type { InputHTMLAttributes } from "react";
import { IconeAlerta } from "@/components/icones";

/**
 * Campo com rótulo sempre visível, exemplo e erro logo abaixo (DESIGN.md seção 7).
 * Use `inputMode="tel"` para telefone e `inputMode="decimal"` para valor.
 */
export function Campo({
  id,
  rotulo,
  exemplo,
  erro,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  exemplo?: string;
  erro?: string | null;
}) {
  const idExemplo = exemplo ? `${id}-exemplo` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descricao = [idExemplo, idErro].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-base font-semibold">
        {rotulo}
      </label>
      {exemplo && (
        <p id={idExemplo} className="text-pequeno text-texto-suave">
          {exemplo}
        </p>
      )}
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao}
        className={
          "min-h-14 w-full rounded-cartao border-2 bg-superficie px-4 text-base text-texto " +
          "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-laranja-escuro " +
          (erro ? "border-erro-texto" : "border-borda-campo")
        }
        {...props}
      />
      {erro && (
        <p id={idErro} className="flex items-start gap-2 text-base font-semibold text-erro-texto">
          <IconeAlerta />
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}
