import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { STORE_NAME, STORE_SLOGAN } from "@/config/storeConfig";

export interface ReceiptData {
  orderNumber:   string;
  customerName:  string;
  vendedor:      string | null;
  paymentMethod: string;
  parcelas?:     number;
  items:         { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal:      number;
  discount:      number;
  total:         number;
  troco?:        number | null;
  valorRecebido?:number | null;
  date:          Date;
}

const GREEN = [22, 163, 74] as [number, number, number];

function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gerarRecibo(data: ReceiptData): void {
  // 80mm receipt width ≈ 72mm printable → use custom page
  const pageW = 80;
  // Estimate height based on content
  const baseH = 100;
  const itemsH = data.items.length * 7;
  const extraH = data.troco != null ? 14 : 0;
  const pageH = Math.max(baseH + itemsH + extraH, 120);

  const doc = new jsPDF({ unit: "mm", format: [pageW, pageH] });
  const w = doc.internal.pageSize.getWidth();
  let y = 8;

  // ── Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...GREEN);
  doc.text(STORE_NAME, w / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("CUPOM NAO FISCAL", w / 2, y, { align: "center" });
  y += 4;

  // Divider
  doc.setDrawColor(200);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, w - 4, y);
  y += 4;

  // ── Order info ──
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  const dateStr = data.date.toLocaleDateString("pt-BR");
  const timeStr = data.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  doc.setFont("helvetica", "bold");
  doc.text("Pedido:", 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.orderNumber, 20, y);
  doc.text(`${dateStr} ${timeStr}`, w - 4, y, { align: "right" });
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, 20, y);
  y += 4;

  if (data.vendedor) {
    doc.setFont("helvetica", "bold");
    doc.text("Vendedor:", 4, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.vendedor, 24, y);
    y += 4;
  }

  const payLabel = data.paymentMethod === "pix" ? "PIX"
    : data.paymentMethod === "dinheiro" ? "Dinheiro"
    : data.parcelas && data.parcelas > 1 ? `Cartao ${data.parcelas}x`
    : "Cartao";
  doc.setFont("helvetica", "bold");
  doc.text("Pagamento:", 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(payLabel, 26, y);
  y += 5;

  // Divider
  doc.line(4, y, w - 4, y);
  y += 3;

  // ── Items table ──
  autoTable(doc, {
    startY: y,
    head: [["Produto", "Qtd", "Unit.", "Total"]],
    body: data.items.map(i => [
      i.name.length > 22 ? i.name.slice(0, 22) + "..." : i.name,
      String(i.qty),
      fmt(i.unitPrice),
      fmt(i.total),
    ]),
    theme: "plain",
    headStyles: { fontSize: 6.5, fontStyle: "bold", textColor: [60, 60, 60], cellPadding: 1 },
    bodyStyles: { fontSize: 6.5, cellPadding: 1 },
    margin: { left: 4, right: 4 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { halign: "center", cellWidth: 8 },
      2: { halign: "right", cellWidth: 16 },
      3: { halign: "right", cellWidth: 18 },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  y += 3;

  // Divider
  doc.line(4, y, w - 4, y);
  y += 4;

  // ── Totals ──
  doc.setFontSize(7.5);
  if (data.discount > 0) {
    doc.text("Subtotal:", 4, y);
    doc.text(fmt(data.subtotal), w - 4, y, { align: "right" });
    y += 4;
    doc.text("Desconto:", 4, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`- ${fmt(data.discount)}`, w - 4, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL:", 4, y);
  doc.text(fmt(data.total), w - 4, y, { align: "right" });
  y += 5;

  // ── Troco ──
  if (data.valorRecebido != null && data.troco != null) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Valor recebido:", 4, y);
    doc.text(fmt(data.valorRecebido), w - 4, y, { align: "right" });
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("TROCO:", 4, y);
    doc.text(fmt(data.troco), w - 4, y, { align: "right" });
    y += 5;
  }

  // Divider
  doc.setFont("helvetica", "normal");
  doc.line(4, y, w - 4, y);
  y += 5;

  // ── Footer ──
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Obrigado pela preferencia!", w / 2, y, { align: "center" });
  y += 3;
  doc.text(`${STORE_NAME} — ${STORE_SLOGAN}`, w / 2, y, { align: "center" });

  // ── Print / Download ──
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}
