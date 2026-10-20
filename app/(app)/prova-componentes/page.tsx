// TEMPORÁRIA: só para conferir os componentes no celular (T30/T31). Apagar antes do commit.
"use client";
import { useState } from "react";
import { AcaoFixa } from "@/components/acao-fixa";
import { Aviso } from "@/components/aviso";
import { Botao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Campo } from "@/components/campo";
import { Cartao } from "@/components/cartao";
import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { Carregando, Erro, Vazio } from "@/components/estados";
import { Escolha } from "@/components/escolha";
import { SeloCodigo, SeloStatus } from "@/components/selo-status";

export default function Prova() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Cabecalho titulo="Detalhe da Camila" voltarPara="/indicadores" />
      <div className="flex flex-col gap-4 px-4 py-4">
        <Campo id="t" rotulo="Telefone do cliente" exemplo="Ex.: (61) 99999-9999" inputMode="tel" defaultValue="(61) 9999" erro="O telefone precisa ter DDD e número." />
        <Campo id="v" rotulo="Valor da compra" exemplo="Ex.: 110,00" inputMode="decimal" />
        <Cartao className="flex flex-col gap-2">
          <p className="text-base font-semibold">João</p>
          <p className="text-valor font-semibold tabular-nums">R$ 104,50</p>
          <div className="flex flex-wrap gap-2"><SeloStatus status="pendente" /><SeloStatus status="confirmada" /><SeloStatus status="cancelada" /><SeloCodigo ativo /><SeloCodigo ativo={false} /></div>
        </Cartao>
        <Escolha nome="tipo" legenda="Tipo" valorInicial="normal" opcoes={[{ valor: "normal", rotulo: "Normal", descricao: "Pode ser usado várias vezes" }, { valor: "primeira_compra", rotulo: "Primeira compra", descricao: "Só para quem nunca comprou" }]} />
        <Escolha nome="periodo" legenda="Período" colunas={2} valorInicial="7" opcoes={[{ valor: "hoje", rotulo: "Hoje" }, { valor: "7", rotulo: "Últimos 7 dias" }, { valor: "30", rotulo: "Últimos 30 dias" }, { valor: "tudo", rotulo: "Tudo" }]} />
        <Aviso acao={<Botao variante="secundario">Criar novo código</Botao>}>Este código atingiu 10 usos, considere gerar um novo código para Camila.</Aviso>
        <Aviso tipo="erro">Este cliente já usa os códigos de Camila. Use um código de Camila.</Aviso>
        <Botao variante="secundario">Criar código</Botao>
        <Botao variante="perigo" onClick={() => setAberto(true)}>Cancelar venda</Botao>
        <Botao variante="link">Desfazer esta venda</Botao>
        <Carregando />
        <Vazio mensagem="Nenhum indicador ainda." acao={<Botao variante="secundario">Cadastrar o primeiro</Botao>} />
        <Erro mensagem="Não deu para carregar as vendas." onTentarDeNovo={() => {}} />
      </div>
      <AcaoFixa><Botao onClick={() => setAberto(true)}>Confirmar recebimento</Botao></AcaoFixa>
      <DialogoConfirmacao aberto={aberto} titulo="Cancelar venda" textoConfirmar="Sim, cancelar venda" perigo onConfirmar={() => setAberto(false)} onVoltar={() => setAberto(false)}>
        <p>Cancelar esta venda de R$ 104,50 de João?</p><p>Ela deixa de contar como uso do código.</p>
      </DialogoConfirmacao>
    </>
  );
}
