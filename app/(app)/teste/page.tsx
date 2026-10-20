// TEMPORÁRIA: página para testar cada tela com os dados mockados. Some em produção.
// Apagar quando o Supabase entrar (T43).
import Link from "next/link";
import { notFound } from "next/navigation";
import { refresh } from "next/cache";
import { Suspense, type ReactNode } from "react";
import { Botao } from "@/components/botao";
import { Cabecalho } from "@/components/cabecalho";
import { Cartao } from "@/components/cartao";
import { descreverCodigo } from "@/lib/formato/codigo";
import { Carregando } from "@/components/estados";
import { ROTULO_STATUS } from "@/components/selo-status";
import {
  alternarModuloMock,
  empresaDaSessao,
  reiniciarBancoMock,
  removerProgramaMock,
  repositorio,
} from "@/lib/dados/sessao";
import type { Modulo } from "@/lib/dados/tipos";
import { MODULOS, moduloAtivo } from "@/lib/empresas/modulos";
import { formatarReais } from "@/lib/formato/numero";

async function reiniciar() {
  "use server";
  if (process.env.NODE_ENV === "production") return;
  reiniciarBancoMock();
  refresh();
}

async function alternarModulo(modulo: Modulo) {
  "use server";
  if (process.env.NODE_ENV === "production") return;
  alternarModuloMock(modulo);
  refresh();
}

async function removerPrograma() {
  "use server";
  if (process.env.NODE_ENV === "production") return;
  removerProgramaMock();
  refresh();
}

const NOME_MODULO: Record<Modulo, string> = { indicacao: "Indicação", fidelidade: "Fidelidade" };

/** Spec 000, RE5: no Supabase, quem liga e desliga é o admin pelo painel. */
async function Modulos() {
  const empresa = await empresaDaSessao();
  return (
    <div className="flex flex-col gap-3">
      {MODULOS.map((m) => {
        const ativo = moduloAtivo(empresa, m);
        return (
          <form key={m} action={alternarModulo.bind(null, m)}>
            <Botao type="submit" variante="secundario">
              {ativo ? `Desligar ${NOME_MODULO[m]} (ligado)` : `Ligar ${NOME_MODULO[m]} (desligado)`}
            </Botao>
          </form>
        );
      })}
    </div>
  );
}

function Item({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-base font-semibold text-laranja-escuro underline underline-offset-4">
        {href}
      </Link>
      <p className="text-base text-texto-suave">{children}</p>
    </li>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Cartao className="flex flex-col gap-3">
      <h2 className="text-botao font-semibold">{titulo}</h2>
      {children}
    </Cartao>
  );
}

/** Vendas de agora (mudam conforme você testa), cada uma com o link da tela de sucesso. */
async function VendasAtuais() {
  const repo = await repositorio();
  const vendas = await repo.listarVendas({ indicador: "todos", desde: null, situacao: "todas" });
  return (
    <ul className="flex flex-col gap-3">
      {vendas.map((v) => (
        <Item key={v.id} href={`/vendas/${v.id}/lancada`}>
          {v.cliente.nome} · {descreverCodigo(v.codigo)} · {formatarReais(v.valorFinal)} · {ROTULO_STATUS[v.status]}
        </Item>
      ))}
    </ul>
  );
}

