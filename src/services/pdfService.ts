import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Order } from "./ordersService";
import type { EntradaFluxo } from "./fluxoCaixaService";
import type { Conta } from "./contasService";
import type { Colaborador } from "./colaboradoresService";

// ─── Tipos públicos ────────────────────────────────────────────────────────────
export interface PDFSecoes {
  pedidos:       boolean;
  produtos:      boolean;
  colaboradores: boolean;
  fluxoCaixa:    boolean;
  contas:        boolean;
  comissoes:     boolean;
}

export interface PDFConfig {
  titulo:   string;
  periodo:  string;
  secoes:   PDFSecoes;
  dados: {
    orders:        Order[];
    fluxo:         EntradaFluxo[];
    contas:        Conta[];
    colaboradores: Colaborador[];
  };
  metricas: {
    faturamento:  number;
    totalPedidos: number;
    ticketMedio:  number;
    totalItens:   number;
  };
}

// ─── Constantes visuais ────────────────────────────────────────────────────────
const GREEN = [22, 163, 74] as [number, number, number];
const SLATE = [100, 116, 139] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT = [241, 245, 249] as [number, number, number];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string): string {
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

function lastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 30;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...LIGHT);
  doc.roundedRect(14, y, w - 28, 8, 1, 1, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE);
  doc.text(title.toUpperCase(), 18, y + 5.5);
  doc.setTextColor(0, 0, 0);
  return y + 11;
}

