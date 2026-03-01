import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, ChevronRight, Star, Truck, Shield, RotateCcw, Home } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ProductCarousel from "@/components/ProductCarousel";
import { useCart } from "@/hooks/useCart";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import { fetchProductById } from "@/services/productsService";
import { allProducts } from "@/data/products";
import type { Product } from "@/types";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductPage() {
  const { id }       = useParams<{ id: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { addItem }  = useCart();

  const [product,  setProduct]  = useState<Product | null>(
    (location.state as { product?: Product })?.product ?? null
  );
  const [qty,      setQty]      = useState(1);
  const [added,    setAdded]    = useState(false);
  const [loading,  setLoading]  = useState(!product);
  const [visible,  setVisible]  = useState(false);

  // Sobe para o topo e dispara animação ao abrir
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [id]);

  // Busca produto se não veio via state
  useEffect(() => {
    if (product || !id) return;
    setLoading(true);

    async function load() {
      // 1. Tenta Supabase
      if (isSupabaseConfigured()) {
        const p = await fetchProductById(id!);
        if (p) { setProduct(p); setLoading(false); return; }
      }
      // 2. Fallback local
      const local = allProducts.find((p) => p.id === id);
      if (local) { setProduct(local); setLoading(false); return; }

      // Não encontrou
      setLoading(false);
    }

    load();
  }, [id, product]);

  function handleAdd() {
    if (!product) return;
    if (product.stock !== null && product.stock === 0) return;
    for (let i = 0; i < qty; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-20 text-center text-gray-400">
          Carregando produto...
        </div>
        <SiteFooter />
      </div>
    );
  }

  // ── Não encontrado ───────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-20 text-center">
          <p className="text-2xl font-bold text-gray-700 mb-2">Produto não encontrado</p>
          <p className="text-gray-400 mb-6">O produto que você procura não está disponível.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#e8001c] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#c4001a] transition-colors"
          >
            Voltar ao início
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const CATEGORY_LABELS: Record<string, string> = {
    medicamentos: "Medicamentos e Saúde",
    vitaminas:    "Vitaminas",
    skincare:     "Skincare",
    higiene:      "Higiene",
    beleza:       "Beleza",
    suplementos:  "Suplementos",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div
        className={`container mx-auto px-4 py-4 transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >

        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="flex items-center gap-1 hover:text-[#e8001c] transition-colors">
            <Home className="h-3.5 w-3.5" /> Início
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-[#e8001c] cursor-pointer transition-colors capitalize">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-600 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* ── Layout principal ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">

          {/* ── Imagem ─────────────────────────────────────────────────────── */}
          <div className="lg:w-[420px] shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center min-h-[340px]">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-72 max-w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
          </div>

          {/* ── Informações do produto ──────────────────────────────────────── */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">

            {/* Marca */}
            <span className="text-sm font-semibold text-[#e8001c] uppercase tracking-wide">
              {product.brand}
            </span>

            {/* Nome */}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800 leading-snug">
              {product.name}
            </h1>

            {/* Avaliação simulada */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="h-4 w-4 text-yellow-400" fill={s <= 4 ? "#facc15" : "none"} />
                ))}
              </div>
              <span className="text-xs text-gray-400">4 avaliações</span>
            </div>

            {/* Código */}
            <p className="text-xs text-gray-400">
              Vendido por <span className="text-[#e8001c] font-semibold">RB FARMA</span>
              &nbsp;·&nbsp; Qtd: {product.quantity}
            </p>

            {/* Divisor */}
            <div className="h-px bg-gray-100" />

            {/* Preço */}
            <div>
              {product.discount > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400 line-through">{fmt(product.originalPrice)}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {product.discount}% OFF
                  </span>
                </div>
              )}
              <p className="text-3xl font-extrabold text-gray-800">{fmt(product.price)}</p>
              <p className="text-xs text-gray-400 mt-1">à vista no PIX</p>
            </div>

            {/* Divisor */}
            <div className="h-px bg-gray-100" />

            {/* Status de estoque */}
            {product.stock !== null && (
              <div className="flex items-center gap-2">
                {product.stock === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    Produto esgotado
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Últimas {product.stock} unidade{product.stock !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Em estoque ({product.stock} unidades)
                  </span>
                )}
              </div>
            )}

            {/* Quantidade + Botão */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Seletor de quantidade — bloqueado se esgotado */}
              <div className={`flex items-center border border-gray-200 rounded-full overflow-hidden ${product.stock === 0 ? "opacity-40 pointer-events-none" : ""}`}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-800">{qty}</span>
                <button
                  onClick={() => setQty((q) => product.stock !== null ? Math.min(q + 1, product.stock) : q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Botão adicionar */}
              <button
                onClick={handleAdd}
                disabled={product.stock !== null && product.stock === 0}
                className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-full font-bold text-white text-base transition-all ${
                  product.stock !== null && product.stock === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : added
                      ? "bg-green-500"
                      : "bg-[#e8001c] hover:bg-[#c4001a]"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock !== null && product.stock === 0
                  ? "Produto esgotado"
                  : added
                    ? "Adicionado!"
                    : "Adicionar ao carrinho"}
              </button>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { icon: <Truck className="h-4 w-4" />,      text: "Entrega rápida"   },
                { icon: <Shield className="h-4 w-4" />,     text: "Produto original" },
                { icon: <RotateCcw className="h-4 w-4" />,  text: "Troca garantida"  },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-3 text-center">
                  <span className="text-[#e8001c]">{icon}</span>
                  <span className="text-[10px] text-gray-500 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Descrição ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Descrição</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              <strong>{product.name}</strong> é um produto da marca{" "}
              <span className="text-[#e8001c] font-semibold">{product.brand}</span>.
            </p>
            <p>
              Apresentação: <strong>{product.quantity}</strong>.
            </p>
            <p>
              Categoria: <strong className="capitalize">{CATEGORY_LABELS[product.category] ?? product.category}</strong>.
            </p>
            <p className="text-gray-400 text-xs mt-4">
              * Consulte sempre um médico ou farmacêutico antes de usar qualquer medicamento.
              Leia atentamente a bula e as informações do produto.
            </p>
          </div>
        </div>

        {/* ── Você pode gostar ──────────────────────────────────────────────── */}
        <ProductCarousel title="Mais comprados" />

      </div>

      <SiteFooter />
    </div>
  );
}
