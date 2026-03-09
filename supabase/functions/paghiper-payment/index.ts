// ============================================================
// Edge Function: paghiper-payment (white-label)
// Cole este código no painel Supabase > Edge Functions
// Nome da função: paghiper-payment
//
// Variáveis de ambiente necessárias (Supabase > Settings > Secrets):
//   PAGHIPER_KEY        → Chave da API PagHiper do cliente
//   PAGHIPER_TOKEN      → Token PagHiper do cliente
//   NOTIFICATION_URL    → URL do webhook (ex: https://cliente.com.br/webhook/paghiper)
//   STORE_NAME          → Nome da loja (ex: Farmácia Central)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Credenciais lidas dos Secrets do Supabase — nunca hardcode aqui
const PAGHIPER_KEY     = Deno.env.get("PAGHIPER_KEY")     ?? "";
const PAGHIPER_TOKEN   = Deno.env.get("PAGHIPER_TOKEN")   ?? "";
const NOTIFICATION_URL = Deno.env.get("NOTIFICATION_URL") ?? "";
const STORE_NAME       = Deno.env.get("STORE_NAME")       ?? "Pedido";

const TIMEOUT_MS = 20_000;

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function phFetch(url: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { throw new Error(`PagHiper retornou resposta inválida: ${text.slice(0, 200)}`); }
  } catch (e) {
    if ((e as Error).name === "AbortError")
      throw new Error(`Timeout ao chamar PagHiper (>${TIMEOUT_MS / 1000}s)`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { action, customer, payment } = await req.json();

    const cpf   = (customer.cpf   ?? "").replace(/\D/g, "");
    const phone = (customer.phone ?? "").replace(/\D/g, "");
    const cep   = (customer.cep   ?? "").replace(/\D/g, "");
    const cents = Math.round(Number(payment.total) * 100);

    const baseBody = {
      apiKey:           PAGHIPER_KEY,
      token:            PAGHIPER_TOKEN,
      order_id:         payment.orderNumber,
      payer_name:       customer.name,
      payer_cpf_cnpj:   cpf,
      payer_email:      customer.email,
      payer_phone:      phone,
      payer_street:     customer.address,
      payer_number:     customer.addressNum,
      payer_complement: customer.complement || "",
      payer_district:   customer.neighborhood || "Centro",
      payer_city:       customer.city,
      payer_state:      customer.state,
      payer_zip_code:   cep,
      ...(NOTIFICATION_URL ? { notification_url: NOTIFICATION_URL } : {}),
      days_due_date:    1,
      items: [{
        description: `Pedido ${STORE_NAME} - ${payment.orderNumber}`,
        quantity:    "1",
        item_id:     "1",
        price_cents: String(cents),
      }],
    };

    // ── PIX ──────────────────────────────────────────────────────
    if (action === "create_pix") {
      const data = await phFetch("https://pix.paghiper.com/invoice/create/", baseBody);
      // PIX usa "pix_create_request", boleto usa "create_request"
      const req  = data?.pix_create_request ?? data?.create_request;

      if (!req || req.result !== "success") {
        const raw = req?.response_message ?? "Erro ao processar pagamento";
        return json({ error: friendlyPaymentError(raw) }, 400);
      }

      return json({
        paymentId:   req.transaction_id,
        pixCode:     req.pix_code?.emv          ?? "",
        pixQrCodeUrl: req.pix_code?.qrcode_image_url ?? "",
        status:      req.status,
      });
    }

    // ── BOLETO ───────────────────────────────────────────────────
    if (action === "create_boleto") {
      const data = await phFetch("https://api.paghiper.com/transaction/create/", baseBody);
      const req  = data?.create_request;

      if (!req || req.result !== "success") {
        const raw = req?.response_message ?? "Erro ao processar pagamento";
        return json({ error: friendlyPaymentError(raw) }, 400);
      }

      return json({
        paymentId:  req.transaction_id,
        boletoCode: req.bank_slip?.digitable_line ?? "",
        boletoUrl:  req.bank_slip?.url_slip       ?? "",
        status:     req.status,
      });
    }

    return json({ error: "Action inválida" }, 400);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[paghiper-payment]", msg);
    return json({ error: msg }, 500);
  }
});

function friendlyPaymentError(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  if (normalized.includes("cpf") || normalized.includes("cnpj") || normalized.includes("payer_cpf"))
    return "CPF ou CNPJ inválido. Confira os dados e tente novamente.";
  if (normalized.includes("payer_email") || normalized.includes("email"))
    return "E-mail inválido. Confira o endereço e tente novamente.";
  if (normalized.includes("payer_phone") || normalized.includes("phone"))
    return "Telefone inválido. Informe um número com DDD.";
  if (normalized.includes("payer_zip") || normalized.includes("cep"))
    return "CEP inválido. Confira o endereço e tente novamente.";
  if (normalized.includes("duplicate") || normalized.includes("duplicado"))
    return "Pedido duplicado. Aguarde alguns minutos e tente novamente.";
  if (normalized.includes("valor") || normalized.includes("amount") || normalized.includes("cents"))
    return "Valor do pedido inválido. Entre em contato com o suporte.";
  // fallback legível
  return "Não foi possível processar o pagamento. Verifique os dados e tente novamente.";
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
