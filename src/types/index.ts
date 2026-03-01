export type ProductCategory =
  | "medicamentos"
  | "vitaminas"
  | "skincare"
  | "higiene"
  | "beleza"
  | "suplementos"
  | "perfumes"
  | "manipulados"
  | "dermocosmeticos";

export interface Product {
  id: string;
  gtin?: string;
  name: string;
  brand: string;
  quantity: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  category: ProductCategory;
  /** Quantidade em estoque. null = sem controle de estoque (sempre disponível) */
  stock: number | null;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

// Cosmos Bluesoft API types
export interface CosmosProduct {
  id: number;
  gtin: string;
  description: string;
  brand: { name: string };
  net_weight: string;
  avg_price: number;
  thumbnail: string;
  image: string;
  category?: { description: string };
}

export interface CosmosSearchResponse {
  products: CosmosProduct[];
  count: number;
}
