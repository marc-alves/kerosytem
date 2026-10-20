import {
  escolherMensagem,
  gerarMensagemCarimbo,
  gerarMensagemCompleto,
  gerarMensagemCompletoALiberar,
  gerarMensagemLink,
  primeiroNome,
} from "@/lib/fidelidade/mensagem";
import type { EstadoCartao } from "@/lib/fidelidade/tipos";

const base = { nome: "João", empresa: "Lanchonete da Maria", link: "https://kero.app/cartao/9f3k" };
const premio = "1 salgado grátis";

const estado = (parcial: Partial<EstadoCartao>): EstadoCartao => ({
  meta: 10,
  noCartao: 4,
  liberados: 4,
  aLiberar: 0,
  exibido: 4,
  completo: false,
  sobra: 0,
  faltam: 6,
  podeResgatar: false,
  premioLiberadoEm: null,
  proximaLiberacao: null,
  ...parcial,
});

describe("primeiroNome", () => {
  it("primeira palavra, sem espaços", () => {
    expect(primeiroNome("  João  da Silva ")).toBe("João");
    expect(primeiroNome("Ana")).toBe("Ana");
  });
});

describe("mensagens da seção 8", () => {
  it("carimbo ganho: exemplo da spec exatamente igual", () => {
    expect(gerarMensagemCarimbo({ ...base, nome: "João Silva", carimbos: 4, meta: 10, faltam: 6, premio })).toBe(
      "*João*, sua compra na Lanchonete da Maria valeu 1 carimbo!\n" +
        "Você tem 4 de 10. Faltam 6 para ganhar *1 salgado grátis*.\n" +
        "Veja seu cartão: https://kero.app/cartao/9f3k",
    );
  });

  it("cartão completo", () => {
    expect(gerarMensagemCompleto({ ...base, premio })).toBe(
      "*João*, seu cartão da Lanchonete da Maria está completo!\n" +
        "Você ganhou *1 salgado grátis*. É só pedir na próxima visita.\n" +
        "Veja seu cartão: https://kero.app/cartao/9f3k",
    );
  });

  it("completo a liberar, com a data de Brasília", () => {
    expect(gerarMensagemCompletoALiberar({ ...base, premio, liberadoEm: new Date("2026-11-08T03:00:00Z") })).toBe(
      "*João*, seu cartão da Lanchonete da Maria está completo!\n" +
        "Você ganhou *1 salgado grátis*. Pode pedir a partir de 08/11/2026.\n" +
        "Veja seu cartão: https://kero.app/cartao/9f3k",
    );
  });

  it("só o link", () => {
    expect(gerarMensagemLink(base)).toBe(
      "*João*, este é o seu cartão fidelidade da Lanchonete da Maria:\nhttps://kero.app/cartao/9f3k",
    );
  });
});

describe("escolherMensagem", () => {
  it("depois da confirmação, cartão não completo: carimbo ganho", () => {
    expect(escolherMensagem({ ...base, premio, estado: estado({}), momento: "carimbo" })).toContain("valeu 1 carimbo");
  });

  it("no cartão do cliente, não completo: só o link", () => {
    expect(escolherMensagem({ ...base, premio, estado: estado({}), momento: "cartao" })).toBe(gerarMensagemLink(base));
  });

  it("completo e liberado: completo", () => {
    const e = estado({ noCartao: 10, exibido: 10, completo: true, faltam: 0, podeResgatar: true });
    expect(escolherMensagem({ ...base, premio, estado: e, momento: "carimbo" })).toBe(gerarMensagemCompleto({ ...base, premio }));
  });

  it("completo a liberar: com a data", () => {
    const liberadoEm = new Date("2026-11-08T03:00:00Z");
    const e = estado({ noCartao: 10, exibido: 10, completo: true, faltam: 0, premioLiberadoEm: liberadoEm });
    expect(escolherMensagem({ ...base, premio, estado: e, momento: "cartao" })).toContain("Pode pedir a partir de 08/11/2026.");
  });
});
