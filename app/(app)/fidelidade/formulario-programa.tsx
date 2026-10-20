"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acaoSalvarPrograma } from "@/app/(app)/fidelidade/acoes";
import { AcaoFixa } from "@/components/acao-fixa";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Campo } from "@/components/campo";
import { CartaoCarimbos } from "@/components/cartao-carimbos";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import { estadoCartao } from "@/lib/fidelidade/cartao";
import {
  DIAS_LIBERACAO_PADRAO,
  META_MAXIMA,
  META_SUGERIDA,
  validarPrograma,
  type CamposPrograma,
  type EntradaPrograma,
} from "@/lib/fidelidade/programa";
import { fraseRegra } from "@/lib/fidelidade/textos";
import { lerReais } from "@/lib/formato/leitura";
import { formatarReais } from "@/lib/formato/numero";

type Erros = Partial<Record<CamposPrograma | "geral", string>>;

const NOVO: EntradaPrograma = {
  meta: String(META_SUGERIDA),
  premio: "",
  valorMinimo: "",
  diasLiberacao: String(DIAS_LIBERACAO_PADRAO),
};
const PASSO_1: CamposPrograma[] = ["meta", "premio"];

/** Como o cliente verá o cartão novo, enquanto a pessoa digita (spec 10.4). */
function Previa({ campos }: { campos: EntradaPrograma }) {
  const valido = validarPrograma({ ...NOVO, ...campos, premio: campos.premio || "x" });
  const meta = valido.ok ? valido.programa.meta : Math.min(Math.max(Number(campos.meta) || META_SUGERIDA, 2), META_MAXIMA);
  const minimo = valido.ok ? valido.programa.valorMinimo : null;
  const estado = estadoCartao({ carimbos: [], meta, agora: new Date(0) });
  return (
    <section aria-label="Prévia do cartão" className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-4">
      <p className="text-base text-texto-suave">Assim o cliente vê o cartão:</p>
      <CartaoCarimbos estado={estado} mostrarALiberar={false} />
      <p className="text-base">
        Faltam {meta} para ganhar <strong>{campos.premio.trim() || "o prêmio"}</strong>
      </p>
      <p className="text-base text-texto-suave">{fraseRegra(minimo)}</p>
    </section>
  );
}

/**
 * Spec 10.4 em dois passos (no máximo 3 campos por vez, DESIGN.md seção 2):
 * 1) carimbos e prêmio; 2) valor mínimo e prazo. `inicial = null` cria o programa.
 */
export function FormularioPrograma({ inicial }: { inicial: EntradaPrograma | null }) {
  const router = useRouter();
  const criando = inicial === null;
  const [passo, setPasso] = useState<1 | 2>(1);
  const [campos, setCampos] = useState<EntradaPrograma>(inicial ?? NOVO);
  const [erros, setErros] = useState<Erros>({});
  const [dialogo, setDialogo] = useState(false);
  const [enviando, iniciar] = useTransition();

  function mudar(campo: CamposPrograma, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined, geral: undefined }));
  }

  function continuar(evento: React.FormEvent) {
    evento.preventDefault();
    // O passo 1 é conferido aqui mesmo; tudo é conferido de novo no servidor ao salvar.
    const r = validarPrograma(campos);
    const doPasso = r.ok ? {} : Object.fromEntries(Object.entries(r.erros).filter(([c]) => PASSO_1.includes(c as CamposPrograma)));
    setErros(doPasso);
    if (Object.keys(doPasso).length === 0) setPasso(2);
  }

  function salvar() {
    if (enviando) return;
    iniciar(async () => {
      try {
        const r = await acaoSalvarPrograma(campos);
        setDialogo(false);
        if (r.ok) {
          router.push(`/fidelidade?salvo=${r.criado ? "criado" : "ajustado"}`);
          return;
        }
        setErros(r.erros);
        if (r.erros.meta || r.erros.premio) setPasso(1);
      } catch {
        setDialogo(false);
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (criando) salvar();
    else setDialogo(true);
  }

  const titulo = criando ? "Configure seu cartão fidelidade" : "Ajustar cartão";
  const voltar = passo === 2 ? { onVoltar: () => setPasso(1) } : criando ? {} : { voltarPara: "/fidelidade" };

  return (
    <>
      <Cabecalho titulo={titulo} subtitulo={`Passo ${passo} de 2`} {...voltar} />
      {criando && passo === 1 && (
        <p className="px-4 pt-4 text-base">
          A cada compra paga, o cliente ganha um carimbo. Ao completar o cartão, ganha um prêmio.
        </p>
      )}

      {passo === 1 && (
        <form onSubmit={continuar} noValidate className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 px-4 py-4">
            <Campo
              id="meta"
              rotulo="Carimbos para completar"
              exemplo={`Ex.: ${META_SUGERIDA}`}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              enterKeyHint="next"
              value={campos.meta}
              erro={erros.meta}
              onChange={(e) => mudar("meta", e.target.value)}
            />
            <Campo
              id="premio"
              rotulo="Prêmio"
              exemplo="Ex.: 1 salgado grátis"
              autoComplete="off"
              enterKeyHint="done"
              maxLength={80}
              value={campos.premio}
              erro={erros.premio}
              onChange={(e) => mudar("premio", e.target.value)}
            />
            <Previa campos={campos} />
          </div>
          <AcaoFixa>
            <Botao type="submit">Continuar</Botao>
          </AcaoFixa>
        </form>
      )}

      {passo === 2 && (
        <form onSubmit={enviar} noValidate className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 px-4 py-4">
            <div className="flex flex-col gap-2">
              <Campo
                id="valor-minimo"
                rotulo="Valor mínimo da compra (se quiser)"
                exemplo="Ex.: 15"
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                enterKeyHint="next"
                value={campos.valorMinimo}
                erro={erros.valorMinimo}
                onChange={(e) => mudar("valorMinimo", e.target.value)}
                onBlur={() => {
                  // "15" vira "R$ 15,00", como o valor da Nova venda.
                  const r = lerReais(campos.valorMinimo);
                  if (r.ok) setCampos((atual) => ({ ...atual, valorMinimo: formatarReais(r.centavos) }));
                }}
              />
              <p className="text-base text-texto-suave">
                Compras abaixo deste valor não ganham carimbo. Deixe vazio para valer qualquer compra.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Campo
                id="dias-liberacao"
                rotulo="Dias para liberar o carimbo"
                exemplo={`Ex.: ${DIAS_LIBERACAO_PADRAO}`}
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="done"
                value={campos.diasLiberacao}
                erro={erros.diasLiberacao}
                onChange={(e) => mudar("diasLiberacao", e.target.value)}
              />
              <p className="text-base text-texto-suave">
                Use o seu prazo de devolução. O prêmio só sai de compras que já passaram desse prazo. 0 = libera na hora.
              </p>
            </div>
            <Previa campos={campos} />
            {erros.geral && <Aviso tipo="erro">{erros.geral}</Aviso>}
          </div>
          <AcaoFixa>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : criando ? "Criar cartão fidelidade" : "Salvar ajustes"}
            </Botao>
          </AcaoFixa>
        </form>
      )}

      <DialogoConfirmacao
        aberto={dialogo}
        titulo="Salvar ajustes"
        textoConfirmar="Sim, salvar"
        ocupado={enviando}
        onConfirmar={salvar}
        onVoltar={() => setDialogo(false)}
      >
        <p>Salvar os ajustes? Vale para todos os cartões a partir de agora. Carimbos já ganhos continuam.</p>
      </DialogoConfirmacao>
    </>
  );
}
