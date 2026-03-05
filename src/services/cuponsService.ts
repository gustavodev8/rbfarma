import { restGet, restPost, restPatch, restDelete } from "./supabaseRest";

export type CupomTipo = "percentual" | "fixo";

export interface Cupom {
  id:           string;
  codigo:       string;
  tipo:         CupomTipo;
  valor:        number;
  valor_minimo: number | null;
  validade:     string | null; // YYYY-MM-DD
  usos_limite:  number | null;
  usos_count:   number;
  ativo:        boolean;
  created_at:   string;
}

export interface CupomInput {
  codigo:       string;
  tipo:         CupomTipo;
  valor:        number;
  valor_minimo?: number | null;
  validade?:    string | null;
  usos_limite?: number | null;
  ativo?:       boolean;
}

export async function fetchCupons(): Promise<Cupom[]> {
  return restGet<Cupom>("cupons", { order: "created_at.desc" });
}

export async function createCupom(input: CupomInput): Promise<Cupom> {
  return restPost<Cupom>("cupons", {
    codigo:       input.codigo.toUpperCase().trim(),
    tipo:         input.tipo,
    valor:        input.valor,
    valor_minimo: input.valor_minimo ?? null,
    validade:     input.validade     ?? null,
    usos_limite:  input.usos_limite  ?? null,
    usos_count:   0,
    ativo:        input.ativo ?? true,
  });
}

export async function toggleCupomAtivo(id: string, ativo: boolean): Promise<void> {
  await restPatch("cupons", { column: "id", value: id }, { ativo });
}

export async function deleteCupom(id: string): Promise<void> {
  await restDelete("cupons", { column: "id", value: id });
}

/** Valida um cupom pelo código e retorna o desconto calculado (em R$). */
export async function validateCupom(
  codigo: string,
  subtotal: number,
): Promise<{ cupom: Cupom; desconto: number } | { error: string }> {
  let rows: Cupom[];
  try {
    rows = await restGet<Cupom>("cupons", {
      codigo: `eq.${codigo.toUpperCase().trim()}`,
      ativo:  "eq.true",
    });
  } catch {
    return { error: "Erro ao verificar cupom." };
  }

  if (rows.length === 0) return { error: "Cupom invalido ou inativo." };
  const cupom = rows[0];

  // Validade
  if (cupom.validade) {
    const expiry = new Date(cupom.validade + "T23:59:59");
    if (new Date() > expiry) return { error: "Cupom expirado." };
  }

  // Limite de usos
  if (cupom.usos_limite !== null && cupom.usos_count >= cupom.usos_limite) {
    return { error: "Limite de usos deste cupom atingido." };
  }

  // Valor minimo
  if (cupom.valor_minimo !== null && subtotal < cupom.valor_minimo) {
    return { error: `Pedido minimo de R$${cupom.valor_minimo.toFixed(2).replace(".", ",")} para usar este cupom.` };
  }

  const desconto =
    cupom.tipo === "percentual"
      ? Math.min(subtotal, subtotal * (cupom.valor / 100))
      : Math.min(subtotal, cupom.valor);

  return { cupom, desconto };
}

/** Incrementa o contador de usos do cupom. Deve ser chamado após o pedido ser salvo. */
export async function incrementCupomUso(id: string, currentCount: number): Promise<void> {
  await restPatch("cupons", { column: "id", value: id }, {
    usos_count: currentCount + 1,
  });
}
