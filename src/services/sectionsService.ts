import { restGet, restPost, restPatch, restDelete } from "./supabaseRest";

export interface Section {
  id:           string;
  name:         string;
  displayOrder: number;
  isActive:     boolean;
}

interface DbSection {
  id:            string;
  name:          string;
  display_order: number;
  is_active:     boolean;
  created_at:    string;
}

function dbToSection(row: DbSection): Section {
  return {
    id:           row.id,
    name:         row.name,
    displayOrder: row.display_order,
    isActive:     row.is_active,
  };
}

/** Seções ativas ordenadas (homepage) — REST direto para evitar travamento */
export async function fetchActiveSections(): Promise<Section[]> {
  const rows = await restGet<DbSection>("sections", {
    is_active: "eq.true",
    order:     "display_order.asc",
  });
  return rows.map(dbToSection);
}

/** Todas as seções (admin) — usa REST direto para evitar travamento do cliente JS */
export async function fetchAllSections(): Promise<Section[]> {
  const rows = await restGet<DbSection>("sections", { order: "display_order.asc" });
  return rows.map(dbToSection);
}

/** Cria uma nova seção */
export async function createSection(name: string, displayOrder: number): Promise<Section> {
  const row = await restPost<DbSection>("sections", {
    name,
    display_order: displayOrder,
    is_active:     true,
  });
  return dbToSection(row);
}

/** Atualiza nome ou ordem */
export async function updateSection(
  id: string,
  patch: Partial<{ name: string; displayOrder: number; isActive: boolean }>
): Promise<Section> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name         !== undefined) dbPatch.name          = patch.name;
  if (patch.displayOrder !== undefined) dbPatch.display_order = patch.displayOrder;
  if (patch.isActive     !== undefined) dbPatch.is_active     = patch.isActive;

  const row = await restPatch<DbSection>(
    "sections",
    { column: "id", value: id },
    dbPatch,
    true,
  );
  return dbToSection(row as DbSection);
}

/** Ativa / desativa */
export async function toggleSectionActive(id: string, active: boolean): Promise<void> {
  await restPatch("sections", { column: "id", value: id }, { is_active: active });
}

/** Remove seção */
export async function deleteSection(id: string): Promise<void> {
  await restDelete("sections", { column: "id", value: id });
}

/** Salva nova ordem em lote */
export async function reorderSections(
  items: { id: string; displayOrder: number }[]
): Promise<void> {
  await Promise.all(
    items.map(({ id, displayOrder }) =>
      restPatch("sections", { column: "id", value: id }, { display_order: displayOrder })
    )
  );
}
