import { randomBytes } from "node:crypto";

/** RF8: 32 bytes aleatórios em base64url (43 caracteres); nunca derivada de telefone, nome ou id. */
export function gerarChaveCartao(): string {
  return randomBytes(32).toString("base64url");
}