export default function PaginaTeste() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <Cabecalho titulo="Página de teste" subtitulo="Só existe no npm run dev" />
      <div className="flex flex-col gap-4 px-4 py-4">
        <Secao titulo="Dados de teste">
          <p className="text-base">
            Você está como <strong>Lanchonete da Maria</strong>. Os dados ficam na memória do servidor: reiniciar o{" "}
            <code>npm run dev</code> ou tocar no botão abaixo volta tudo ao começo.
          </p>
          <form action={reiniciar}>
            <Botao type="submit" variante="secundario">
              Voltar os dados ao começo
            </Botao>
          </form>
        </Secao>

        <Secao titulo="Módulos da empresa">
          <p className="text-base">Desligue um módulo para ver o app só com o outro.</p>
          <Suspense fallback={<Carregando />}>
            <Modulos />
          </Suspense>
        </Secao>

        <Secao titulo="Cartão fidelidade (spec 002)">
          <ul className="flex flex-col gap-3">
            <Item href="/fidelidade">Lista de cartões e resumo do programa (spec 10.1)</Item>
            <Item href="/fidelidade/ajustar">Ajustar cartão, 2 passos (spec 10.4)</Item>
            <Item href="/fidelidade/clientes/a-cli-ana">Ana: cartão completo e liberado; Registrar resgate (spec 10.2)</Item>
            <Item href="/fidelidade/clientes/a-cli-bia">Bia: completa, mas o prêmio ainda está no prazo de devolução</Item>
            <Item href="/fidelidade/clientes/a-cli-carla">Carla: já resgatou (e tem um resgate desfeito); 2 carimbos no cartão</Item>
            <Item href="/fidelidade/clientes/a-cli-joao">João: no meio do cartão, com carimbo a liberar</Item>
            <Item href="/fidelidade/clientes/b-cli-joao">Cliente de outra empresa: deve dar &quot;não encontrado&quot;</Item>
          </ul>
          <p className="text-base font-semibold">O que o cliente vê (sem login, spec 11.1):</p>
          <ul className="flex flex-col gap-3">
            <Item href="/cartao/teste-joao">Cartão do João</Item>
            <Item href="/cartao/teste-bia">Cartão da Bia: completo, pode pedir a partir de…</Item>
            <Item href="/cartao/teste-ana">Cartão da Ana: completo</Item>
            <Item href="/cartao/abc">Link inventado: &quot;Este cartão não foi encontrado.&quot;</Item>
          </ul>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
            <li>
              Carimbo: confirme o recebimento da venda do João no detalhe da Camila; aparece &quot;João ganhou 1 carimbo&quot; e
              o botão Copiar mensagem do cartão.
            </li>
            <li>
              Venda presa num resgate: em Vendas (Tudo, Pago), cancele a venda mais antiga da Carla; a recusa traz o link para o
              cartão dela. Desfaça o resgate e cancele de novo: passa.
            </li>
            <li>Gerar novo link no cartão da Ana e abrir o antigo (/cartao/teste-ana): &quot;não encontrado&quot;.</li>
            <li>Só Fidelidade: desligue a Indicação acima; a Nova venda fica sem o campo Código e a venda ainda ganha carimbo.</li>
            <li>Desligue a Fidelidade: o destino some e os links /cartao/… passam a dar &quot;não encontrado&quot;.</li>
          </ul>
          <form action={removerPrograma}>
            <Botao type="submit" variante="secundario">
              Tirar o programa (para testar a criação)
            </Botao>
          </form>
        </Secao>

        <Secao titulo="Telas principais">
          <ul className="flex flex-col gap-3">
            <Item href="/vendas/nova">Nova venda, 3 passos (spec 10.5)</Item>
            <Item href="/vendas">Lista de vendas com filtros (spec 10.7)</Item>
            <Item href="/indicadores">Lista de indicadores e cadastro (spec 10.2)</Item>
          </ul>
        </Secao>

        <Secao titulo="Indicadores">
          <ul className="flex flex-col gap-3">
            <Item href="/indicadores/a-ind-camila">Camila: camila5 ativo, camila10 desativado, vendas pagas e aguardando (spec 10.3)</Item>
            <Item href="/indicadores/a-ind-amanda">Amanda: código de primeira compra, sem vendas</Item>
            <Item href="/indicadores/a-ind-camila/codigos/novo">Criar código para Camila (spec 10.4)</Item>
            <Item href="/indicadores/b-ind-camila">Indicador de outra empresa: deve dar &quot;não encontrado&quot;</Item>
            <Item href="/indicadores/nao-existe">Indicador que não existe</Item>
          </ul>
        </Secao>

        <Secao titulo="Vendas lançadas (spec 10.6)">
          <Suspense fallback={<Carregando />}>
            <VendasAtuais />
          </Suspense>
          <ul className="flex flex-col gap-3">
            <Item href="/vendas/b-ven-1/lancada">Venda de outra empresa: deve dar &quot;não encontrada&quot;</Item>
          </ul>
        </Secao>

        <Secao titulo="Filtros prontos da lista de vendas">
          <ul className="flex flex-col gap-3">
            <Item href="/vendas?indicador=todos&periodo=tudo&situacao=todas">Tudo</Item>
            <Item href="/vendas?indicador=a-ind-camila&periodo=tudo&situacao=confirmada">Pagas da Camila</Item>
            <Item href="/vendas?indicador=sem_codigo&periodo=30dias&situacao=todas">Sem código, últimos 30 dias</Item>
            <Item href="/vendas?indicador=todos&periodo=tudo&situacao=cancelada">Canceladas</Item>
            <Item href="/vendas?indicador=todos&periodo=hoje&situacao=cancelada">Filtro que pode vir vazio</Item>
          </ul>
        </Secao>

        <Secao titulo="Para digitar na Nova venda">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
            <li>
              <strong>(61) 90000-0010</strong>: João, já cliente, vinculado à Camila. Use <strong>camila5</strong> (aceito) ou{" "}
              <strong>primeiraamanda</strong> (recusado: é cliente da Camila).
            </li>
            <li>
              <strong>(61) 90000-0011</strong>: Pedro, já comprou sem código. <strong>primeiraamanda</strong> é recusado (já comprou).
            </li>
            <li>
              <strong>(61) 90000-0001</strong>: telefone da própria Camila. Com <strong>camila5</strong>: recusado (autoindicação).
            </li>
            <li>
              Qualquer outro telefone: cliente novo, pede o nome. <strong>primeiraamanda</strong> é aceito; lance duas vezes e a
              segunda mostra o aviso de venda aguardando confirmação.
            </li>
            <li>
              <strong>camila10</strong>: desativado. <strong>CAMILA5</strong> ou <strong>Camila 5</strong>: aceito igual a camila5.{" "}
              <strong>xyz</strong>: não encontrado.
            </li>
            <li>Valor: 110 vira R$ 110,00; 0 ou texto é recusado. Com camila5, 110 dá R$ 104,50.</li>
            <li>Sem código: deixe o campo do código vazio (a tela de sucesso não mostra mensagem).</li>
          </ul>
        </Secao>

        <Secao titulo="Outros cenários">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
            <li>Cadastrar indicador com (61) 90000-0001: recusado, telefone já é da Camila.</li>
            <li>Criar código &quot;Camila5&quot;: recusado, já existe.</li>
            <li>
              Limite de usos: crie um código com limite 1, lance uma venda com ele e confirme o recebimento. O aviso aparece no
              detalhe do indicador e na Nova venda.
            </li>
            <li>Confirmar recebimento e cancelar venda: no detalhe da Camila ou na lista de vendas.</li>
            <li>Sem internet: desligue a rede do celular, aparece a faixa &quot;Sem internet. Nada foi salvo.&quot;</li>
          </ul>
        </Secao>
      </div>
    </>
  );
}
