import { supabase } from "./supabaseClient";

export interface PaymentCustomer {
  name:         string;
  cpf:          string;
  email:        string;
  phone:        string;
  cep:          string;
  address:      string;
  addressNum:   string;
  complement:   string;
  neighborhood: string;
  city:         string;
  state:        string;
}

export interface PaymentInfo {
  method:      "pix" | "boleto";
  total:       number;
  orderNumber: string;
}

export interface PaymentResult {
  paymentId?:    string;
  status?:       string;
  // PIX
  pixCode?:      string;
  pixQrCodeUrl?: string;
  // Boleto
  boletoCode?:   string;
  boletoUrl?:    string;
  // Erro
  error?:        string;
}

/* ─────────────────────────────────────────────────────────────
   MODO SIMULADO  (VITE_MOCK_PAYMENTS=true)
───────────────────────────────────────────────────────────── */
const USE_MOCK = import.meta.env.VITE_MOCK_PAYMENTS === "true";

async function mockPayment(payment: PaymentInfo): Promise<PaymentResult> {
  await new Promise((r) => setTimeout(r, 900));
  const id = "mock_" + Math.random().toString(36).slice(2, 10);
  if (payment.method === "pix") {
    return {
      paymentId: id,
      status:    "pending",
      pixCode:   "00020101021226890014br.gov.bcb.pix0136" + id +
                 "5204000053039865802BR5909RBFARMA6009SAOPAULO62070503***6304ABCD",
    };
  }
  return {
    paymentId:  id,
    status:     "pending",
    boletoCode: "23793.38109 60007.827136 95000.063305 4 10060000" +
      String(Math.floor(payment.total * 100)).padStart(10, "0"),
  };
}

/* ─────────────────────────────────────────────────────────────
   createPayment — fetch direto à Edge Function (mais confiável)
───────────────────────────────────────────────────────────── */
const FUNCTION_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paghiper-payment`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const TIMEOUT_MS = 30_000;

export async function createPayment(
  customer: PaymentCustomer,
  payment:  PaymentInfo,
): Promise<PaymentResult> {
  if (USE_MOCK) {
    console.info("[paymentService] MODO SIMULADO");
    return mockPayment(payment);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.info("[paymentService] Chamando Edge Function:", payment.method);

    const action = payment.method === "pix" ? "create_pix" : "create_boleto";

    const res = await fetch(FUNCTION_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${ANON_KEY}`,
        "apikey":        ANON_KEY,
      },
      body:   JSON.stringify({ action, customer, payment }),
      signal: controller.signal,
    });

    const data = await res.json() as PaymentResult & { error?: string };

    if (!res.ok || data.error) {
      // A Edge Function pode retornar 400 mas com a resposta completa do PagHiper
      // no campo error (bug de versão antiga). Tentamos extrair os dados de pagamento.
      const errMsg = data.error ?? `Erro HTTP ${res.status}`;
      const jsonMatch = errMsg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const ph = JSON.parse(jsonMatch[0]);
          // PIX
          const pixReq = ph?.pix_create_request ?? ph?.create_request;
          if (pixReq?.result === "success" && pixReq?.pix_code?.emv) {
            console.info("[paymentService] PIX extraído do fallback:", pixReq.transaction_id);
            return {
              paymentId:   pixReq.transaction_id,
              pixCode:     pixReq.pix_code.emv,
              pixQrCodeUrl: pixReq.pix_code.qrcode_image_url ?? "",
              status:      pixReq.status,
            };
          }
          // Boleto
          const bolReq = ph?.create_request;
          if (bolReq?.result === "success" && bolReq?.bank_slip?.digitable_line) {
            console.info("[paymentService] Boleto extraído do fallback:", bolReq.transaction_id);
            return {
              paymentId:  bolReq.transaction_id,
              boletoCode: bolReq.bank_slip.digitable_line,
              boletoUrl:  bolReq.bank_slip.url_slip ?? "",
              status:     bolReq.status,
            };
          }
        } catch { /* ignora parse error */ }
      }
      console.error("[paymentService] Erro PagHiper:", errMsg);
      return { error: errMsg };
    }

    console.info("[paymentService] Sucesso:", data);
    return data;

  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { error: "Servidor de pagamentos não respondeu. Tente novamente." };
    }
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[paymentService] Exceção:", err);
    return { error: msg };
  } finally {
    clearTimeout(timer);
  }
}
