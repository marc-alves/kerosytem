/**
 * Endereço do site para o link do cartão (RF8): `APP_URL` quando existe (produção);
 * senão, o da requisição, para funcionar também pelo celular na rede local.
 */
export function enderecoDoSite(entrada: {
  appUrl: string | undefined;
  host: string | null;
  protocolo: string | null;
}): string {
  if (entrada.appUrl) return entrada.appUrl.replace(/\/+$/, "");
  // Atrás de proxy o cabeçalho pode trazer uma lista ("https,http"): vale o primeiro.
  const protocolo = entrada.protocolo?.split(",")[0].trim() || "http";
  return `${protocolo}://${entrada.host ?? "localhost:3000"}`;
}

export function linkDoCartao(endereco: string, chave: string): string {
  return `${endereco}/cartao/${encodeURIComponent(chave)}`;
}
