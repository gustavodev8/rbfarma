import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Home, ChevronRight, Plus, ArrowDown,
  PackageSearch, Tag, Percent,
} from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { useCart } from "@/hooks/useCart";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import {
  fetchProductsByCategory,
  fetchProductsByCategories,
  fetchProductsOnSale,
} from "@/services/productsService";
import { allProducts } from "@/data/products";
import type { Product } from "@/types";

// ─── Configuração de cada "coleção" ──────────────────────────────────────────
type CollectionType = "category" | "multi-category" | "discount";

interface CollectionConfig {
  label:       string;
  description: string;
  icon?:       React.ReactNode;
  type:        CollectionType;
  // category
  category?:    string;
  categories?:  string[];
  // discount
  minDiscount?: number;
}

const COLLECTIONS: Record<string, CollectionConfig> = {
  // ── Abas de navegação ──────────────────────────────────────────────────────
  medicamentos: {
    label:       "Medicamentos",
    description: "Analgésicos, antitérmicos, antibióticos e medicamentos em geral.",
    type:        "category",
    category:    "medicamentos",
  },
  ofertas: {
    label:       "Ofertas",
    description: "Todos os produtos com desconto. Aproveite as melhores promoções da RB Farma!",
    icon:        <Tag className="h-5 w-5 text-primary" />,
    type:        "discount",
    minDiscount: 0,
  },
  descontos: {
    label:       "Descontos",
    description: "Produtos com mais de 25% de desconto. As maiores economias estão aqui!",
    icon:        <Percent className="h-5 w-5 text-green-600" />,
    type:        "discount",
    minDiscount: 25,
  },
  beleza: {
    label:       "Beleza",
    description: "Maquiagem, cabelos, unhas e produtos de beleza em geral.",
    type:        "category",
    category:    "beleza",
  },
  "bem-estar": {
    label:       "Bem-estar",
    description: "Vitaminas, suplementos e produtos para o seu equilíbrio e saúde diária.",
    type:        "multi-category",
    categories:  ["vitaminas", "higiene", "suplementos"],
  },

  // ── Abas de categoria (CategoryHighlight) ─────────────────────────────────
  skincare: {
    label:       "Cuidados com a Pele",
    description: "Hidratantes, séruns, tônicos e tudo para sua rotina de skin care.",
    type:        "category",
    category:    "skincare",
  },
  suplementos: {
    label:       "Suplementos",
    description: "Whey, creatina, BCAA, termogênicos e muito mais para sua performance.",
    type:        "category",
    category:    "suplementos",
  },
  dermocosmeticos: {
    label:       "Dermocosméticos",
    description: "Cosméticos com ação dermatológica para saúde e beleza da sua pele.",
    type:        "category",
    category:    "dermocosmeticos",
  },
  perfumes: {
    label:       "Perfumes",
    description: "Fragrâncias nacionais e importadas para todos os estilos.",
    type:        "category",
    category:    "perfumes",
  },
  manipulados: {
    label:       "Manipulados",
    description: "Fórmulas personalizadas manipuladas com qualidade e precisão.",
    type:        "category",
    category:    "manipulados",
  },
  vitaminas: {
    label:       "Vitaminas",
    description: "Vitaminas e minerais para complementar sua saúde diária.",
    type:        "category",
    category:    "vitaminas",
  },
  higiene: {
    label:       "Higiene Pessoal",
    description: "Shampoos, sabonetes, desodorantes e produtos de higiene.",
    type:        "category",
    category:    "higiene",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Card de produto — grid full-width ───────────────────────────────────────
function ProductGridCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const navigate    = useNavigate();
  const outOfStock  = product.stock !== null && product.stock === 0;

  return (
    <div
      onClick={() => navigate(`/produto/${product.id}`, { state: { product } })}
      className={`bg-background border border-border rounded-2xl p-4 flex flex-col gap-3
        hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group relative
        ${outOfStock ? "opacity-60" : ""}`}
    >
      {/* Badge desconto */}
      {product.discount > 0 && !outOfStock && (
        <div className="absolute top-3 left-3 flex items-center gap-0.5 bg-discount text-discount-foreground text-xs font-bold px-2 py-0.5 rounded-full z-10">
          <ArrowDown className="h-3 w-3" />
          {product.discount}%
        </div>
      )}

      {/* Badge esgotado */}
      {outOfStock && (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
          Esgotado
        </span>
      )}

      {/* Imagem */}
      <div className="w-full aspect-square flex items-center justify-center bg-secondary/40 rounded-xl overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
      </div>

      {/* Infos */}
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.brand} · {product.quantity}</p>
      </div>

      {/* Preço + botão */}
      <div className="flex items-end justify-between mt-auto gap-2">
        <div className="min-w-0">
          {product.discount > 0 && (
            <p className="text-xs text-muted-foreground line-through truncate">{fmt(product.originalPrice)}</p>
          )}
          <p className="text-base font-bold text-foreground">{fmt(product.price)}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (!outOfStock) addItem(product); }}
          disabled={outOfStock}
          title={outOfStock ? "Produto esgotado" : "Adicionar ao carrinho"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            outOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary-hover"
          }`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-secondary/50 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="w-full aspect-square bg-secondary rounded-xl" />
      <div className="h-3 bg-secondary rounded w-3/4" />
      <div className="h-3 bg-secondary rounded w-1/2" />
      <div className="h-5 bg-secondary rounded w-1/3 mt-auto" />
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function CategoryPage() {
  const { slug = "" }  = useParams<{ slug: string }>();
  const navigate        = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [visible,  setVisible]  = useState(false);

  const config = COLLECTIONS[slug];

  // Scroll to top + entrada animada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [slug]);

  // Busca produtos conforme o tipo de coleção
  useEffect(() => {
    if (!config) return;
    setLoading(true);
    setProducts([]);
    setVisible(false);

    async function load() {
      try {
        if (isSupabaseConfigured()) {
          let data: Product[] = [];

          if (config.type === "category" && config.category) {
            data = await fetchProductsByCategory(config.category);
          } else if (config.type === "multi-category" && config.categories) {
            data = await fetchProductsByCategories(config.categories);
          } else if (config.type === "discount") {
            data = await fetchProductsOnSale(config.minDiscount ?? 0);
          }

          setProducts(data);
          setLoading(false);
          setTimeout(() => setVisible(true), 30);
          return;
        }
      } catch { /* fallback */ }

      // ── Fallback local ──────────────────────────────────────────────────────
      let local: Product[] = [];

      if (config.type === "category" && config.category) {
        local = allProducts.filter((p) => p.category === config.category);
      } else if (config.type === "multi-category" && config.categories) {
        local = allProducts.filter((p) => config.categories!.includes(p.category));
      } else if (config.type === "discount") {
        local = allProducts
          .filter((p) => p.discount > (config.minDiscount ?? 0))
          .sort((a, b) => b.discount - a.discount);
      }

      setProducts(local);
      setLoading(false);
      setTimeout(() => setVisible(true), 30);
    }

    load();
  }, [slug, config]);

  // Slug não reconhecido → início
  if (!config) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div
        className={`container mx-auto px-4 py-6 transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" /> Início
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{config.label}</span>
        </nav>

        {/* ── Cabeçalho ───────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            {config.icon}
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              {config.label}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-2">
              {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4 text-center">
            <PackageSearch className="h-16 w-16 text-muted-foreground/40" />
            <div>
              <p className="text-xl font-bold text-foreground mb-1">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {config.type === "discount"
                  ? "Nenhum produto com esse desconto no momento. Volte em breve!"
                  : "Ainda não temos produtos nesta categoria. Em breve teremos novidades!"}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="mt-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold hover:bg-primary-hover transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
