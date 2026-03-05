import { restGet, restPost, restPatch, restDelete } from "./supabaseRest";

export type ContaStatus = "pendente" | "pago" | "vencido";
export type ContaTipo   = "pagar" | "receber";

export interface Conta {
  id:         string;
  descricao:  string;
  valor:      number;
  tipo:       ContaTipo;
  vencimento: string; // YYYY-MM-DD
  status:     ContaStatus;
  categoria:  string;
  observacao: string | null;
  created_at: string;
}

export interface ContaInput {
  descricao:   string;
  valor:       number;
  tipo:        ContaTipo;
  vencimento:  string;
  categoria:   string;
  observacao?: string;
}

export const CATEGORIAS_PAGAR    = ["Fornecedor","Aluguel","Salarios","Agua/Luz","Internet","Manutencao","Impostos","Material","Outros"];
export const CATEGORIAS_RECEBER  = ["Venda","Servico","Reembolso","Transferencia","Outros"];

export async function fetchContas(): Promise<Conta[]> {
  const rows = await restGet<Conta>("contas", { order: "vencimento.asc" });
  const today = new Date().toISOString().split("T")[0];
  // Auto-mark as vencido if past due and still pendente
  return rows.map(c => ({
    ...c,
    status: c.status === "pendente" && c.vencimento < today ? "vencido" : c.status,
  }));
}

export async function createConta(input: ContaInput): Promise<Conta> {
  return restPost<Conta>("contas", {
    descricao:  input.descricao,
    valor:      input.valor,
    tipo:       input.tipo,
    vencimento: input.vencimento,
    status:     "pendente",
    categoria:  input.categoria,
    observacao: input.observacao ?? null,
  });
}

export async function updateContaStatus(id: string, status: "pendente" | "pago"): Promise<void> {
  await restPatch("contas", { column: "id", value: id }, { status });
}

export async function deleteConta(id: string): Promise<void> {
  await restDelete("contas", { column: "id", value: id });
}
