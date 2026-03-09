import { restGet, restPost, restDelete } from "./supabaseRest";

export type TipoTransacao = "entrada" | "saida";

/* ── Tipos ──────────────────────────────────────────────────────────── */
export interface TransacaoInput {
  tipo:             TipoTransacao;
  categoria:        string;
  descricao:        string;
  valor:            number;
  data:             string; // YYYY-MM-DD
  forma_pagamento?: string;
  observacao?:      string;
}

export interface Transacao extends TransacaoInput {
  id:         string;
  created_at: string;
}

/** Entrada unificada do fluxo de caixa */
export interface EntradaFluxo {
  id:              string;
  tipo:            TipoTransacao;
  categoria:       string;
  descricao:       string;
  valor:           number;
  data:            string;       // YYYY-MM-DD
  forma_pagamento: string | null;
  observacao:      string | null;
  /** "order" = venda (PDV ou online); "manual" = lançamento avulso */
  source:          "order" | "manual";
  created_at:      string;
}

/** Categorias criadas automaticamente pelo sistema ao concluir pedidos */
const CATEGORIAS_VENDA = new Set(["Venda PDV", "Venda Online"]);

/* ── Categorias ─────────────────────────────────────────────────────── */
export const CATEGORIAS_ENTRADA = [
  "Suprimento", "Transferência recebida", "Outros",
];

export const CATEGORIAS_SAIDA = [
  "Sangria", "Fornecedor", "Aluguel", "Salários", "Água/Luz",
  "Internet", "Manutenção", "Impostos", "Material de escritório", "Outros",
];

export const FORMAS_PAGAMENTO = [
  "Dinheiro", "Pix", "Cartão de crédito", "Cartão de débito", "Boleto", "Transferência",
];

/* ── Helpers de mês ─────────────────────────────────────────────────── */
function mesRange(mes: string): { inicio: string; fim: string } {
  const [y, m] = mes.split("-").map(Number);
  const inicio = `${mes}-01`;
  const fim    = new Date(y, m, 0).toISOString().slice(0, 10);
  return { inicio, fim };
}

/* ── fetchFluxoCombinado ────────────────────────────────────────────── */
/**
 * Busca todas as transações de `fluxo_caixa` do mês.
 * Vendas (PDV e Online) já são inseridas automaticamente em `fluxo_caixa`
 * quando o pedido é marcado como "entregue" — não há duplicação com orders.
 */
export async function fetchFluxoCombinado(mes: string): Promise<EntradaFluxo[]> {
  try {
    const { inicio, fim } = mesRange(mes);
    const rows = await restGet<Transacao>("fluxo_caixa", {
      select: "*",
      and:    `(data.gte.${inicio},data.lte.${fim})`,
      order:  "data.desc,created_at.desc",
    });

    return rows.map(t => ({
      id:              t.id,
      tipo:            t.tipo,
      categoria:       t.categoria,
      descricao:       t.descricao,
      valor:           Number(t.valor),
      data:            t.data,
      forma_pagamento: t.forma_pagamento ?? null,
      observacao:      t.observacao ?? null,
      // vendas geradas pelo sistema → source "order"; demais → "manual"
      source:          CATEGORIAS_VENDA.has(t.categoria) ? "order" : "manual",
      created_at:      t.created_at,
    }));
  } catch {
    return [];
  }
}

/* ── createTransacao ────────────────────────────────────────────────── */
export async function createTransacao(
  input: TransacaoInput,
): Promise<{ transacao: Transacao | null; error?: string }> {
  try {
    const row = await restPost<Transacao>("fluxo_caixa", {
      tipo:            input.tipo,
      categoria:       input.categoria,
      descricao:       input.descricao,
      valor:           input.valor,
      data:            input.data,
      forma_pagamento: input.forma_pagamento ?? null,
      observacao:      input.observacao ?? null,
    });
    return { transacao: row };
  } catch (err) {
    return { transacao: null, error: err instanceof Error ? err.message : "Erro ao criar transação" };
  }
}

/* ── deleteTransacao ────────────────────────────────────────────────── */
export async function deleteTransacao(id: string): Promise<void> {
  await restDelete("fluxo_caixa", { column: "id", value: id });
}
