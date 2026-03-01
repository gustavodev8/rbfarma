import { Plus, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Retorna badge de estoque: null = sem controle, 0 = esgotado, 1-5 = últimas, >5 = ok */
function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) return null; // sem controle → não exibe nada
  if (stock === 0)
    return (
      <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
        Esgotado
      </span>
    );
  if (stock <= 5)
    return (
      <span className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
        Últimas {stock}
      </span>
    );
  return null;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem }  = useCart();
  const navigate     = useNavigate();
  const { name, quantity, originalPrice, price, discount, image, stock } = product;

  const outOfStock = stock !== null && stock === 0;

  function handleCardClick() {
    navigate(`/produto/${product.id}`, { state: { product } });
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
  }

  return (
    <div
      onClick={handleCardClick}
      className={`min-w-[180px] max-w-[200px] bg-background border border-border rounded-card p-3 flex flex-col gap-2 hover:shadow-md transition-shadow relative group cursor-pointer ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      {/* Badge de desconto */}
      {discount > 0 && !outOfStock && (
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-discount text-discount-foreground text-xs font-bold px-2 py-0.5 rounded-full z-10">
          <ArrowDown className="h-3 w-3" />
          {discount}%
        </div>
      )}

      {/* Badge de estoque */}
      <StockBadge stock={stock ?? null} />

      {/* Imagem do produto */}
      <img
        src={image}
        alt={name}
        className="w-full h-32 object-contain mx-auto rounded-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/placeholder.svg";
        }}
      />

      {/* Nome e quantidade */}
      <p className="text-xs text-foreground font-medium leading-tight line-clamp-2">{name}</p>
      <p className="text-xs text-muted-foreground">{quantity}</p>

      {/* Preço e botão adicionar */}
      <div className="flex items-end justify-between mt-auto">
        <div>
          <p className="text-xs text-muted-foreground line-through">{fmt(originalPrice)}</p>
          <p className="text-sm font-bold text-foreground">{fmt(price)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          title={outOfStock ? "Produto esgotado" : "Adicionar ao carrinho"}
          disabled={outOfStock}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
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
};

export default ProductCard;
