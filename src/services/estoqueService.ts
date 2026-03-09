import { restGet, restPatch } from "./supabaseRest";
import { isSupabaseConfigured } from "./supabaseClient";

export interface EstoqueProduto {
  id:            string;
  name:          string;
  brand:         string;
  stock:         number;
  stock_min:     number;
  is_active:     boolean;
  lote:          string | null;
  validade:      string | null;   // "YYYY-MM-DD"
  fornecedor_id: string | null;
}

export async function fetchEstoque(): Promise<EstoqueProduto[]> {
  const rows = await restGet<{
    id: string; name: string; brand: string;
    stock: number | null; stock_min: number | null; is_active: boolean;
    lote: string | null; validade: string | null; fornecedor_id: string | null;
  }>("products", { order: "name.asc" });

  return rows.map(r => ({
    id:            r.id,
    name:          r.name,
    brand:         r.brand,
    stock:         r.stock         ?? 0,
    stock_min:     r.stock_min     ?? 5,
    is_active:     r.is_active,
    lote:          r.lote          ?? null,
    validade:      r.validade      ?? null,
    fornecedor_id: r.fornecedor_id ?? null,
  }));
}

/** Restaura o estoque de múltiplos produtos quando um pedido é cancelado. */
export async function restaurarEstoque(
  items: { product_id: string; quantity: number }[],
): Promise<void> {
  if (!isSupabaseConfigured() || items.length === 0) return;

  const ids      = items.map(i => i.product_id);
  const products = await restGet<{ id: string; stock: number | null }>("products", {
    select: "id,stock",
    id:     `in.(${ids.join(",")})`,
  });

  const stockMap: Record<string, number> = {};
  products.forEach(p => { stockMap[p.id] = p.stock ?? 0; });

  await Promise.all(
    items.map(item =>
      restPatch("products", { column: "id", value: item.product_id }, {
        stock:      (stockMap[item.product_id] ?? 0) + item.quantity,
        updated_at: new Date().toISOString(),
      }),
    ),
  );
}

/** Desconta o estoque de múltiplos produtos após criação de um pedido. */
export async function decrementarEstoque(
  items: { product_id: string; quantity: number }[],
): Promise<void> {
  if (!isSupabaseConfigured() || items.length === 0) return;

  const ids      = items.map(i => i.product_id);
  const products = await restGet<{ id: string; stock: number | null }>("products", {
    select: "id,stock",
    id:     `in.(${ids.join(",")})`,
  });

  const stockMap: Record<string, number> = {};
  products.forEach(p => { stockMap[p.id] = p.stock ?? 0; });

  await Promise.all(
    items.map(item =>
      restPatch("products", { column: "id", value: item.product_id }, {
        stock:      Math.max(0, (stockMap[item.product_id] ?? 0) - item.quantity),
        updated_at: new Date().toISOString(),
      }),
    ),
  );
}

export async function ajustarEstoque(
  id: string,
  novoStock: number,
  opts?: {
    stockMin?:      number;
    lote?:          string;
    validade?:      string | null;
    fornecedor_id?: string | null;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {
    stock:      novoStock,
    updated_at: new Date().toISOString(),
  };
  if (opts?.stockMin      !== undefined) patch.stock_min     = opts.stockMin;
  if (opts?.lote          !== undefined) patch.lote          = opts.lote || null;
  if (opts?.validade      !== undefined) patch.validade      = opts.validade || null;
  if (opts?.fornecedor_id !== undefined) patch.fornecedor_id = opts.fornecedor_id || null;
  await restPatch("products", { column: "id", value: id }, patch);
}

/** Retorna produtos com validade nos próximos `dias` dias (ou já vencidos) */
export function produtosVencendoEm(
  produtos: EstoqueProduto[],
  dias: number,
): EstoqueProduto[] {
  const hoje  = new Date(); hoje.setHours(0, 0, 0, 0);
  const limit = new Date(); limit.setDate(limit.getDate() + dias); limit.setHours(23, 59, 59, 999);
  return produtos.filter(p => {
    if (!p.validade || p.stock <= 0) return false;
    const v = new Date(p.validade + "T00:00:00");
    return v <= limit;
  });
}
