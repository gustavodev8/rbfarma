import {
  Search, User, Package, ShoppingCart, MapPin, Menu, Heart, X,
  BookOpen, Building2, HeartPulse, Store, Smartphone,
  Tag, Percent, Sparkles, Smile, LogOut, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProductSearch } from "@/hooks/useProducts";
import { useCart, cartTotal, cartCount } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import CartDrawer from "@/components/CartDrawer";
import ProductPreviewModal from "@/components/ProductPreviewModal";
import type { Product } from "@/types";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Links estáticos (fora do componente para não recriar a cada render) ──────
const TOP_LINKS = [
  { icon: MapPin,     label: "Insira seu CEP"     },
  { icon: Building2,  label: "Farmácias"          },
  { icon: BookOpen,   label: "Blog"               },
  { icon: HeartPulse, label: "Serviços de saúde"  },
  { icon: Store,      label: "Lojas parceiras"    },
  { icon: Smartphone, label: "Baixe o app"        },
];

const NAV_LINKS = [
  { icon: Menu,     label: "Categorias",   slug: null           },
  { icon: Tag,      label: "Medicamentos", slug: "medicamentos" },
  { icon: Tag,      label: "Ofertas",      slug: "ofertas"      },
  { icon: Percent,  label: "Descontos",    slug: "descontos"    },
  { icon: Sparkles, label: "Beleza",       slug: "beleza"       },
  { icon: Smile,    label: "Bem-estar",    slug: "bem-estar"    },
];