function checkPage(doc: jsPDF, y: number, needed = 35): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── Cálculos internos ─────────────────────────────────────────────────────────
function topProducts(orders: Order[]) {
  const map: Record<string, { name: string; qty: number; total: number }> = {};
  orders.forEach(o => {
    (o.order_items ?? []).forEach(item => {
      const k = item.product_name ?? item.product_id;
      if (!map[k]) map[k] = { name: item.product_name ?? k, qty: 0, total: 0 };
      map[k].qty   += item.quantity;
      map[k].total += item.quantity * Number(item.unit_price);
    });
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 20);
}

function byColaborador(orders: Order[]) {
  const map: Record<string, { nome: string; pedidos: number; total: number }> = {};
  orders.forEach(o => {
    const nome = o.vendedor_nome ?? "Sem vendedor";
    if (!map[nome]) map[nome] = { nome, pedidos: 0, total: 0 };
    map[nome].pedidos++;
    map[nome].total += Number(o.total);
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// ─── Gerador principal ─────────────────────────────────────────────────────────
export function gerarRelatorioPDF(config: PDFConfig): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w   = doc.internal.pageSize.getWidth();
  let y     = 30;

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, w, 24, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RB FARMA", 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(config.titulo, 14, 21);
  doc.text(`Periodo: ${config.periodo}`, w - 14, 14, { align: "right" });
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, w - 14, 21, { align: "right" });

  doc.setTextColor(0, 0, 0);

  // ── Resumo sempre incluído ──────────────────────────────────────────────────
  y = addSectionTitle(doc, "Resumo Geral", y);
  autoTable(doc, {
    startY:      y,
    head:        [["Faturamento", "Pedidos", "Ticket Medio", "Itens Vendidos"]],
    body:        [[
      fmt(config.metricas.faturamento),
      String(config.metricas.totalPedidos),
      fmt(config.metricas.ticketMedio),
      String(config.metricas.totalItens),
    ]],
    theme:       "grid",
    headStyles:  { fillColor: GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 9, halign: "center" },
    bodyStyles:  { fontSize: 11, fontStyle: "bold", halign: "center" },
    margin:      { left: 14, right: 14 },
  });
  y = lastY(doc) + 8;

  // ── Produtos mais vendidos ──────────────────────────────────────────────────
  if (config.secoes.produtos) {
    const prods = topProducts(config.dados.orders);
    if (prods.length > 0) {
      y = checkPage(doc, y);
      y = addSectionTitle(doc, "Produtos Mais Vendidos", y);
      autoTable(doc, {
        startY:    y,
        head:      [["#", "Produto", "Qtd", "Total"]],
        body:      prods.map((p, i) => [i + 1, p.name, p.qty, fmt(p.total)]),
        theme:     "striped",
        headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin:    { left: 14, right: 14 },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "right",  cellWidth: 36 },
        },
      });
      y = lastY(doc) + 8;
    }
  }

  // ── Vendas por colaborador ──────────────────────────────────────────────────
  if (config.secoes.colaboradores) {
    const colabs = byColaborador(config.dados.orders);
    if (colabs.length > 0) {
      y = checkPage(doc, y);
      y = addSectionTitle(doc, "Vendas por Colaborador", y);
      autoTable(doc, {
        startY:    y,
        head:      [["#", "Colaborador", "Pedidos", "Total"]],
        body:      colabs.map((c, i) => [i + 1, c.nome, c.pedidos, fmt(c.total)]),
        theme:     "striped",
        headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin:    { left: 14, right: 14 },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          2: { halign: "center", cellWidth: 22 },
          3: { halign: "right",  cellWidth: 36 },
        },
      });
      y = lastY(doc) + 8;
    }
  }

  // ── Lista de pedidos ────────────────────────────────────────────────────────
  if (config.secoes.pedidos && config.dados.orders.length > 0) {
    y = checkPage(doc, y);
    y = addSectionTitle(doc, "Lista de Pedidos", y);
    const STATUS_MAP: Record<string, string> = {
      pending:    "Pendente",
      processing: "Em andamento",
      shipped:    "Enviado",
      delivered:  "Concluido",
      cancelled:  "Cancelado",
    };
    autoTable(doc, {
      startY:    y,
      head:      [["Pedido", "Cliente", "Data", "Pagamento", "Status", "Total"]],
      body:      config.dados.orders.map(o => [
        o.order_number ?? o.id.slice(0, 8),
        o.customer_name,
        fmtDate(o.created_at),
        o.payment_method === "pix" ? "PIX"
          : o.payment_method === "credit" ? "Cartao Cred."
          : "Boleto",
        STATUS_MAP[o.status] ?? o.status,
        fmt(Number(o.total)),
      ]),
      theme:     "striped",
      headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 },
      margin:    { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 25 },
        5: { halign: "right", cellWidth: 28 },
      },
    });
    y = lastY(doc) + 8;
  }

  // ── Fluxo de caixa ──────────────────────────────────────────────────────────
  if (config.secoes.fluxoCaixa && config.dados.fluxo.length > 0) {
    y = checkPage(doc, y);
    y = addSectionTitle(doc, "Fluxo de Caixa", y);

    const entradas = config.dados.fluxo.filter(f => f.tipo === "entrada");
    const saidas   = config.dados.fluxo.filter(f => f.tipo === "saida");
    const totalE   = entradas.reduce((s, f) => s + f.valor, 0);
    const totalS   = saidas.reduce((s, f) => s + f.valor, 0);

    autoTable(doc, {
      startY:    y,
      head:      [["Total Entradas", "Total Saidas", "Saldo do Periodo"]],
      body:      [[fmt(totalE), fmt(totalS), fmt(totalE - totalS)]],
      theme:     "grid",
      headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 8, halign: "center" },
      bodyStyles: { fontSize: 9, fontStyle: "bold", halign: "center" },
      margin:    { left: 14, right: 14 },
    });
    y = lastY(doc) + 4;

    autoTable(doc, {
      startY:    y,
      head:      [["Data", "Descricao", "Categoria", "Tipo", "Forma Pgto", "Valor"]],
      body:      config.dados.fluxo.map(f => [
        fmtDate(f.data),
        f.descricao,
        f.categoria,
        f.tipo === "entrada" ? "Entrada" : "Saida",
        f.forma_pagamento ?? "-",
        (f.tipo === "saida" ? "- " : "") + fmt(f.valor),
      ]),
      theme:     "striped",
      headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 },
      margin:    { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 20 },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 24 },
        5: { halign: "right", cellWidth: 28 },
      },
    });
    y = lastY(doc) + 8;
  }

  // ── Contas a pagar / receber ────────────────────────────────────────────────
  if (config.secoes.contas && config.dados.contas.length > 0) {
    y = checkPage(doc, y);
    y = addSectionTitle(doc, "Contas a Pagar / Receber", y);
    const STATUS_CONTA: Record<string, string> = {
      pendente: "Pendente",
      pago:     "Pago",
      vencido:  "Vencido",
    };
    autoTable(doc, {
      startY:    y,
      head:      [["Descricao", "Tipo", "Categoria", "Vencimento", "Status", "Valor"]],
      body:      config.dados.contas.map(c => [
        c.descricao,
        c.tipo === "pagar" ? "A pagar" : "A receber",
        c.categoria,
        fmtDate(c.vencimento),
        STATUS_CONTA[c.status] ?? c.status,
        fmt(Number(c.valor)),
      ]),
      theme:     "striped",
      headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 },
      margin:    { left: 14, right: 14 },
      columnStyles: {
        1: { cellWidth: 24, halign: "center" },
        3: { cellWidth: 24, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { halign: "right", cellWidth: 28 },
      },
    });
    y = lastY(doc) + 8;
  }

  // ── Comissões de colaboradores ──────────────────────────────────────────────
  if (config.secoes.comissoes && config.dados.colaboradores.length > 0) {
    y = checkPage(doc, y);
    y = addSectionTitle(doc, "Comissoes de Colaboradores", y);

    const vendas = byColaborador(config.dados.orders);
    const rows   = config.dados.colaboradores
      .filter(c => c.ativo)
      .map(col => {
        const v          = vendas.find(b => b.nome === col.nome);
        const totalVend  = v?.total ?? 0;
        const comissao   = totalVend * (col.comissao_pct / 100);
        return [
          col.nome,
          `${Number(col.comissao_pct).toFixed(1)}%`,
          fmt(totalVend),
          fmt(comissao),
        ];
      });

    autoTable(doc, {
      startY:    y,
      head:      [["Colaborador", "% Comissao", "Total Vendas", "Comissao Calculada"]],
      body:      rows,
      theme:     "striped",
      headStyles: { fillColor: GREEN, textColor: WHITE, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin:    { left: 14, right: 14 },
      columnStyles: {
        1: { halign: "center", cellWidth: 28 },
        2: { halign: "right",  cellWidth: 36 },
        3: { halign: "right",  cellWidth: 36 },
      },
    });
  }

  // ── Rodapé com numero de página ─────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text(`Pagina ${i} de ${total}`, w / 2, ph - 7, { align: "center" });
    doc.text("RB FARMA — Relatorio gerado automaticamente", 14, ph - 7);
  }

  // ── Download ────────────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`rbfarma-relatorio-${dateStr}.pdf`);
}
