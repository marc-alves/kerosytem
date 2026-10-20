"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acaoBuscarCliente, acaoLancarVenda, acaoPreviaVenda } from "@/app/(app)/vendas/acoes";
import { AcaoFixa } from "@/components/acao-fixa";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Campo } from "@/components/campo";
import { descreverCodigo } from "@/lib/formato/codigo";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import type { PreviaVenda } from "@/lib/casos-de-uso/vendas";
import { lerReais } from "@/lib/formato/leitura";
import { formatarPercentual, formatarReais } from "@/lib/formato/numero";
import { formatarTelefone, mascararTelefone } from "@/lib/formato/telefone";

type Campos = { telefone: string; nome: string; codigo: string; valor: string };
type Erros = Partial<Record<keyof Campos | "geral", string>>;
/** Resultado da busca do telefone digitado; `nome: null` = cliente novo. */
type ClienteBuscado = { telefone: string; nome: string | null };

const INICIAL: Campos = { telefone: "", nome: "", codigo: "", valor: "" };

/** `R$` e o número sempre na mesma linha. */
function Reais({ centavos }: { centavos: number }) {
  return <span className="whitespace-nowrap tabular-nums">{formatarReais(centavos)}</span>;
}

/**
 * Spec 10.5 (fluxo da seção 9): cliente, compra e conferência.
 * `comCodigo = false` quando a empresa não usa o módulo de Indicação (spec 000, RE7).
 */
