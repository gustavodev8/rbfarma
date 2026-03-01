// ============================================================
// RB FARMA — Edge Function: paghiper-payment
// Cole este código no painel Supabase > Edge Functions
// Nome da função: paghiper-payment
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Credenciais PagHiper
const PAGHIPER_KEY   = "apk_40129856-VzoiNCQOJhzbRIgdYspbDkGyagtfoikY";
const PAGHIPER_TOKEN = "ZL7J3BC8S4R834T99IU0S08E28LIFAMNCB14BIVOI5YC";

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
      notification_url: "https://rbfarma.com.br/webhook/paghiper",
      days_due_date:    1,
      items: [{
        description: `Pedido RB FARMA - ${payment.orderNumber}`,
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
        const msg = req?.response_message ?? JSON.stringify(data);
        return json({ error: `PagHiper PIX: ${msg}` }, 400);
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
        const msg = req?.response_message ?? JSON.stringify(data);
        return json({ error: `PagHiper Boleto: ${msg}` }, 400);
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
