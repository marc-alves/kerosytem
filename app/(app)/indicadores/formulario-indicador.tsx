"use client";

import { useState, useTransition } from "react";
import { acaoCadastrarIndicador } from "@/app/(app)/indicadores/acoes";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { ERRO_AO_SALVAR } from "@/components/mensagens";
import { mascararTelefone } from "@/lib/formato/telefone";
import { normalizarTelefone } from "@/lib/indicacao/telefone";

type Erros = { nome?: string; telefone?: string; geral?: string };

/** Bloco "Cadastrar indicador" da spec 10.2. */
export function FormularioIndicador() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [cadastrado, setCadastrado] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  // O erro de um campo some quando a pessoa volta a digitar nele.
  const limparErro = (campo: keyof Erros) => setErros((atual) => ({ ...atual, [campo]: undefined }));

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    iniciar(async () => {
      try {
        const resultado = await acaoCadastrarIndicador({ nome, telefone });
        if (resultado.ok) {
          setNome("");
          setTelefone("");
          setErros({});
          setCadastrado(resultado.nome);
        } else {
          setErros(resultado.erros);
          setCadastrado(null);
        }
      } catch {
        setErros({ geral: ERRO_AO_SALVAR });
      }
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4" aria-labelledby="titulo-cadastrar">
      <h2 id="titulo-cadastrar" className="text-titulo font-semibold">
        Cadastrar indicador
      </h2>
      {/* Fica até o próximo cadastro (nada some sozinho). */}
      {cadastrado && <Aviso tipo="sucesso">{cadastrado} cadastrado(a).</Aviso>}
      <Campo
        id="indicador-nome"
        rotulo="Nome"
        exemplo="Ex.: Camila"
        autoComplete="off"
        enterKeyHint="next"
        value={nome}
        erro={erros.nome}
        onChange={(e) => {
          setNome(e.target.value);
          limparErro("nome");
        }}
      />
      <Campo
        id="indicador-telefone"
        rotulo="Telefone"
        exemplo="Ex.: (61) 99999-9999"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        enterKeyHint="done"
        value={telefone}
        erro={erros.telefone}
        onChange={(e) => {
          setTelefone(mascararTelefone(e.target.value));
          limparErro("telefone");
        }}
        onBlur={() => {
          // Só acrescenta erro: tirar mexeria no layout bem na hora do toque no botão.
          const r = normalizarTelefone(telefone);
          if (telefone !== "" && !r.ok) setErros((atual) => ({ ...atual, telefone: r.mensagem }));
        }}
      />
      {erros.geral && <Aviso tipo="erro">{erros.geral}</Aviso>}
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Cadastrando…" : "Cadastrar indicador"}
      </Botao>
    </form>
  );
}
