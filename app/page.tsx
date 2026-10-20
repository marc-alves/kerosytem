import { redirect } from "next/navigation";

// A ação mais usada é lançar venda (DESIGN.md seção 1).
export default function Inicio() {
  redirect("/vendas/nova");
}
