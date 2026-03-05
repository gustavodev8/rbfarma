import { restGet, restPost, restPatch } from "./supabaseRest";

export interface Meta {
  id?: string;
  mes: string; // YYYY-MM
  meta_faturamento: number;
  meta_pedidos: number;
}

export async function fetchMeta(mes: string): Promise<Meta | null> {
  try {
    const rows = await restGet<Meta>("metas", { mes: `eq.${mes}` });
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function saveMeta(meta: Meta): Promise<Meta> {
  // Check if a record already exists for this month
  const existing = await fetchMeta(meta.mes);

  if (existing?.id) {
    await restPatch("metas", { column: "id", value: existing.id }, {
      meta_faturamento: meta.meta_faturamento,
      meta_pedidos:     meta.meta_pedidos,
      updated_at:       new Date().toISOString(),
    });
    return { ...existing, meta_faturamento: meta.meta_faturamento, meta_pedidos: meta.meta_pedidos };
  }

  const row = await restPost<Meta>("metas", {
    mes:              meta.mes,
    meta_faturamento: meta.meta_faturamento,
    meta_pedidos:     meta.meta_pedidos,
  });
  return row;
}
