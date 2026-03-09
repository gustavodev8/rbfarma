import { restGet, restPost, restPatch } from "./supabaseRest";

export interface CaixaFechamento {
  id:             string;
  data:           string;          // "YYYY-MM-DD"
  saldo_inicial:  number;
  total_dinheiro: number;
  total_pix:      number;
  total_cartao:   number;
  total_saidas:   number;
  saldo_final:    number;
  observacoes:    string | null;
  status:         "aberto" | "fechado";
  created_at:     string;
}

export interface CaixaResumo {
  total_dinheiro: number;
  total_pix:      number;
  total_cartao:   number;
  total_saidas:   number;
}

// ── Busca histórico de fechamentos ────────────────────────────────────────────
export async function fetchFechamentos(limit = 30): Promise<CaixaFechamento[]> {
  return restGet<CaixaFechamento>("caixa_fechamentos", {
    order: "data.desc",
    limit: String(limit),
  });
}

// ── Busca caixas de dias anteriores que ficaram com status "aberto" ───────────
export async function fetchCaixasPendentes(): Promise<CaixaFechamento[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  return restGet<CaixaFechamento>("caixa_fechamentos", {
    and:   `(status.eq.aberto,data.lt.${hoje})`,
    order: "data.desc",
  });
}

// ── Busca ou cria o caixa do dia atual ────────────────────────────────────────
export async function fetchOuCriarCaixaHoje(): Promise<CaixaFechamento> {
  const hoje = new Date().toISOString().slice(0, 10);

  // Tenta buscar o registro de hoje usando padrão `and:` do sistema
  const rows = await restGet<CaixaFechamento>("caixa_fechamentos", {
    and:   `(data.eq.${hoje})`,
    limit: "1",
  });
  if (rows.length > 0) return rows[0];

  // Não existe — cria e retorna direto (restPost já retorna o registro criado)
  return await restPost<CaixaFechamento>("caixa_fechamentos", {
    data:           hoje,
    saldo_inicial:  0,
    total_dinheiro: 0,
    total_pix:      0,
    total_cartao:   0,
    total_saidas:   0,
    saldo_final:    0,
    status:         "aberto",
  });
}

// ── Calcula totais do dia a partir dos pedidos entregues ─────────────────────
export async function calcularResumoHoje(): Promise<CaixaResumo> {
  const hoje      = new Date().toISOString().slice(0, 10);
  const amanha    = new Date(); amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().slice(0, 10);

  // Pedidos entregues hoje — usa padrão `and:` igual ao resto do sistema
  const pedidos = await restGet<{ payment_method: string; total: number }>("orders", {
    select: "payment_method,total",
    and:    `(status.eq.delivered,updated_at.gte.${hoje}T00:00:00.000Z,updated_at.lt.${amanhaStr}T00:00:00.000Z)`,
  });

  let total_dinheiro = 0;
  let total_pix      = 0;
  let total_cartao   = 0;

  pedidos.forEach(p => {
    const v = Number(p.total) || 0;
    if (p.payment_method === "dinheiro") total_dinheiro += v;
    else if (p.payment_method === "pix") total_pix      += v;
    else                                 total_cartao   += v;
  });

  // Saídas manuais registradas hoje no fluxo de caixa
  let total_saidas = 0;
  try {
    const saidas = await restGet<{ valor: number }>("fluxo_caixa", {
      select: "valor",
      and:    `(tipo.eq.saida,data.eq.${hoje})`,
    });
    total_saidas = saidas.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  } catch { /* sem registros manuais — ok */ }

  return { total_dinheiro, total_pix, total_cartao, total_saidas };
}

// ── Salva/atualiza caixa por ID ───────────────────────────────────────────────
export async function salvarCaixa(
  id: string,
  patch: {
    saldo_inicial?:  number;
    total_dinheiro?: number;
    total_pix?:      number;
    total_cartao?:   number;
    total_saidas?:   number;
    saldo_final?:    number;
    observacoes?:    string | null;
    status?:         "aberto" | "fechado";
  },
): Promise<void> {
  await restPatch("caixa_fechamentos", { column: "id", value: id }, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
}