// ─── SearchBar extraído para fora do Header (evita remount a cada render) ─────
interface SearchBarProps {
  query:           string;
  open:            boolean;
  results:         Product[];
  isFetching:      boolean;
  inputRef:        React.RefObject<HTMLInputElement>;
  dropdownRef:     React.RefObject<HTMLDivElement>;
  onChange:        (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear:         () => void;
  onFocusOpen:     () => void;
  onAddToCart:     (p: Product) => void;
  onProductClick:  (p: Product) => void;
  className?:      string;
}

function SearchBar({
  query, open, results, isFetching,
  inputRef, dropdownRef,
  onChange, onClear, onFocusOpen, onAddToCart, onProductClick,
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-gray-100 rounded-full overflow-hidden pr-1">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onChange}
          onFocus={onFocusOpen}
          placeholder="Buscar medicamentos, vitaminas, cosméticos..."
          className="flex-1 bg-transparent pl-5 pr-2 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none"
        />
        {query && (
          <button onClick={onClear} className="text-gray-400 hover:text-gray-600 mr-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
        <button className="bg-[#e8001c] hover:bg-[#c4001a] text-white rounded-full p-2 transition-colors shrink-0">
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-[420px] overflow-y-auto"
        >
          {isFetching ? (
            <div className="p-4 text-sm text-gray-400 text-center">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              Nenhum produto encontrado para &quot;{query}&quot;
            </div>
          ) : (
            <ul>
              {results.map((product) => {
                const esgotado = product.stock !== null && product.stock === 0;
                return (
                  <li
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-12 h-12 object-contain rounded-lg bg-gray-100 flex-shrink-0 ${esgotado ? "opacity-50" : ""}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.brand} · {product.quantity}</p>
                      {esgotado && (
                        <p className="text-[10px] font-semibold text-red-500 mt-0.5">Esgotado</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{fmt(product.price)}</p>
                      {product.discount > 0 && (
                        <p className="text-xs text-green-600 font-medium">-{product.discount}%</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!esgotado) onAddToCart(product); }}
                      disabled={esgotado}
                      title={esgotado ? "Produto esgotado" : "Adicionar ao carrinho"}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 text-lg font-bold leading-none ${
                        esgotado
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#e8001c] text-white hover:bg-[#c4001a]"
                      }`}
                    >+</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── UserMenu (desktop) ────────────────────────────────────────────────────────
function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/entrar")}
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#e8001c] transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="text-[11px] font-medium">Entrar</span>
        </button>
        <button
          onClick={() => navigate("/entrar", { state: { tab: "register" } })}
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#e8001c] transition-colors"
        >
          <Package className="h-5 w-5" />
          <span className="text-[11px] font-medium">Cadastrar</span>
        </button>
      </div>
    );
  }

  const firstName = profile?.name?.split(" ")[0] || "Conta";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col items-center gap-0.5 text-[#e8001c] hover:text-[#c4001a] transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-[#e8001c] text-white flex items-center justify-center text-xs font-bold">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <span className="text-[11px] font-medium flex items-center gap-0.5">
          {firstName.slice(0, 8)}{firstName.length > 8 ? "…" : ""}
          <ChevronDown className="h-2.5 w-2.5" />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800 truncate">{profile?.name || "Usuário"}</p>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
          <Link
            to="/minha-conta"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#e8001c] transition-colors"
          >
            <User className="h-4 w-4" /> Minha conta
          </Link>
          <Link
            to="/minha-conta"
            onClick={() => { setOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#e8001c] transition-colors"
          >
            <Package className="h-4 w-4" /> Meus pedidos
          </Link>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={async () => { setOpen(false); await signOut(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Header principal ─────────────────────────────────────────────────────────
const Header = () => {
  const [query,          setQuery]         = useState("");
  const [open,           setOpen]          = useState(false);
  const [drawerOpen,     setDrawerOpen]    = useState(false);
  const [cartOpen,       setCartOpen]      = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  const { data: results = [], isFetching } = useProductSearch(query);
  const { items, addItem } = useCart();
  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const total = cartTotal(items);
  const count = cartCount(items);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Bloqueia scroll quando qualquer drawer está aberto
  useEffect(() => {
    document.body.style.overflow = (drawerOpen || cartOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen, cartOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleFocusOpen = () => {
    if (query.length >= 2) setOpen(true);
  };

  const handleProductClick = (product: Product) => {
    setOpen(false);
    setPreviewProduct(product);
  };

  // Props compartilhadas do SearchBar
  const searchBarProps: SearchBarProps = {
    query, open, results, isFetching,
    inputRef, dropdownRef,
    onChange:        handleChange,
    onClear:         handleClear,
    onFocusOpen:     handleFocusOpen,
    onAddToCart:     addItem,
    onProductClick:  handleProductClick,
  };

  return (
    <>
      <header className="w-full bg-white sticky top-0 z-40 shadow-sm">

        {/* ── Barra superior — apenas desktop ──────────────────────────────── */}
        <div className="hidden md:block border-b border-gray-200">
          <div className="container mx-auto flex items-center justify-between px-4 py-1.5">
            <div className="flex items-center gap-5">
              {TOP_LINKS.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex items-center gap-1 text-[11.5px] text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5" /><span>{label}</span>
                </button>
              ))}
            </div>
            <Link to="/categoria/descontos" className="bg-[#e8001c] hover:bg-[#c4001a] text-white text-[11.5px] font-semibold px-4 py-1 rounded-full transition-colors whitespace-nowrap">
              Exibir descontos
            </Link>
          </div>
        </div>

        {/* ── Header mobile ─────────────────────────────────────────────────── */}
        <div className="md:hidden border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-gray-700 hover:text-[#e8001c] transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center gap-1.5">
              <Heart className="h-6 w-6 text-[#e8001c]" fill="#e8001c" />
              <span className="text-[20px] font-extrabold text-[#e8001c] tracking-tight leading-none">
                RB{" "}
                <span className="bg-[#FFD600] text-[#e8001c] px-1.5 py-0.5 rounded-lg">FARMA</span>
              </span>
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#e8001c] transition-colors relative"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2.5 min-w-[16px] h-4 bg-[#e8001c] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {count > 99 ? "99+" : count}
                </span>
              </div>
              <span className="text-[10px] font-medium">{fmt(total)}</span>
            </button>
          </div>

          {/* Busca mobile */}
          <div className="px-4 pb-3">
            <SearchBar {...searchBarProps} />
          </div>
        </div>

        {/* ── Header desktop ────────────────────────────────────────────────── */}
        <div className="hidden md:block border-b border-gray-100">
          <div className="container mx-auto flex items-center gap-6 px-4 py-3">
            <Link to="/" className="flex items-center gap-1.5 shrink-0">
              <Heart className="h-7 w-7 text-[#e8001c]" fill="#e8001c" />
              <span className="text-[22px] font-extrabold text-[#e8001c] tracking-tight leading-none">
                RB{" "}
                <span className="bg-[#FFD600] text-[#e8001c] px-2 py-0.5 rounded-lg">FARMA</span>
              </span>
            </Link>

            <div className="flex-1">
              <SearchBar {...searchBarProps} />
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <UserMenu />
              <button
                onClick={() => setCartOpen(true)}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#e8001c] transition-colors relative"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2.5 min-w-[16px] h-4 bg-[#e8001c] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {count > 99 ? "99+" : count}
                  </span>
                </div>
                <span className="text-[11px] font-medium">{fmt(total)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Nav desktop ───────────────────────────────────────────────────── */}
        <div className="hidden md:block border-b border-gray-100">
          <div className="container mx-auto flex items-center gap-6 px-4 py-2 overflow-x-auto scrollbar-hide">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-[#e8001c] transition-colors shrink-0">
              <Menu className="h-4 w-4" /><span>Categorias</span>
            </button>
            <div className="h-4 w-px bg-gray-200 shrink-0" />
            <nav className="flex items-center gap-6">
              {NAV_LINKS.filter((l) => l.slug).map(({ label, slug }) => (
                <Link
                  key={slug}
                  to={`/categoria/${slug}`}
                  className="text-sm text-gray-600 hover:text-[#e8001c] transition-colors whitespace-nowrap font-medium"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Drawer mobile ───────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        {/* Painel */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl
            transition-transform duration-300 ease-in-out will-change-transform ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-1.5">
              <Heart className="h-6 w-6 text-[#e8001c]" fill="#e8001c" />
              <span className="text-[18px] font-extrabold text-[#e8001c] tracking-tight">
                RB{" "}
                <span className="bg-[#FFD600] text-[#e8001c] px-1.5 py-0.5 rounded-lg">FARMA</span>
              </span>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-col py-2">
            {NAV_LINKS.map(({ icon: Icon, label, slug }) =>
              slug ? (
                <Link
                  key={slug}
                  to={`/categoria/${slug}`}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#e8001c] transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{label}</span>
                </Link>
              ) : (
                <button
                  key={label}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#e8001c] transition-colors text-left"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{label}</span>
                </button>
              )
            )}
          </nav>

          <div className="h-px bg-gray-100 mx-4 my-1" />

          <nav className="flex flex-col py-2">
            {TOP_LINKS.map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm text-[#e8001c] hover:bg-red-50 transition-colors text-left"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto px-5 py-5">
            <Link
              to="/categoria/descontos"
              onClick={() => setDrawerOpen(false)}
              className="block w-full bg-[#e8001c] hover:bg-[#c4001a] text-white text-sm font-semibold py-2.5 rounded-full transition-colors text-center"
            >
              Exibir descontos
            </Link>
          </div>
        </div>
      </div>
      {/* ── Carrinho ────────────────────────────────────────────────────────── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Preview de produto (busca) ───────────────────────────────────────── */}
      <ProductPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
      />

    </>
  );
};

export default Header;
