// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DA LOJA — WHITE LABEL
// ─────────────────────────────────────────────────────────────────────────────
//
// NUNCA edite estes valores diretamente.
// Configure tudo pelo arquivo .env na raiz do projeto.
// Cada cliente terá seu próprio .env com seus dados.
//
// Variáveis disponíveis:
//   VITE_STORE_NAME        Nome da loja (ex: "Farmácia Central")
//   VITE_STORE_SLOGAN      Slogan no rodapé do recibo (ex: "Saúde e bem-estar")
//   VITE_STORE_SLUG        Identificador curto sem espaços (ex: "farmacentral")
//   VITE_STORE_CNPJ        CNPJ formatado (ex: "00.000.000/0001-00")
//   VITE_STORE_LEGAL       Razão social completa
//   VITE_STORE_CITY        Cidade em caixa alta para PIX (ex: "SAO PAULO")
// ─────────────────────────────────────────────────────────────────────────────

export const STORE_NAME  = import.meta.env.VITE_STORE_NAME   ?? "Minha Loja";
export const STORE_SLOGAN= import.meta.env.VITE_STORE_SLOGAN ?? "Qualidade e bem-estar";
export const STORE_SLUG  = import.meta.env.VITE_STORE_SLUG   ?? "loja";
export const STORE_CNPJ  = import.meta.env.VITE_STORE_CNPJ   ?? "";
export const STORE_LEGAL = import.meta.env.VITE_STORE_LEGAL  ?? STORE_NAME;
export const STORE_CITY  = import.meta.env.VITE_STORE_CITY   ?? "SAO PAULO";

/** Chave do carrinho no localStorage — única por slug do cliente */
export const CART_STORAGE_KEY = `${STORE_SLUG}-cart`;
