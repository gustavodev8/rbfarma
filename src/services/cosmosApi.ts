import type { Product, ProductCategory } from "@/types";

// ─── Open Food Facts API ──────────────────────────────────────────────────────
// Gratuita, sem token, CORS liberado, contém fotos de medicamentos brasileiros.
// Documentação: https://wiki.openfoodfacts.org/API
const BASE = "https://br.openfoodfacts.org/cgi/search.pl";

const FIELDS = "product_name,brands,image_url,quantity,categories_tags";

export interface OFFProduct {
  product_name: string;
  brands: string;
  image_url: string;
  quantity: string;
  categories_tags: string[];
}

export interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
  page: number;
}

/** Busca produtos na Open Food Facts com foto e dados reais */
export async function searchProducts(query: string, pageSize = 12): Promise<OFFSearchResponse> {
  const params = new URLSearchParams({
    search_terms:  query,
    search_simple: "1",
    action:        "process",
    json:          "1",
    fields:        FIELDS,
    page_size:     String(pageSize),
    lc:            "pt",
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);
  return res.json();
}

const DISCOUNTS = [10, 15, 20, 22, 24, 25, 28, 30, 32, 35];

/** Preços simulados por categoria (sem fonte oficial de preços) */
const BASE_PRICES: Record<string, number> = {
  medicamentos: 18,
  vitaminas:    35,
  skincare:     70,
  higiene:      25,
  beleza:       55,
  suplementos:  45,
};

function detectCategory(tags: string[]): ProductCategory {
  const str = tags.join(" ").toLowerCase();
  if (str.includes("medicament") || str.includes("drug") || str.includes("medicine")) return "medicamentos";
  if (str.includes("vitamin") || str.includes("vitamina"))                              return "vitaminas";
  if (str.includes("cosmetic") || str.includes("skin") || str.includes("serum"))       return "skincare";
  if (str.includes("higiene") || str.includes("hygiene"))                              return "higiene";
  if (str.includes("beauty") || str.includes("makeup"))                                return "beleza";
  if (str.includes("supplement") || str.includes("suplemento"))                        return "suplementos";
  return "medicamentos";
}

/** Converte resposta da Open Food Facts para o tipo Product do projeto */
export function offToProduct(p: OFFProduct, index: number): Product | null {
  const name = (p.product_name || "").trim();
  if (!name) return null;

  const category  = detectCategory(p.categories_tags ?? []);
  const basePrice = BASE_PRICES[category] ?? 20;
  const discount  = DISCOUNTS[index % DISCOUNTS.length];
  const price     = parseFloat((basePrice * (1 - discount / 100)).toFixed(2));

  return {
    id:            `off-${index}-${name.slice(0, 8).replace(/\s/g, "")}`,
    name,
    brand:         p.brands || "—",
    quantity:      p.quantity || "1 un",
    price,
    originalPrice: basePrice,
    discount,
    image:         p.image_url || "",
    category,
  };
}

/** Token da Cosmos — mantido para compatibilidade, mas não é mais usado */
export const isConfigured = () => true; // Open Food Facts não precisa de token
