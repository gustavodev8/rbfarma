import { restGet, restPatch } from "./supabaseRest";

export interface EstoqueProduto {
  id: string;
  name: string;
  brand: string;
  stock: number;
  stock_min: number;
  is_active: boolean;
}

export async function fetchEstoque(): Promise<EstoqueProduto[]> {
  const rows = await restGet<{
    id: string; name: string; brand: string;
    stock: number | null; stock_min: number | null; is_active: boolean;
  }>("products", { order: "name.asc" });

  return rows.map(r => ({
    id:       r.id,
    name:     r.name,
    brand:    r.brand,
    stock:    r.stock    ?? 0,
    stock_min: r.stock_min ?? 5,
    is_active: r.is_active,
  }));
}

export async function ajustarEstoque(
  id: string,
  novoStock: number,
  stockMin?: number,
): Promise<void> {
  const patch: Record<string, unknown> = {
    stock:      novoStock,
    updated_at: new Date().toISOString(),
  };
  if (stockMin !== undefined) patch.stock_min = stockMin;
  await restPatch("products", { column: "id", value: id }, patch);
}
