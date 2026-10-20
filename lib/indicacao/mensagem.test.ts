import { gerarMensagem } from "@/lib/indicacao/mensagem";
import { calcularVenda } from "@/lib/indicacao/venda";

describe("gerarMensagem (seção 8)", () => {
  it("exemplo da spec: João, camila5, 5%, R$ 110,00", () => {
    const { valorOriginal, valorFinal } = calcularVenda({ valorOriginal: 11000, descontoBp: 500 });
    expect(gerarMensagem({ nome: "João", descontoBp: 500, codigo: "camila5", valorOriginal, valorFinal })).toBe(
      "*João*, você ganhou 5% de desconto com o código camila5!\n~R$ 110,00~ por *R$ 104,50*",
    );
  });

  it("percentual com vírgula e milhar com ponto", () => {
    expect(
      gerarMensagem({ nome: "Ana", descontoBp: 750, codigo: "primeiraamanda", valorOriginal: 123400, valorFinal: 114145 }),
    ).toBe("*Ana*, você ganhou 7,5% de desconto com o código primeiraamanda!\n~R$ 1.234,00~ por *R$ 1.141,45*");
  });

  it("tira espaços das pontas do nome para o negrito funcionar no WhatsApp", () => {
    const m = gerarMensagem({ nome: " João ", descontoBp: 500, codigo: "camila5", valorOriginal: 11000, valorFinal: 10450 });
    expect(m.startsWith("*João*,")).toBe(true);
  });

  it("usa espaço comum, nunca espaço não separável", () => {
    const m = gerarMensagem({ nome: "João", descontoBp: 500, codigo: "camila5", valorOriginal: 11000, valorFinal: 10450 });
    expect(m).not.toContain(" ");
  });
});
