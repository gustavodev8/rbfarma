import { useQuery } from "@tanstack/react-query";
import { fetchActiveSections } from "@/services/sectionsService";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import type { Section } from "@/services/sectionsService";

// Seções padrão caso Supabase não esteja configurado
const DEFAULT_SECTIONS: Section[] = [
  { id: "1", name: "Mais comprados",                  displayOrder: 0, isActive: true },
  { id: "2", name: "Ofertas imperdiveis do mes",       displayOrder: 1, isActive: true },
  { id: "3", name: "Mais Vistos",                     displayOrder: 2, isActive: true },
  { id: "4", name: "Tendencias de skincare asiatico", displayOrder: 3, isActive: true },
];

/**
 * Retorna as seções ativas ordenadas para a homepage.
 * Fallback para as seções padrão se Supabase não configurado.
 */
export function useActiveSections(): Section[] {
  const { data = DEFAULT_SECTIONS } = useQuery({
    queryKey: ["sections-active", isSupabaseConfigured()],
    queryFn: async (): Promise<Section[]> => {
      if (!isSupabaseConfigured()) return DEFAULT_SECTIONS;
      try {
        const sections = await fetchActiveSections();
        return sections.length > 0 ? sections : DEFAULT_SECTIONS;
      } catch {
        return DEFAULT_SECTIONS;
      }
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: DEFAULT_SECTIONS,
  });

  return data;
}
