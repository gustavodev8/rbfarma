// ============================================================
// RB FARMA — Edge Function: asaas-payment
// Cole este código no painel Supabase > Edge Functions
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ASAAS_KEY = Deno.env.get("ASAAS_API_KEY") ?? "";
const ASAAS_URL = "https://sandbox.asaas.com/api/v3"; // troque para https://www.asaas.com/api/v3 em produção
const FETCH_TIMEOUT_MS = 15_000; // 15 segundos por chamada à API do Asaas

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const asaasHeaders = {
  "Content-Type": "application/json",
  "access_token": ASAAS_KEY,
};

// Fetch com timeout via AbortController
async function asaas(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${ASAAS_URL}${path}`, {
      ...options,
      headers: { ...asaasHeaders, ...(options.headers ?? {}) },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Asaas ${path} → HTTP ${res.status}: ${text}`);
    }

    return res.json();
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Timeout ao chamar Asaas ${path} (>${FETCH_TIMEOUT_MS / 1000}s)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const body = await req.json();
    const { action, customer, payment, cardData } = body;

    // ── CREATE PAYMENT ──────────────────────────────────────────────
    if (action === "create_payment") {
      const cpfRaw   = (customer.cpf   ?? "").replace(/\D/g, "");
      const phoneRaw = (customer.phone ?? "").replace(/\D/g, "");
      const cepRaw   = (customer.cep   ?? "").replace(/\D/g, "");

      // 1. Cria cliente no Asaas
      const custRes = await asaas("/customers", {
        method: "POST",
        body: JSON.stringify({
          name:          customer.name,
          cpfCnpj:       cpfRaw,
          email:         customer.email,
          phone:         phoneRaw,
          postalCode:    cepRaw,
          address:       customer.address,
          addressNumber: customer.addressNum,
          complement:    customer.complement || "",
          province:      customer.neighborhood || "",
        }),
      });

      if (custRes.errors?.length) {
        return json({ error: custRes.errors[0]?.description ?? "Erro ao criar cliente no Asaas" }, 400);
      }

      const customerId = custRes.id;

      // 2. Monta corpo do pagamento
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      const billingType =
        payment.method === "pix"    ? "PIX"         :
        payment.method === "credit" ? "CREDIT_CARD"  : "BOLETO";

      const payBody: Record<string, unknown> = {
        customer:          customerId,
        billingType,
        value:             payment.total,
        dueDate:           dueDateStr,
        description:       `Pedido RB FARMA - ${payment.orderNumber}`,
        externalReference: payment.orderNumber,
      };

      if (payment.method === "credit" && (payment.installments ?? 1) > 1) {
        payBody.installmentCount = payment.installments;
        payBody.totalValue       = payment.total;
      }

      if (payment.method === "credit" && cardData) {
        const [expMonth, expYear] = (cardData.expiry ?? "/").split("/");
        payBody.creditCard = {
          holderName:  cardData.holderName,
          number:      (cardData.number ?? "").replace(/\s/g, ""),
          expiryMonth: expMonth,
          expiryYear:  "20" + expYear,
          ccv:         cardData.cvv,
        };
        payBody.creditCardHolderInfo = {
          name:          customer.name,
          email:         customer.email,
          cpfCnpj:       cpfRaw,
          postalCode:    cepRaw,
          addressNumber: customer.addressNum,
          phone:         phoneRaw,
        };
      }

      // 3. Cria o pagamento
      const payRes = await asaas("/payments", {
        method: "POST",
        body: JSON.stringify(payBody),
      });

      if (payRes.errors?.length) {
        return json({ error: payRes.errors[0]?.description ?? "Erro ao criar pagamento no Asaas" }, 400);
      }

      const result: Record<string, unknown> = {
        paymentId: payRes.id,
        status:    payRes.status,
      };

      // 4a. PIX → QR Code
      if (payment.method === "pix") {
        const pixRes = await asaas(`/payments/${payRes.id}/pixQrCode`);
        result.pixQrCodeBase64 = pixRes.encodedImage;
        result.pixCode         = pixRes.payload;
        result.pixExpiration   = pixRes.expirationDate;
      }

      // 4b. Boleto → linha digitável
      if (payment.method === "boleto") {
        const boletoRes = await asaas(`/payments/${payRes.id}/identificationField`);
        result.boletoCode    = boletoRes.identificationField;
        result.boletoBarCode = boletoRes.barCode;
        result.boletoUrl     = payRes.bankSlipUrl;
      }

      return json(result, 200);
    }

    // ── CHECK STATUS ────────────────────────────────────────────────
    if (action === "check_status") {
      const res = await asaas(`/payments/${payment.paymentId}`);
      return json({ status: res.status }, 200);
    }

    return json({ error: "Action inválida" }, 400);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[asaas-payment] erro:", msg);
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
