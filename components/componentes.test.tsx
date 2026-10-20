import { renderToStaticMarkup } from "react-dom/server";
import { Campo } from "@/components/campo";
import { Escolha } from "@/components/escolha";
import { SeloCodigo, SeloStatus } from "@/components/selo-status";

describe("SeloStatus", () => {
  it("usa os rótulos da spec, sempre com ícone", () => {
    for (const [status, rotulo] of [
      ["pendente", "Aguardando pagamento"],
      ["confirmada", "Pago"],
      ["cancelada", "Cancelada"],
    ] as const) {
      const html = renderToStaticMarkup(<SeloStatus status={status} />);
      expect(html).toContain(rotulo);
      expect(html).toContain("<svg");
    }
  });
});

describe("Campo", () => {
  it("liga rótulo, exemplo e erro ao campo", () => {
    const html = renderToStaticMarkup(
      <Campo id="telefone" rotulo="Telefone do cliente" exemplo="Ex.: (61) 99999-9999" erro="O telefone precisa ter DDD" />,
    );
    expect(html).toContain('<label for="telefone"');
    expect(html).toContain('aria-describedby="telefone-exemplo telefone-erro"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("O telefone precisa ter DDD");
  });

  it("sem erro, não marca o campo como inválido", () => {
    const html = renderToStaticMarkup(<Campo id="valor" rotulo="Valor da compra" />);
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("aria-describedby");
  });
});

describe("SeloCodigo", () => {
  it("mostra Ativo ou Desativado com ícone", () => {
    expect(renderToStaticMarkup(<SeloCodigo ativo />)).toMatch(/<svg.*Ativo/);
    expect(renderToStaticMarkup(<SeloCodigo ativo={false} />)).toMatch(/<svg.*Desativado/);
  });
});

describe("Escolha", () => {
  it("vira botões de rádio com legenda e a opção inicial marcada", () => {
    const html = renderToStaticMarkup(
      <Escolha
        nome="tipo"
        legenda="Tipo"
        valorInicial="normal"
        opcoes={[
          { valor: "normal", rotulo: "Normal", descricao: "Pode ser usado várias vezes" },
          { valor: "primeira_compra", rotulo: "Primeira compra", descricao: "Só para quem nunca comprou" },
        ]}
      />,
    );
    expect(html).toContain("<legend");
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toMatch(/checked="" value="normal"/);
    expect(html).toContain("Só para quem nunca comprou");
  });
});
