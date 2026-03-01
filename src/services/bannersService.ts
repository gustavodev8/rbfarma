import { supabase } from "./supabaseClient";
import { restGet, restPost, restPatch, restDelete } from "./supabaseRest";

export interface Banner {
  id:            string;
  url:           string;
  fileName:      string;
  displayOrder:  number;
  isActive:      boolean;
  createdAt:     string;
}

const BUCKET = "banners";

// ─── Valida resolução exata 1200×400 ─────────────────────────────────────────
export function validateBannerResolution(file: File): Promise<{ ok: boolean; w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: img.width === 1200 && img.height === 400, w: img.width, h: img.height });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ ok: false, w: 0, h: 0 }); };
    img.src = url;
  });
}

// ─── Listar banners ativos ordenados (público) — REST direto ─────────────────
export async function fetchBanners(): Promise<Banner[]> {
  const rows = await restGet<Record<string, unknown>>("banners", {
    is_active: "eq.true",
    order:     "display_order.asc",
  });
  return rows.map(rowToBanner);
}

// ─── Listar TODOS (admin) — REST direto para evitar travamento do cliente JS ─
export async function fetchAllBanners(): Promise<Banner[]> {
  const rows = await restGet<Record<string, unknown>>("banners", { order: "display_order.asc" });
  return rows.map(rowToBanner);
}

// ─── Upload de imagem + insert na tabela ────────────────────────────────────
export async function uploadBanner(file: File): Promise<Banner> {
  const ext      = file.name.split(".").pop() ?? "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // 1. Upload para o Storage (Storage usa cliente JS — funciona diferente do banco)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  // 2. URL pública
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  // 3. Contar banners existentes para definir a ordem via REST
  const existing = await restGet<Record<string, unknown>>("banners", { select: "id" });
  const nextOrder = existing.length;

  // 4. Insert na tabela via REST direto
  const row = await restPost<Record<string, unknown>>("banners", {
    url:           urlData.publicUrl,
    file_name:     fileName,
    display_order: nextOrder,
    is_active:     true,
  });

  return rowToBanner(row);
}

// ─── Ativar / desativar ───────────────────────────────────────────────────────
export async function toggleBannerActive(id: string, active: boolean): Promise<void> {
  await restPatch("banners", { column: "id", value: id }, { is_active: active });
}

// ─── Deletar (Storage + tabela) ──────────────────────────────────────────────
export async function deleteBanner(id: string, fileName: string): Promise<void> {
  // 1. Remove do Storage
  await supabase.storage.from(BUCKET).remove([fileName]);
  // 2. Remove da tabela via REST
  await restDelete("banners", { column: "id", value: id });
}

// ─── Reordenar ───────────────────────────────────────────────────────────────
export async function reorderBanners(items: { id: string; displayOrder: number }[]): Promise<void> {
  await Promise.all(
    items.map(({ id, displayOrder }) =>
      restPatch("banners", { column: "id", value: id }, { display_order: displayOrder })
    )
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function rowToBanner(row: Record<string, unknown>): Banner {
  return {
    id:           row.id as string,
    url:          row.url as string,
    fileName:     row.file_name as string,
    displayOrder: row.display_order as number,
    isActive:     row.is_active as boolean,
    createdAt:    row.created_at as string,
  };
}