export function FormularioVenda({ comCodigo }: { comCodigo: boolean }) {
  const router = useRouter();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [campos, setCampos] = useState<Campos>(INICIAL);
  const [erros, setErros] = useState<Erros>({});
  const [cliente, setCliente] = useState<ClienteBuscado | null>(null);
  const [previa, setPrevia] = useState<PreviaVenda | null>(null);
  const [ocupado, iniciar] = useTransition();
  // Separado: "Lançando…" não pode aparecer enquanto a tela 2 ainda confere.
  const [lancando, iniciarLancamento] = useTransition();
  const clienteNovo = cliente !== null && cliente.telefone === campos.telefone && cliente.nome === null;
  const clienteExistente = cliente !== null && cliente.telefone === campos.telefone && cliente.nome !== null;

  function mudar(campo: keyof Campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined, geral: undefined }));
    // Outro telefone: a busca anterior não vale mais.
    if (campo === "telefone") setCliente(null);
  }

  async function buscar(telefone: string): Promise<ClienteBuscado | null> {
    const r = await acaoBuscarCliente(telefone);
    if (!r.ok) {
      setErros((atual) => ({ ...atual, telefone: r.erros.telefone }));
      return null;
    }
    const encontrado = { telefone, nome: r.nome };
    setCliente(encontrado);
    return encontrado;
  }

  /** Ao sair do campo: mostra "Cliente: {nome}" ou o campo de nome, sem esperar o Continuar. */
  function aoSairDoTelefone() {
    const telefone = campos.telefone;
    if (telefone === "" || cliente?.telefone === telefone) return;
    // Fora da transição: não trava o Continuar, que muitas vezes é o toque que tirou o foco.
    buscar(telefone).catch(() => {
      // Sem resposta: o Continuar tenta de novo e mostra o erro.
    });
  }

  function continuarDoCliente(evento: React.FormEvent) {
    evento.preventDefault();
    if (ocupado) return;
    iniciar(async () => {
      try {
        const achado = cliente?.telefone === campos.telefone ? cliente : await buscar(campos.telefone);
        if (!achado) return;
        if (achado.nome === null && campos.nome.trim() === "") {
          // Se o campo de nome ainda não estava na tela, ele só aparece; o erro vem se continuar vazio.
          if (clienteNovo) setErros({ nome: "Digite o nome do cliente." });
          return;
        }
        setErros({});
        setPasso(2);
      } catch {
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  function continuarDaCompra(evento: React.FormEvent) {
    evento.preventDefault();
    if (ocupado) return;
    iniciar(async () => {
      try {
        const r = await acaoPreviaVenda(campos);
        if (r.ok) {
          setPrevia(r.previa);
          setErros({});
          setPasso(3);
          return;
        }
        setErros(r.erros);
        if (r.erros.telefone || r.erros.nome) setPasso(1);
      } catch {
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  function lancar() {
    if (lancando) return;
    iniciarLancamento(async () => {
      try {
        const r = await acaoLancarVenda(campos);
        if (r.ok) {
          // A tela fica guardada pelo Next ao navegar: a próxima venda começa limpa.
          setCampos(INICIAL);
          setCliente(null);
          setPrevia(null);
          setPasso(1);
          router.push(`/vendas/${r.vendaId}/lancada`);
          return;
        }
        // Algo mudou desde a tela 2 (ex.: código desativado): explica aqui e deixa voltar.
        setErros({ ...r.erros, geral: r.erros.geral ?? Object.values(r.erros).find(Boolean) ?? ERRO_AO_SALVAR });
      } catch {
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  // Volta mantendo o que foi digitado e os erros de campo (ex.: o do código, se a gravação recusou).
  const voltar = () => {
    setErros((atual) => ({ ...atual, geral: undefined }));
    setPasso((p) => (p === 3 ? 2 : 1));
  };

  return (
    <>
      <Cabecalho titulo="Nova venda" subtitulo={`Passo ${passo} de 3`} onVoltar={passo > 1 ? voltar : undefined} />

      {passo === 1 && (
        <form onSubmit={continuarDoCliente} noValidate className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 px-4 py-4">
            <div className="flex flex-col gap-2">
              <Campo
                id="telefone"
                rotulo="Telefone do cliente"
                exemplo="Ex.: (61) 99999-9999"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                autoFocus
                enterKeyHint="next"
                value={campos.telefone}
                erro={erros.telefone}
                onChange={(e) => mudar("telefone", mascararTelefone(e.target.value))}
                onBlur={aoSairDoTelefone}
              />
              {clienteExistente && (
                <p className="text-botao font-semibold" aria-live="polite">
                  Cliente: {cliente.nome}
                </p>
              )}
            </div>
            {clienteNovo && (
              <Campo
                id="nome"
                rotulo="Nome do cliente"
                exemplo="Ex.: João"
                autoComplete="off"
                autoFocus
                enterKeyHint="next"
                value={campos.nome}
                erro={erros.nome}
                onChange={(e) => mudar("nome", e.target.value)}
              />
            )}
            {erros.geral && <Aviso tipo="erro">{erros.geral}</Aviso>}
          </div>
          <AcaoFixa>
            <Botao type="submit" disabled={ocupado}>
              Continuar
            </Botao>
          </AcaoFixa>
        </form>
      )}

      {passo === 2 && (
        <form onSubmit={continuarDaCompra} noValidate className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 px-4 py-4">
            {comCodigo && (
              <Campo
                id="codigo"
                rotulo="Código (se tiver)"
                exemplo="Ex.: camila5"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                enterKeyHint="next"
                value={campos.codigo}
                erro={erros.codigo}
                onChange={(e) => mudar("codigo", e.target.value)}
              />
            )}
            <Campo
              id="valor"
              rotulo="Valor da compra"
              autoFocus={!comCodigo}
              exemplo="Ex.: 110 ou 110,50"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              value={campos.valor}
              erro={erros.valor}
              onChange={(e) => mudar("valor", e.target.value)}
              onBlur={() => {
                // "110" vira "R$ 110,00" (DESIGN.md seção 8); texto inválido fica como está.
                const r = lerReais(campos.valor);
                if (r.ok) setCampos((atual) => ({ ...atual, valor: formatarReais(r.centavos) }));
              }}
            />
            {erros.geral && <Aviso tipo="erro">{erros.geral}</Aviso>}
          </div>
          <AcaoFixa>
            <Botao type="submit" disabled={ocupado}>
              {ocupado ? "Conferindo…" : "Continuar"}
            </Botao>
          </AcaoFixa>
        </form>
      )}

      {passo === 3 && previa && (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-5 px-4 py-4">
            <div>
              <p className="text-base text-texto-suave">Cliente</p>
              <p className="text-botao font-semibold">{previa.cliente.nome}</p>
              <p className="text-base">{formatarTelefone(previa.cliente.telefone)}</p>
            </div>
            {comCodigo && (
              <div>
                <p className="text-base text-texto-suave">Código</p>
                <p className="text-botao font-semibold">{descreverCodigo(previa.codigo)}</p>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {previa.codigo ? (
                <>
                  <p className="text-valor text-texto-suave">
                    <s>
                      <Reais centavos={previa.calculo.valorOriginal} />
                    </s>
                  </p>
                  <p className="text-base">
                    {formatarPercentual(previa.calculo.descontoBp)} de desconto:{" "}
                    <Reais centavos={previa.calculo.valorDesconto} />
                  </p>
                  <p className="text-base text-texto-suave">Valor final</p>
                </>
              ) : (
                <p className="text-base text-texto-suave">Valor</p>
              )}
              <p className="text-valor-destaque font-semibold">
                <Reais centavos={previa.calculo.valorFinal} />
              </p>
            </div>
            {previa.avisos.map((aviso) => (
              <Aviso key={aviso.tipo}>{aviso.mensagem}</Aviso>
            ))}
            {erros.geral && (
              <Aviso
                tipo="erro"
                acao={
                  <Botao variante="secundario" onClick={voltar}>
                    Voltar
                  </Botao>
                }
              >
                {erros.geral}
              </Aviso>
            )}
          </div>
          <AcaoFixa>
            <Botao onClick={lancar} disabled={lancando}>
              {lancando ? "Lançando…" : "Lançar venda"}
            </Botao>
          </AcaoFixa>
        </div>
      )}
    </>
  );
}
