import { enderecoDoSite, linkDoCartao } from "@/lib/fidelidade/link";

describe("link do cartão (RF8)", () => {
  it("APP_URL tem preferência, sem barra no fim", () => {
    expect(enderecoDoSite({ appUrl: "https://kero.app/", host: "192.168.0.10:3000", protocolo: "http" })).toBe("https://kero.app");
  });

  it("sem APP_URL: endereço da requisição", () => {
    expect(enderecoDoSite({ appUrl: undefined, host: "192.168.0.10:3000", protocolo: null })).toBe("http://192.168.0.10:3000");
    expect(enderecoDoSite({ appUrl: "", host: "kero.app", protocolo: "https, http" })).toBe("https://kero.app");
  });

  it("monta /cartao/{chave}", () => {
    expect(linkDoCartao("https://kero.app", "a_b-C")).toBe("https://kero.app/cartao/a_b-C");
  });
});
