import { restGet, restPost, restPatch } from "./supabaseRest";

export interface Fornecedor {
  id:          string;
  nome:        string;
  cnpj:        string | null;
  telefone:    string | null;
  email:       string | null;
  contato:     string | null;
  observacoes: string | null;
  is_active:   boolean;
  created_at:  string;
}

export interface FornecedorInput {
  nome:        string;
  cnpj?:       string;
  telefone?:   string;
  email?:      string;
  contato?:    string;
  observacoes?: string;
}

export async function fetchFornecedores(): Promise<Fornecedor[]> {
  return restGet<Fornecedor>("fornecedores", {
    order: "nome.asc",
  });
}

export async function createFornecedor(input: FornecedorInput): Promise<void> {
  await restPost("fornecedores", {
    nome:        input.nome.trim(),
    cnpj:        input.cnpj?.trim()        || null,
    telefone:    input.telefone?.trim()    || null,
    email:       input.email?.trim()       || null,
    contato:     input.contato?.trim()     || null,
    observacoes: input.observacoes?.trim() || null,
    is_active:   true,
    updated_at:  new Date().toISOString(),
  });
}

export async function updateFornecedor(
  id: string,
  input: Partial<FornecedorInput & { is_active: boolean }>,
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.nome        !== undefined) patch.nome        = input.nome.trim();
  if (input.cnpj        !== undefined) patch.cnpj        = input.cnpj?.trim()        || null;
  if (input.telefone    !== undefined) patch.telefone    = input.telefone?.trim()    || null;
  if (input.email       !== undefined) patch.email       = input.email?.trim()       || null;
  if (input.contato     !== undefined) patch.contato     = input.contato?.trim()     || null;
  if (input.observacoes !== undefined) patch.observacoes = input.observacoes?.trim() || null;
  if (input.is_active   !== undefined) patch.is_active   = input.is_active;
  await restPatch("fornecedores", { column: "id", value: id }, patch);
}
