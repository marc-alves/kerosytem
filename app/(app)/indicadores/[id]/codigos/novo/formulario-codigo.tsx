"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acaoConferirPasso1Codigo, acaoCriarCodigo } from "@/app/(app)/indicadores/acoes";
import { AcaoFixa } from "@/components/acao-fixa";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Campo } from "@/components/campo";
import { Escolha } from "@/components/escolha";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import { normalizarCodigo } from "@/lib/indicacao/codigo";
import type { Data, TipoCodigo } from "@/lib/indicacao/tipos";

type Campos = { codigo: string; tipo: TipoCodigo; desconto: string; temValidade: boolean; validoAte: string; limite: string };
type Erros = Partial<Record<"codigo" | "tipo" | "desconto" | "validade" | "limite" | "geral", string>>;

const INICIAL: Campos = { codigo: "", tipo: "normal", desconto: "", temValidade: false, validoAte: "", limite: "10" };

/** Spec 10.4: dois passos, sem tela de conferência. */
export function FormularioCodigo({ indicadorId, indicadorNome, hoje }: { indicadorId: string; indicadorNome: string; hoje: Data }) {
  const router = useRouter();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [campos, setCampos] = useState<Campos>(INICIAL);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, iniciar] = useTransition();
  const detalheHref = `/indicadores/${indicadorId}`;

  const mudar = <K extends keyof Campos>(campo: K, valor: Campos[K], erro: keyof Erros = campo as keyof Erros) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [erro]: undefined, geral: undefined }));
  };

  function continuar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    iniciar(async () => {
      try {
        const r = await acaoConferirPasso1Codigo({ codigo: campos.codigo, desconto: campos.desconto });
        if (r.ok) {
          setErros({});
          setPasso(2);
        } else setErros(r.erros);
      } catch {
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  function criar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    if (campos.temValidade && campos.validoAte === "") {
      setErros({ validade: "Escolha uma data de hoje em diante." });
      return;
    }
    iniciar(async () => {
      try {
        const r = await acaoCriarCodigo({
          indicadorId,
          codigo: campos.codigo,
          tipo: campos.tipo,
          desconto: campos.desconto,
          validoAte: campos.temValidade ? campos.validoAte : null,
          limite: campos.limite,
        });
        if (r.ok) {
          // A tela fica guardada pelo Next ao navegar: volta limpa na próxima vez.
          setCampos(INICIAL);
          setPasso(1);
          router.push(`${detalheHref}?criado=${encodeURIComponent(r.codigo)}`);
          return;
        }
        setErros(r.erros);
        // Erro do passo 1 (ex.: alguém criou o mesmo código nesse meio-tempo): volta para lá.
        if (r.erros.codigo || r.erros.desconto || r.erros.tipo) setPasso(1);
      } catch {
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  const comoFica = normalizarCodigo(campos.codigo);

  return (
    <>
      <Cabecalho
        titulo={`Novo código para ${indicadorNome}`}
        subtitulo={`Passo ${passo} de 2`}
        {...(passo === 1 ? { voltarPara: detalheHref } : { onVoltar: () => setPasso(1) })}
      />
      {passo === 1 ? (
        <form onSubmit={continuar} noValidate className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 px-4 py-4">
            <div className="flex flex-col gap-2">
              <Campo
                id="codigo"
                rotulo="Código"
                exemplo="Ex.: camila5"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="next"
                value={campos.codigo}
                erro={erros.codigo}
                onChange={(e) => mudar("codigo", e.target.value)}
              />
              {comoFica !== "" && (
                <p className="text-base" aria-live="polite">
                  Fica assim: <strong>{comoFica}</strong>
                </p>
              )}
            </div>
            <Escolha<TipoCodigo>
              nome="tipo"
              legenda="Tipo"
              valor={campos.tipo}
              onChange={(v) => mudar("tipo", v)}
              opcoes={[
                { valor: "normal", rotulo: "Normal", descricao: "Pode ser usado várias vezes" },
                { valor: "primeira_compra", rotulo: "Primeira compra", descricao: "Só para quem nunca comprou" },
              ]}
            />
            {erros.tipo && <Aviso tipo="erro">{erros.tipo}</Aviso>}
            <Campo
              id="desconto"
              rotulo="Desconto (%)"
              exemplo="Ex.: 5 ou 7,5"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              value={campos.desconto}
              erro={erros.desconto}
              onChange={(e) => mudar("desconto", e.target.value)}
            />
            {erros.geral && <Aviso tipo="erro">{erros.geral}</Aviso>}
          </div>
          <AcaoFixa>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Conferindo…" : "Continuar"}
            </Botao>
          </AcaoFixa>
        </form>
      ) : (
        <form onSubmit={criar} noValidate className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 px-4 py-4">
            <Escolha<"sem" | "com">
              nome="validade"
              legenda="Validade"
              valor={campos.temValidade ? "com" : "sem"}
              onChange={(v) => mudar("temValidade", v === "com", "validade")}
              opcoes={[
                { valor: "sem", rotulo: "Sem validade" },
                { valor: "com", rotulo: "Vale até", descricao: "O código vale até 23h59 do dia escolhido" },
              ]}
            />
            {campos.temValidade && (
              <Campo
                id="valido-ate"
                rotulo="Vale até o dia"
                type="date"
                min={hoje}
                value={campos.validoAte}
                erro={erros.validade}
                onChange={(e) => mudar("validoAte", e.target.value, "validade")}
              />
            )}
            {!campos.temValidade && erros.validade && <Aviso tipo="erro">{erros.validade}</Aviso>}
            <Campo
              id="limite"
              rotulo="Limite de usos"
              exemplo="Quando chegar nesse número, o app avisa. Não bloqueia vendas."
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              value={campos.limite}
              erro={erros.limite}
              onChange={(e) => mudar("limite", e.target.value)}
            />
            {erros.geral && <Aviso tipo="erro">{erros.geral}</Aviso>}
          </div>
          <AcaoFixa>
            <p className="text-base font-semibold">Depois de criado, o código não pode ser mudado. Só dá para desativar.</p>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Criando…" : "Criar código"}
            </Botao>
          </AcaoFixa>
        </form>
      )}
    </>
  );
}
