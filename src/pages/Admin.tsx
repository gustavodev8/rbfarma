import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/services/supabaseClient";
import { fetchAllProducts, toggleProductActive, deleteProduct } from "@/services/productsService";
import {
  fetchAllSections, createSection, updateSection,
  toggleSectionActive, deleteSection, reorderSections,
} from "@/services/sectionsService";
import type { Section } from "@/services/sectionsService";
import {
  fetchAllBanners, uploadBanner, deleteBanner,
  toggleBannerActive, reorderBanners, validateBannerResolution,
} from "@/services/bannersService";
import type { Banner } from "@/services/bannersService";
import {
  fetchAllOrders, createOrder, updateOrderStatus, updateOrderTracking,
  STATUS_LABEL, STATUS_COLOR,
} from "@/services/ordersService";
import { isLocalOrder } from "@/services/shippingService";
import {
  fetchFluxoCombinado, createTransacao, deleteTransacao,
  CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA, FORMAS_PAGAMENTO,
} from "@/services/fluxoCaixaService";
import type { EntradaFluxo, TipoTransacao } from "@/services/fluxoCaixaService";
import {
  fetchColaboradores, createColaborador, updateColaborador,
  toggleColaboradorAtivo, deleteColaborador,
} from "@/services/colaboradoresService";
import type { Colaborador } from "@/services/colaboradoresService";
import { fetchEstoque, ajustarEstoque } from "@/services/estoqueService";
import type { EstoqueProduto } from "@/services/estoqueService";
import { fetchMeta, saveMeta } from "@/services/metasService";
import type { Meta } from "@/services/metasService";
import {
  fetchCupons, createCupom, toggleCupomAtivo, deleteCupom,
} from "@/services/cuponsService";
import type { Cupom, CupomInput } from "@/services/cuponsService";
import {
  fetchContas, createConta, updateContaStatus, deleteConta,
  CATEGORIAS_PAGAR, CATEGORIAS_RECEBER,
} from "@/services/contasService";
import type { Conta, ContaInput, ContaTipo } from "@/services/contasService";
import { restGet, restPost, restPatch } from "@/services/supabaseRest";
import type { Order } from "@/services/ordersService";
import AdminProductForm from "@/components/AdminProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Heart, LogOut, Plus, Pencil, Trash2,
  ChevronUp, ChevronDown, LayoutList, Search, X,
  Image as ImageIcon, Download, Package, ShoppingBag,
  TrendingUp, TrendingDown, Clock, BarChart2, ExternalLink, RefreshCw,
  ChevronRight, ChevronLeft, Truck, CheckCircle2, XCircle, AlertCircle,
  Link as LinkIcon, Save, ShoppingCart, Users, Menu, Minus, Receipt,
  Wallet, ArrowUpCircle, ArrowDownCircle, CalendarDays,
  UserPlus, UserCheck, UserX, Target, FileBarChart2, Boxes,
  Tag, BadgePercent, DollarSign, CalendarClock, Award, BadgeCheck,
  Ban, CreditCard, FileDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { gerarRelatorioPDF } from "@/services/pdfService";
import type { PDFSecoes } from "@/services/pdfService";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Tipo produto admin ───────────────────────────────────────────────────────
interface AdminProduct {
  id: string; name: string; brand: string; quantity: string;
  price: number; originalPrice: number; discount: number;
  image: string; category: string; sections: string[]; isActive: boolean;
  stock: number | null;
}

// ─── Tipo perfil de cliente ───────────────────────────────────────────────────
interface Profile {
  id: string;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  created_at: string;
}

// ─── Item do carrinho (PDV) ───────────────────────────────────────────────────
interface CartItem {
  product: AdminProduct;
  qty: number;
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="bg-background rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
            <span className="text-2xl font-extrabold text-primary tracking-tight">RB FARMA</span>
          </div>
          <p className="text-sm text-muted-foreground">Painel Administrativo</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rbfarma.com.br" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted animate-pulse rounded-md" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Ícone por status ─────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: Order["status"] }) {
  const cls = "h-3.5 w-3.5 shrink-0";
  switch (status) {
    case "pending":    return <Clock className={cls} />;
    case "processing": return <RefreshCw className={cls} />;
    case "shipped":    return <Truck className={cls} />;
    case "delivered":  return <CheckCircle2 className={cls} />;
    case "cancelled":  return <XCircle className={cls} />;
  }
}

// ─── Aba Dashboard ────────────────────────────────────────────────────────────
function DashboardTab({ isActive }: { isActive: boolean }) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
      loaded.current = true;
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) loadOrders();
  }, [isActive, loadOrders]);

  // ── Métricas ──
  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const active       = orders.filter(o => o.status !== "cancelled");
  const monthOrders  = active.filter(o => new Date(o.created_at) >= startOfMonth);
  const todayOrders  = orders.filter(o => new Date(o.created_at) >= startOfToday);
  const pending      = orders.filter(o => o.status === "pending");

  const revenueMonth = monthOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket    = active.length > 0
    ? active.reduce((s, o) => s + Number(o.total), 0) / active.length
    : 0;

  const recentOrders = [...orders].slice(0, 6);

  const statusCounts: Record<Order["status"], number> = {
    pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0,
  };
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });

  const metrics = [
    {
      label:    "Receita do mês",
      value:    fmt(revenueMonth),
      sub:      `${monthOrders.length} pedido${monthOrders.length !== 1 ? "s" : ""} no mês`,
      icon:     TrendingUp,
      color:    "text-green-600",
      bg:       "bg-green-50",
    },
    {
      label:    "Total de pedidos",
      value:    String(orders.length),
      sub:      `${todayOrders.length} hoje`,
      icon:     ShoppingBag,
      color:    "text-blue-600",
      bg:       "bg-blue-50",
    },
    {
      label:    "Aguardando pagamento",
      value:    String(pending.length),
      sub:      pending.length > 0 ? "Requerem atenção" : "Nenhum pendente",
      icon:     AlertCircle,
      color:    pending.length > 0 ? "text-amber-600" : "text-gray-400",
      bg:       pending.length > 0 ? "bg-amber-50" : "bg-gray-50",
    },
    {
      label:    "Ticket médio",
      value:    fmt(avgTicket),
      sub:      `${active.length} pedido${active.length !== 1 ? "s" : ""} ativos`,
      icon:     BarChart2,
      color:    "text-purple-600",
      bg:       "bg-purple-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-5 space-y-3">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-7 bg-muted animate-pulse rounded w-24" />
            <div className="h-3 bg-muted animate-pulse rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-background rounded-xl border border-border p-5">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${m.bg} mb-3`}>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground leading-tight">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Pedidos recentes */}
        <div className="lg:col-span-2 bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pedidos recentes</h3>
            <span className="text-xs text-muted-foreground">{recentOrders.length} de {orders.length}</span>
          </div>
          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{fmt(Number(order.total))}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(order.created_at)}</p>
                  </div>
                  <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                    <StatusIcon status={order.status} />
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos por status */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Por status</h3>
          </div>
          <div className="p-5 space-y-3">
            {(Object.entries(statusCounts) as [Order["status"], number][]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
                  <StatusIcon status={status} />
                  {STATUS_LABEL[status]}
                </span>
                <span className="text-sm font-bold text-foreground">{count}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Sem dados ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Aba de Pedidos (Admin) ───────────────────────────────────────────────────
type StatusFilter = Order["status"] | "all";

const STATUS_OPTIONS: { value: Order["status"]; label: string }[] = [
  { value: "pending",    label: "Aguardando pagamento" },
  { value: "processing", label: "Em processamento" },
  { value: "shipped",    label: "Enviado" },
  { value: "delivered",  label: "Entregue" },
  { value: "cancelled",  label: "Cancelado" },
];

function AdminOrdersTab({ isActive }: { isActive: boolean }) {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(false);
  const loaded = useRef(false);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId]       = useState<string | null>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});
  const [savingTracking, setSavingTracking] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
      loaded.current = true;
    } catch { toast.error("Erro ao carregar pedidos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) loadOrders();
  }, [isActive, loadOrders]);

  async function handleStatusChange(orderId: string, status: Order["status"]) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success("Status atualizado");
      // Expande automaticamente ao marcar como enviado para facilitar inserir o rastreio
      if (status === "shipped") setExpandedId(orderId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveTracking(orderId: string) {
    const code = (trackingEdits[orderId] ?? "").trim();
    setSavingTracking(orderId);
    try {
      await updateOrderTracking(orderId, code);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_code: code || null } : o));
      toast.success(code ? "Codigo de rastreio salvo" : "Codigo de rastreio removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar rastreio");
    } finally {
      setSavingTracking(null);
    }
  }

  const filtered = orders.filter(o => {
    const matchStatus  = statusFilter === "all" || o.status === statusFilter;
    const q            = search.toLowerCase();
    const matchSearch  = !q
      || o.order_number.toLowerCase().includes(q)
      || o.customer_name.toLowerCase().includes(q)
      || o.customer_email.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const paymentLabel: Record<string, string> = {
    pix:    "PIX",
    credit: "Cartão",
    boleto: "Boleto",
  };

  return (
    <>
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por pedido ou cliente..."
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { value: "all" as const, label: "Todos" },
            ...STATUS_OPTIONS,
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value as StatusFilter)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
          </span>
          <Button variant="outline" size="sm" onClick={loadOrders} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {["Pedido", "Data", "Cliente", "Pagamento", "Total", "Status", ""].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
            </TableBody>
          </Table>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {orders.length === 0
              ? "Nenhum pedido encontrado. Os pedidos aparecerão aqui assim que forem realizados."
              : `Nenhum pedido corresponde ao filtro selecionado.`}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(order => (
                <>
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <TableCell>
                      <p className="font-mono text-xs font-semibold">{order.order_number}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {fmtDateTime(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[160px]">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{order.customer_email}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{paymentLabel[order.payment_method]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{fmt(Number(order.total))}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value as Order["status"])}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${STATUS_COLOR[order.status]}`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === order.id ? "rotate-90" : ""}`} />
                    </TableCell>
                  </TableRow>

                  {/* Detalhes expandidos */}
                  {expandedId === order.id && (
                    <TableRow key={`${order.id}-detail`} className="bg-secondary/30 hover:bg-secondary/30">
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-6 py-4 grid sm:grid-cols-2 gap-5">
                          {/* Codigo de rastreio — apenas para pedidos fora da cidade */}
                          {!isLocalOrder(order.shipping_city, order.shipping_state) && (
                          <div className="sm:col-span-2 bg-background border border-border rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Truck className="h-3.5 w-3.5" /> Codigo de rastreio
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                value={trackingEdits[order.id] ?? order.tracking_code ?? ""}
                                onChange={e => setTrackingEdits(prev => ({ ...prev, [order.id]: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && handleSaveTracking(order.id)}
                                placeholder="Ex: BR123456789BR, JD014600152BR..."
                                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary focus:outline-none focus:border-primary font-mono"
                              />
                              <Button
                                size="sm"
                                className="gap-1.5 shrink-0"
                                disabled={savingTracking === order.id}
                                onClick={() => handleSaveTracking(order.id)}
                              >
                                <Save className="h-3.5 w-3.5" />
                                {savingTracking === order.id ? "Salvando..." : "Salvar"}
                              </Button>
                            </div>
                            {order.tracking_code && !(order.id in trackingEdits) && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Link para o cliente:</span>
                                <a
                                  href={`https://rastreamento.correios.com.br/app/resultado.app?objetos=${order.tracking_code}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Abrir rastreamento
                                </a>
                              </div>
                            )}
                            {!order.tracking_code && (
                              <p className="text-[11px] text-muted-foreground mt-1.5">
                                Informe o codigo apos postar o pacote nos Correios ou transportadora.
                              </p>
                            )}
                          </div>
                          )}

                          {/* Itens */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Itens do pedido
                            </p>
                            <ul className="space-y-2">
                              {(order.order_items ?? []).map(item => (
                                <li key={item.id} className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-background rounded border border-border shrink-0 overflow-hidden">
                                    <img src={item.product_image} alt={item.product_name}
                                      className="w-full h-full object-contain p-0.5"
                                      onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.product_name}</p>
                                    <p className="text-[11px] text-muted-foreground">{item.quantity}x {fmt(Number(item.unit_price))}</p>
                                  </div>
                                  <p className="text-xs font-semibold shrink-0">{fmt(Number(item.total))}</p>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Entrega + Resumo */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Entrega
                              </p>
                              <p className="text-xs text-foreground">
                                {order.shipping_address}, {order.shipping_number}
                                {order.shipping_complement ? `, ${order.shipping_complement}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.shipping_neighborhood ? `${order.shipping_neighborhood} · ` : ""}
                                {order.shipping_city}/{order.shipping_state} · CEP {order.shipping_cep}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Contato
                              </p>
                              <p className="text-xs text-foreground">{order.customer_phone}</p>
                              <p className="text-xs text-muted-foreground">CPF: {order.customer_cpf}</p>
                            </div>
                            <div className="bg-background rounded-lg border border-border p-3 space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Subtotal</span><span>{fmt(Number(order.subtotal))}</span>
                              </div>
                              {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                  <span>Desconto</span><span>-{fmt(Number(order.discount))}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs font-bold text-foreground border-t border-border pt-1 mt-1">
                                <span>Total</span><span>{fmt(Number(order.total))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

// ─── Aba de Produtos ──────────────────────────────────────────────────────────
function ProductsTab({ isActive }: { isActive: boolean }) {
  const [products, setProducts]             = useState<AdminProduct[]>([]);
  const [search, setSearch]                 = useState("");
  const [loading, setLoading]               = useState(false);
  const [loadError, setLoadError]           = useState<string | null>(null);
  const loaded = useRef(false);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | undefined>();
  const [deleteTarget, setDeleteTarget]     = useState<AdminProduct | undefined>();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAllProducts();
      setProducts(data as AdminProduct[]);
      loaded.current = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar produtos";
      setLoadError(msg);
      toast.error(msg);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) loadProducts();
  }, [isActive, loadProducts]);

  async function handleToggleActive(p: AdminProduct) {
    try {
      await toggleProductActive(p.id, !p.isActive);
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
      toast.success(!p.isActive ? "Produto ativado" : "Produto desativado");
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      setProducts(prev => prev.filter(x => x.id !== deleteTarget.id));
      toast.success("Produto excluído");
    } catch { toast.error("Erro ao excluir produto"); }
    finally { setDeleteTarget(undefined); }
  }

  const filtered = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto, marca..." className="pl-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => { setEditingProduct(undefined); setDialogOpen(true); }} className="gap-1.5 ml-auto">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {["Foto","Nome","Categoria","Seções","Preço","Estoque","Ativo","Ações"].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}
            </TableBody>
          </Table>
        ) : loadError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-destructive font-medium">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadProducts}>Tentar novamente</Button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum produto. <button onClick={() => setDialogOpen(true)} className="text-primary underline">Criar agora</button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Seções</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="hidden sm:table-cell">Estoque</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado para &quot;{search}&quot;
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <img src={p.image || "/placeholder.svg"} alt={p.name}
                      className="w-12 h-12 object-contain rounded-lg bg-secondary"
                      onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} · {p.quantity}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="capitalize text-xs">{p.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.sections.length === 0
                        ? <span className="text-xs text-muted-foreground">—</span>
                        : p.sections.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{fmt(p.price)}</p>
                    {p.discount > 0 && <p className="text-xs text-green-600">-{p.discount}%</p>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {p.stock === null ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> Livre
                      </span>
                    ) : p.stock === 0 ? (
                      <Badge variant="destructive" className="text-xs">Sem estoque</Badge>
                    ) : p.stock <= 5 ? (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                        {p.stock} restante{p.stock !== 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-400">
                        {p.stock} un.
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={p.isActive} onCheckedChange={() => handleToggleActive(p)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <AdminProductForm
            product={editingProduct}
            onSuccess={() => { setDialogOpen(false); toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!"); loadProducts(); }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={o => !o && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. <strong>{deleteTarget?.name}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Aba de Seções ────────────────────────────────────────────────────────────
function SectionsTab({ isActive }: { isActive: boolean }) {
  const [sections, setSections]         = useState<Section[]>([]);
  const [loading, setLoading]           = useState(false);
  const loaded = useRef(false);
  const [newName, setNewName]           = useState("");
  const [adding, setAdding]             = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editingName, setEditingName]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Section | undefined>();

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllSections();
      setSections(data);
      loaded.current = true;
    } catch { toast.error("Erro ao carregar seções"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) loadSections();
  }, [isActive, loadSections]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const maxOrder = sections.reduce((m, s) => Math.max(m, s.displayOrder), -1);
      const created  = await createSection(name, maxOrder + 1);
      setSections(prev => [...prev, created]);
      setNewName("");
      toast.success("Seção criada!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar seção");
    } finally { setAdding(false); }
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    try {
      const updated = await updateSection(id, { name });
      setSections(prev => prev.map(s => s.id === id ? updated : s));
      setEditingId(null);
      toast.success("Seção renomeada!");
    } catch { toast.error("Erro ao renomear"); }
  }

  async function handleToggle(section: Section) {
    try {
      await toggleSectionActive(section.id, !section.isActive);
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, isActive: !section.isActive } : s));
      toast.success(!section.isActive ? "Seção ativada" : "Seção desativada");
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSection(deleteTarget.id);
      setSections(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast.success("Seção excluída!");
    } catch { toast.error("Erro ao excluir"); }
    finally { setDeleteTarget(undefined); }
  }

  async function move(index: number, dir: "up" | "down") {
    const swapIndex = dir === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    const reordered = updated.map((s, i) => ({ ...s, displayOrder: i }));
    setSections(reordered);
    try {
      await reorderSections(reordered.map(s => ({ id: s.id, displayOrder: s.displayOrder })));
    } catch { toast.error("Erro ao reordenar"); loadSections(); }
  }

  return (
    <>
      <div className="flex gap-2 mb-6">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nome da nova seção..."
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" /> {adding ? "Criando..." : "Criar seção"}
        </Button>
      </div>

      {loading ? (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <Table><TableBody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}</TableBody></Table>
        </div>
      ) : sections.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">Nenhuma seção cadastrada.</div>
      ) : (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Ordem</TableHead>
                <TableHead>Nome da seção</TableHead>
                <TableHead className="w-28">Visível</TableHead>
                <TableHead className="text-right w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section, index) => (
                <TableRow key={section.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => move(index, "up")} disabled={index === 0}
                        className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => move(index, "down")} disabled={index === sections.length - 1}
                        className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingId === section.id ? (
                      <div className="flex items-center gap-2">
                        <Input value={editingName} onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleRename(section.id); if (e.key === "Escape") setEditingId(null); }}
                          autoFocus className="h-8 max-w-xs" />
                        <Button size="sm" onClick={() => handleRename(section.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>✕</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{section.name}</span>
                        {!section.isActive && <Badge variant="secondary" className="text-xs">inativa</Badge>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon"
                        onClick={() => { setEditingId(section.id); setEditingName(section.name); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(section)}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={o => !o && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
            <AlertDialogDescription>
              A seção <strong>{deleteTarget?.name}</strong> será removida. Os produtos que estavam nela não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Aba de Banners ───────────────────────────────────────────────────────────
function BannersTab({ isActive }: { isActive: boolean }) {
  const [banners, setBanners]           = useState<Banner[]>([]);
  const [loading, setLoading]           = useState(false);
  const loaded = useRef(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | undefined>();
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllBanners();
      setBanners(data);
      loaded.current = true;
    } catch { toast.error("Erro ao carregar banners"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) loadBanners();
  }, [isActive, loadBanners]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const { ok, w, h } = await validateBannerResolution(file);
    if (!ok) {
      setUploadError(`Resolução inválida: ${w}×${h}px. O banner deve ter exatamente 1200×400px.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      await uploadBanner(file);
      toast.success("Banner enviado com sucesso!");
      loadBanners();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar banner");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleToggleActive(banner: Banner) {
    try {
      await toggleBannerActive(banner.id, !banner.isActive);
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !banner.isActive } : b));
      toast.success(!banner.isActive ? "Banner ativado" : "Banner desativado");
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.id, deleteTarget.fileName);
      setBanners(prev => prev.filter(b => b.id !== deleteTarget.id));
      toast.success("Banner excluído!");
    } catch { toast.error("Erro ao excluir banner"); }
    finally { setDeleteTarget(undefined); }
  }

  async function handleExport(banner: Banner) {
    try {
      const res  = await fetch(banner.url);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = banner.fileName || "banner.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Erro ao exportar banner"); }
  }

  async function move(index: number, dir: "up" | "down") {
    const swapIndex = dir === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= banners.length) return;
    const updated = [...banners];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    const reordered = updated.map((b, i) => ({ ...b, displayOrder: i }));
    setBanners(reordered);
    try {
      await reorderBanners(reordered.map(b => ({ id: b.id, displayOrder: b.displayOrder })));
    } catch { toast.error("Erro ao reordenar"); loadBanners(); }
  }

  return (
    <>
      <div className="mb-8">
        <h3 className="text-base font-semibold mb-1">Enviar novo banner</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Resolução obrigatória: <strong>1200 × 400 px</strong> · Formatos: PNG, JPG ou WebP
        </p>
        <label className={`inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-lg border-2 border-dashed transition-colors select-none ${
          uploading
            ? "border-primary/40 bg-primary/5 pointer-events-none text-muted-foreground"
            : "border-border hover:border-primary hover:bg-primary/5 text-foreground"
        }`}>
          <ImageIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{uploading ? "Enviando..." : "Selecionar imagem"}</span>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
        {uploadError && (
          <div className="mt-3 flex items-start gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm max-w-md">
            <X className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-background rounded-xl border border-border flex items-center gap-4 p-3">
              <div className="w-40 h-[53px] bg-muted animate-pulse rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
                <div className="h-3 bg-muted animate-pulse rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">Nenhum banner cadastrado. Envie o primeiro acima.</div>
      ) : (
        <div className="grid gap-3">
          {banners.map((banner, index) => (
            <div key={banner.id} className={`bg-background rounded-xl border border-border flex items-center gap-4 p-3 transition-opacity ${!banner.isActive ? "opacity-50" : ""}`}>
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => move(index, "up")} disabled={index === 0}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(index, "down")} disabled={index === banners.length - 1}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="shrink-0 w-40 h-[53px] rounded-lg overflow-hidden bg-secondary">
                <img src={banner.url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{banner.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Posição {banner.displayOrder + 1}
                  {!banner.isActive && <Badge variant="secondary" className="text-xs ml-2">Inativo</Badge>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {banner.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <Switch checked={banner.isActive} onCheckedChange={() => handleToggleActive(banner)} />
                </div>
                <Button variant="outline" size="icon" title="Exportar" onClick={() => handleExport(banner)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteTarget(banner)}
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={o => !o && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo <strong>{deleteTarget?.fileName}</strong> será removido permanentemente do storage e do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── PDV: Nova Venda ──────────────────────────────────────────────────────────
function PDVTab({ isActive }: { isActive: boolean }) {
  const [search,          setSearch]          = useState("");
  const [allProducts,     setAllProducts]     = useState<AdminProduct[]>([]);
  const [colaboradores,   setColaboradores]   = useState<Colaborador[]>([]);
  const [cart,            setCart]            = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [custName,        setCustName]        = useState("");
  const [custPhone,       setCustPhone]       = useState("");
  const [custCPF,         setCustCPF]         = useState("");
  const [vendedor,        setVendedor]        = useState("");
  const [payMethod,       setPayMethod]       = useState<"dinheiro" | "cartao" | "pix">("dinheiro");
  const [discountPct,     setDiscountPct]     = useState(0);
  const [submitting,      setSubmitting]      = useState(false);
  const [successNum,      setSuccessNum]      = useState<string | null>(null);
  const loaded = useRef(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const [prodData, colabData] = await Promise.all([
        fetchAllProducts(),
        fetchColaboradores(),
      ]);
      setAllProducts(prodData.filter(p => p.isActive));
      setColaboradores(colabData.filter(c => c.ativo));
      loaded.current = true;
    } catch { toast.error("Erro ao carregar produtos"); }
    finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) loadProducts();
  }, [isActive, loadProducts]);

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()),
  );

  function addToCart(product: AdminProduct) {
    setCart(prev => {
      const found = prev.find(i => i.product.id === product.id);
      if (found) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev =>
      prev.map(i => i.product.id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
        .filter(i => i.qty > 0),
    );
  }

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const discount = subtotal * (discountPct / 100);
  const total    = subtotal - discount;

  async function handleSale() {
    if (cart.length === 0) { toast.error("Adicione pelo menos um produto."); return; }
    if (!custName.trim()) { toast.error("Informe o nome do cliente."); return; }
    setSubmitting(true);
    setSuccessNum(null);
    try {
      const result = await createOrder({
        customer_name:        custName.trim(),
        customer_email:       "pdv@atendimento.local",
        customer_cpf:         custCPF  || "000.000.000-00",
        customer_phone:       custPhone || "(00) 00000-0000",
        shipping_cep:         "48000000",
        shipping_address:     "Atendimento Presencial",
        shipping_number:      "S/N",
        shipping_city:        "Alagoinhas",
        shipping_state:       "BA",
        payment_method:       payMethod === "pix" ? "pix" : "credit",
        payment_installments: 1,
        subtotal,
        discount,
        shipping_cost:        0,
        total,
        vendedor_nome:        vendedor || null,
        items: cart.map(i => ({
          product_id:       i.product.id,
          product_name:     i.product.name,
          product_image:    i.product.image,
          product_brand:    i.product.brand,
          product_quantity: i.product.quantity,
          unit_price:       i.product.price,
          quantity:         i.qty,
          total:            i.product.price * i.qty,
        })),
      });
      if (result.order) {
        await updateOrderStatus(result.order.id, "delivered");
        setSuccessNum(result.order.order_number);
        setCart([]);
        setCustName(""); setCustPhone(""); setCustCPF(""); setDiscountPct(0); setVendedor("");
        toast.success(`Venda ${result.order.order_number} registrada!`);
      } else {
        toast.error(result.error ?? "Erro ao registrar venda");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar venda");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── Lista de produtos ── */}
      <div className="lg:col-span-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto por nome ou marca..." className="pl-9" />
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="bg-background border border-border hover:border-primary rounded-xl p-3 text-left transition-colors group">
                <img src={p.image || "/placeholder.svg"} alt={p.name}
                  className="w-full h-16 object-contain mb-2 rounded-lg bg-secondary"
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <p className="text-xs font-semibold line-clamp-2 group-hover:text-primary leading-snug">{p.name}</p>
                <p className="text-xs text-primary font-bold mt-1">{fmt(p.price)}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-10 text-center text-sm text-muted-foreground">
                {search ? `Nenhum produto para "${search}"` : "Nenhum produto ativo cadastrado"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Carrinho + Cliente + Pagamento ── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Carrinho */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Carrinho ({cart.reduce((s, i) => s + i.qty, 0)} itens)
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                Limpar
              </button>
            )}
          </div>
          {cart.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Clique em um produto para adicionar
            </div>
          ) : (
            <div className="divide-y divide-border max-h-52 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-[11px] text-muted-foreground">{fmt(item.product.price)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQty(item.product.id, -1)}
                      className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-secondary">
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)}
                      className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:bg-secondary">
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <p className="text-xs font-bold shrink-0 w-14 text-right">{fmt(item.product.price * item.qty)}</p>
                  <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vendedor */}
        {colaboradores.length > 0 && (
          <div className="bg-background border border-border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" /> Vendedor
            </h3>
            <select value={vendedor} onChange={e => setVendedor(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
              <option value="">Nenhum / Não informado</option>
              {colaboradores.map(c => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cliente */}
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Cliente
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Nome *</Label>
              <Input value={custName} onChange={e => setCustName(e.target.value)}
                placeholder="Nome do cliente" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={custPhone} onChange={e => setCustPhone(e.target.value)}
                placeholder="(00) 00000-0000" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">CPF</Label>
              <Input value={custCPF} onChange={e => setCustCPF(e.target.value)}
                placeholder="Opcional" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Pagamento + Total */}
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Receipt className="h-4 w-4" /> Pagamento
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {(["dinheiro", "cartao", "pix"] as const).map(m => {
              const labels = { dinheiro: "Dinheiro", cartao: "Cartão", pix: "PIX" };
              return (
                <button key={m} onClick={() => setPayMethod(m)}
                  className={`text-xs font-semibold py-2 rounded-lg border-2 transition-colors ${
                    payMethod === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}>
                  {labels[m]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Desconto (%)</Label>
            <Input type="number" min={0} max={100} value={discountPct}
              onChange={e => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-20 text-right" />
          </div>

          <div className="space-y-1 text-sm border-t border-border pt-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {discountPct > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto ({discountPct}%)</span><span>-{fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {successNum && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Venda <strong>{successNum}</strong> registrada com sucesso!
            </div>
          )}

          <Button onClick={handleSale} disabled={submitting || cart.length === 0} className="w-full gap-1.5">
            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
            {submitting ? "Registrando..." : "Registrar venda"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Fluxo de Caixa ───────────────────────────────────────────────────────────
function FluxoCaixaTab({ isActive }: { isActive: boolean }) {
  const hoje = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [entradas,    setEntradas]    = useState<EntradaFluxo[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [mes,         setMes]         = useState(hoje);
  const [tipoFiltro,  setTipoFiltro]  = useState<"todos" | TipoTransacao>("todos");
  const [search,      setSearch]      = useState("");

  // Modal nova transação manual
  const [addOpen,     setAddOpen]     = useState(false);
  const [tipo,        setTipo]        = useState<TipoTransacao>("saida");
  const [categoria,   setCategoria]   = useState("");
  const [descricao,   setDescricao]   = useState("");
  const [valor,       setValor]       = useState("");
  const [dataLanc,    setDataLanc]    = useState(new Date().toISOString().slice(0, 10));
  const [formaPag,    setFormaPag]    = useState("");
  const [obs,         setObs]         = useState("");
  const [saving,      setSaving]      = useState(false);

  // Confirmação de exclusão
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFluxoCombinado(mes);
      setEntradas(data);
    } catch { toast.error("Erro ao carregar fluxo de caixa"); }
    finally { setLoading(false); }
  }, [mes]);

  useEffect(() => {
    if (isActive) load();
  }, [isActive, mes, load]);

  const filtered = entradas.filter(t => {
    const matchTipo = tipoFiltro === "todos" || t.tipo === tipoFiltro;
    const q = search.toLowerCase();
    const matchQ = !q || t.descricao.toLowerCase().includes(q) || t.categoria.toLowerCase().includes(q);
    return matchTipo && matchQ;
  });

  const totalEntradas  = entradas.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas    = entradas.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const totalVendas    = entradas.filter(t => t.source === "order").reduce((s, t) => s + t.valor, 0);
  const saldo          = totalEntradas - totalSaidas;

  function resetForm() {
    setTipo("saida"); setCategoria(""); setDescricao(""); setValor("");
    setDataLanc(new Date().toISOString().slice(0, 10)); setFormaPag(""); setObs("");
  }

  async function handleAdd() {
    if (!descricao.trim()) { toast.error("Informe a descrição."); return; }
    if (!categoria)        { toast.error("Selecione a categoria."); return; }
    const v = parseFloat(valor.replace(",", "."));
    if (!v || v <= 0)      { toast.error("Informe um valor válido."); return; }
    setSaving(true);
    try {
      const result = await createTransacao({
        tipo, categoria, descricao: descricao.trim(),
        valor: v, data: dataLanc,
        forma_pagamento: formaPag || undefined,
        observacao:      obs.trim() || undefined,
      });
      if (result.transacao) {
        toast.success("Lançamento registrado!");
        setAddOpen(false);
        resetForm();
        await load();
      } else {
        toast.error(result.error ?? "Erro ao registrar");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTransacao(deleteId);
      toast.success("Lançamento removido.");
      setEntradas(prev => prev.filter(t => t.id !== deleteId));
    } catch { toast.error("Erro ao remover lançamento"); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  const categorias = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <>
      {/* Modal novo lançamento manual */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setTipo("entrada"); setCategoria(""); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-colors
                  ${tipo === "entrada" ? "bg-green-500 text-white border-green-500" : "border-border hover:bg-secondary"}`}>
                <ArrowUpCircle className="h-4 w-4" /> Entrada
              </button>
              <button onClick={() => { setTipo("saida"); setCategoria(""); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-colors
                  ${tipo === "saida" ? "bg-red-500 text-white border-red-500" : "border-border hover:bg-secondary"}`}>
                <ArrowDownCircle className="h-4 w-4" /> Saída
              </button>
            </div>
            <div className="space-y-1">
              <Label>Descrição *</Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)}
                placeholder={tipo === "saida" ? "Ex: Sangria, Conta de luz..." : "Ex: Suprimento de caixa..."} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Categoria *</Label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">Selecionar...</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Valor (R$) *</Label>
                <Input value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" type="number" min="0" step="0.01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Data *</Label>
                <Input value={dataLanc} onChange={e => setDataLanc(e.target.value)} type="date" />
              </div>
              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <select value={formaPag} onChange={e => setFormaPag(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">Opcional</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observação</Label>
              <Input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-base font-bold text-green-600 truncate">{fmt(totalEntradas)}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-base font-bold text-red-500 truncate">{fmt(totalSaidas)}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Receipt className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Vendas concluídas</p>
            <p className="text-base font-bold text-blue-600 truncate">{fmt(totalVendas)}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${saldo >= 0 ? "bg-purple-100" : "bg-red-100"}`}>
            {saldo >= 0
              ? <TrendingUp className="h-5 w-5 text-purple-600" />
              : <TrendingDown className="h-5 w-5 text-red-500" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-base font-bold truncate ${saldo >= 0 ? "text-purple-600" : "text-red-500"}`}>{fmt(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <div className="flex gap-1">
          {(["todos", "entrada", "saida"] as const).map(t => (
            <button key={t} onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${tipoFiltro === t ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}>
              {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Lançamento
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>{["Data","Tipo","Categoria","Descrição","Forma","Valor",""].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</TableBody>
          </Table>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search || tipoFiltro !== "todos" ? "Nenhum lançamento encontrado." : "Nenhum lançamento neste mês."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className={t.source === "order" ? "bg-green-50/30 dark:bg-green-950/10" : ""}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full
                      ${t.tipo === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {t.tipo === "entrada" ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                      {t.tipo === "entrada" ? "Entrada" : "Saída"}
                    </span>
                    {t.source === "order" && (
                      <span className="ml-1 text-[10px] text-muted-foreground">(auto)</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{t.categoria}</TableCell>
                  <TableCell className="text-sm">
                    <div className="truncate max-w-[200px]">{t.descricao}</div>
                    {t.observacao && <div className="text-xs text-muted-foreground">{t.observacao}</div>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{t.forma_pagamento ?? "—"}</TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${t.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>
                    {t.tipo === "entrada" ? "+" : "-"}{fmt(t.valor)}
                  </TableCell>
                  <TableCell>
                    {t.source === "manual" && (
                      <button onClick={() => setDeleteId(t.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

// ─── Colaboradores ────────────────────────────────────────────────────────────
function ColaboradoresTab({ isActive }: { isActive: boolean }) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [filtroAtivo,   setFiltroAtivo]   = useState<"todos" | "ativo" | "inativo">("todos");
  const loaded = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando,  setEditando]  = useState<Colaborador | null>(null);
  const [nome,      setNome]      = useState("");
  const [telefone,  setTelefone]  = useState("");
  const [email,     setEmail]     = useState("");
  const [cpf,       setCpf]       = useState("");
  const [salario,   setSalario]   = useState("");
  const [admissao,  setAdmissao]  = useState("");
  const [obs,       setObs]       = useState("");
  const [saving,    setSaving]    = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setColaboradores(await fetchColaboradores());
      loaded.current = true;
    } catch { toast.error("Erro ao carregar colaboradores"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) load();
  }, [isActive, load]);

  const filtered = colaboradores.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.nome.toLowerCase().includes(q);
    const matchAtivo = filtroAtivo === "todos" || (filtroAtivo === "ativo" ? c.ativo : !c.ativo);
    return matchQ && matchAtivo;
  });

  const ativos   = colaboradores.filter(c => c.ativo).length;
  const inativos = colaboradores.length - ativos;

  function openCreate() {
    setEditando(null);
    setNome(""); setTelefone(""); setEmail(""); setCpf(""); setSalario(""); setAdmissao(""); setObs("");
    setModalOpen(true);
  }

  function openEdit(c: Colaborador) {
    setEditando(c);
    setNome(c.nome); setTelefone(c.telefone || ""); setEmail(c.email || "");
    setCpf(c.cpf || ""); setSalario(c.salario ? String(c.salario) : "");
    setAdmissao(c.data_admissao || ""); setObs(c.observacao || "");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!nome.trim()) { toast.error("Informe o nome."); return; }
    setSaving(true);
    try {
      const payload = {
        nome:          nome.trim(),
        telefone:      telefone.trim()  || undefined,
        email:         email.trim()     || undefined,
        cpf:           cpf.trim()       || undefined,
        salario:       salario ? parseFloat(salario.replace(",", ".")) : null,
        data_admissao: admissao         || null,
        observacao:    obs.trim()       || undefined,
      };
      if (editando) {
        await updateColaborador(editando.id, payload);
        toast.success("Colaborador atualizado!");
        setColaboradores(prev => prev.map(c => c.id === editando.id ? { ...c, ...payload } : c));
      } else {
        const result = await createColaborador(payload);
        if (result.colaborador) {
          toast.success("Colaborador criado!");
          setColaboradores(prev => [result.colaborador!, ...prev]);
        } else { toast.error(result.error ?? "Erro ao criar"); return; }
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  }

  async function handleToggleAtivo(c: Colaborador) {
    try {
      await toggleColaboradorAtivo(c.id, !c.ativo);
      setColaboradores(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !c.ativo } : x));
      toast.success(c.ativo ? "Colaborador desativado." : "Colaborador ativado.");
    } catch { toast.error("Erro ao alterar status."); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteColaborador(deleteId);
      toast.success("Colaborador removido.");
      setColaboradores(prev => prev.filter(c => c.id !== deleteId));
    } catch { toast.error("Erro ao remover colaborador."); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  return (
    <>
      {/* Modal criar/editar */}
      <Dialog open={modalOpen} onOpenChange={v => setModalOpen(v)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <Label>Nome completo *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <Label>CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" />
              </div>
              <div className="space-y-1">
                <Label>Salário (R$)</Label>
                <Input value={salario} onChange={e => setSalario(e.target.value)} placeholder="0,00" type="number" min="0" step="0.01" />
              </div>
              <div className="space-y-1">
                <Label>Data de admissão</Label>
                <Input value={admissao} onChange={e => setAdmissao(e.target.value)} type="date" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Observações</Label>
                <Input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : editando ? "Salvar alterações" : "Criar colaborador"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{colaboradores.length}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-lg font-bold text-green-600">{ativos}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inativos</p>
            <p className="text-lg font-bold text-red-500">{inativos}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..." className="pl-9" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(["todos", "ativo", "inativo"] as const).map(f => (
            <button key={f} onClick={() => setFiltroAtivo(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filtroAtivo === f ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}>
              {f === "todos" ? "Todos" : f === "ativo" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} colaborador{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Novo colaborador
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>{["Nome","Telefone","CPF","Admissão","Salário","Status",""].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</TableBody>
          </Table>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search ? `Nenhum colaborador encontrado para "${search}"` : "Nenhum colaborador cadastrado ainda."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="hidden md:table-cell">Admissão</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Salário</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${c.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.nome}</p>
                        {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{c.telefone ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">{c.cpf ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {c.data_admissao ? new Date(c.data_admissao + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-sm font-semibold">
                    {c.salario ? Number(c.salario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => handleToggleAtivo(c)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors
                        ${c.ativo ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {c.ativo ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      {c.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(c.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
function ClientesTab({ isActive }: { isActive: boolean }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const loaded = useRef(false);

  // Modal de novo cliente
  const [createOpen,    setCreateOpen]    = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newCPF,        setNewCPF]        = useState("");
  const [newPhone,      setNewPhone]      = useState("");
  const [newEmail,      setNewEmail]      = useState("");
  const [creating,      setCreating]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, orderData] = await Promise.all([
        restGet<Profile>("profiles", { select: "*", order: "created_at.desc" }),
        fetchAllOrders(),
      ]);
      setProfiles(profileData);
      setOrders(orderData);
      loaded.current = true;
    } catch { toast.error("Erro ao carregar clientes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) load();
  }, [isActive, load]);

  async function handleCreateClient() {
    if (!newName.trim()) { toast.error("Informe o nome do cliente."); return; }
    setCreating(true);
    try {
      await restPost("profiles", {
        id:    crypto.randomUUID(),
        name:  newName.trim(),
        cpf:   newCPF.trim()   || null,
        phone: newPhone.trim() || null,
        email: newEmail.trim() || null,
      });
      toast.success("Cliente criado com sucesso!");
      setCreateOpen(false);
      setNewName(""); setNewCPF(""); setNewPhone(""); setNewEmail("");
      loaded.current = false;
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar cliente");
    } finally { setCreating(false); }
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.cpf?.includes(q)
    );
  });

  const ordersByUser = (userId: string) => orders.filter(o => o.user_id === userId);
  const totalSpent   = (userId: string) =>
    ordersByUser(userId)
      .filter(o => o.status !== "cancelled")
      .reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      {/* Modal novo cliente */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1">
              <Label>CPF</Label>
              <Input value={newCPF} onChange={e => setNewCPF(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="cliente@email.com" type="email" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleCreateClient} disabled={creating}>
                {creating ? "Salvando..." : "Criar cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..." className="pl-9" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Novo cliente
        </Button>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {["Cliente","Telefone","CPF","Pedidos","Total gasto","Cadastro"].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            </TableBody>
          </Table>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search ? `Nenhum cliente encontrado para "${search}"` : "Nenhum cliente cadastrado ainda."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="text-center">Pedidos</TableHead>
                <TableHead className="text-right">Total gasto</TableHead>
                <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const userOrders = ordersByUser(p.id);
                const isExp      = expanded === p.id;
                return (
                  <>
                    <TableRow key={p.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setExpanded(isExp ? null : p.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <p className="font-medium text-sm">{p.name ?? "Sem nome"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{p.phone ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-mono text-muted-foreground">{p.cpf ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{userOrders.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{fmt(totalSpent(p.id))}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{fmtDate(p.created_at)}</TableCell>
                      <TableCell>
                        {isExp
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                    </TableRow>

                    {/* Pedidos do cliente (expandido) */}
                    {isExp && (
                      <TableRow key={`${p.id}-orders`}>
                        <TableCell colSpan={7} className="bg-secondary/50 px-6 py-3">
                          {userOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Histórico de pedidos
                              </p>
                              {userOrders.map(o => (
                                <div key={o.id} className="flex items-center gap-3 text-sm bg-background rounded-lg px-3 py-2 border border-border">
                                  <span className="font-mono text-xs font-semibold text-foreground">{o.order_number}</span>
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>
                                    <StatusIcon status={o.status} />
                                    {STATUS_LABEL[o.status]}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</span>
                                  <span className="ml-auto font-semibold">{fmt(Number(o.total))}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

// ─── Aba Estoque ─────────────────────────────────────────────────────────────
function EstoqueTab({ isActive }: { isActive: boolean }) {
  const [produtos, setProdutos] = useState<EstoqueProduto[]>([]);
  const [loading, setLoading]   = useState(false);
  const loaded = useRef(false);
  const [search, setSearch]     = useState("");
  const [filtro, setFiltro]     = useState<"todos" | "baixo" | "zero">("todos");

  const [ajusteOpen,   setAjusteOpen]   = useState(false);
  const [produtoSel,   setProdutoSel]   = useState<EstoqueProduto | null>(null);
  const [tipoAjuste,   setTipoAjuste]   = useState<"entrada" | "saida" | "inventario">("entrada");
  const [qtdAjuste,    setQtdAjuste]    = useState("");
  const [stockMinEdit, setStockMinEdit] = useState("");
  const [saving,       setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEstoque();
      setProdutos(data);
      loaded.current = true;
    } catch { toast.error("Erro ao carregar estoque"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) load();
  }, [isActive, load]);

  function openAjuste(p: EstoqueProduto) {
    setProdutoSel(p);
    setTipoAjuste("entrada");
    setQtdAjuste("");
    setStockMinEdit(String(p.stock_min));
    setAjusteOpen(true);
  }

  async function handleSaveAjuste() {
    if (!produtoSel) return;
    const qty = Number(qtdAjuste);
    if (tipoAjuste !== "inventario" && (isNaN(qty) || qty <= 0)) {
      toast.error("Quantidade inválida"); return;
    }
    if (tipoAjuste === "inventario" && (isNaN(qty) || qty < 0)) {
      toast.error("Quantidade inválida"); return;
    }
    setSaving(true);
    try {
      let novoStock = produtoSel.stock;
      if      (tipoAjuste === "entrada")    novoStock = novoStock + qty;
      else if (tipoAjuste === "saida")      novoStock = Math.max(0, novoStock - qty);
      else                                  novoStock = qty;
      const novoMin = Number(stockMinEdit);
      const minFinal = isNaN(novoMin) ? produtoSel.stock_min : novoMin;
      await ajustarEstoque(produtoSel.id, novoStock, minFinal);
      setProdutos(prev =>
        prev.map(p => p.id === produtoSel.id
          ? { ...p, stock: novoStock, stock_min: minFinal }
          : p
        )
      );
      toast.success("Estoque atualizado");
      setAjusteOpen(false);
    } catch { toast.error("Erro ao atualizar"); }
    finally { setSaving(false); }
  }

  const filtered = produtos
    .filter(p => {
      if (filtro === "zero")  return p.stock === 0;
      if (filtro === "baixo") return p.stock > 0 && p.stock <= p.stock_min;
      return true;
    })
    .filter(p =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.stock - b.stock);

  const semEstoque   = produtos.filter(p => p.stock === 0).length;
  const baixoEstoque = produtos.filter(p => p.stock > 0 && p.stock <= p.stock_min).length;

  function StockBadge({ p }: { p: EstoqueProduto }) {
    if (p.stock === 0)
      return <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Sem estoque</span>;
    if (p.stock <= p.stock_min)
      return <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Estoque baixo</span>;
    return <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>;
  }

  return (
    <div className="space-y-4">
      {/* Alertas de estoque */}
      {(semEstoque > 0 || baixoEstoque > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {semEstoque > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">{semEstoque} produto{semEstoque > 1 ? "s" : ""} sem estoque</p>
                <p className="text-xs text-red-600">Requer reposição imediata</p>
              </div>
            </div>
          )}
          {baixoEstoque > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{baixoEstoque} produto{baixoEstoque > 1 ? "s" : ""} com estoque baixo</p>
                <p className="text-xs text-amber-600">Abaixo do mínimo definido</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {(["todos", "baixo", "zero"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filtro === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}>
              {f === "todos" ? "Todos" : f === "baixo" ? "Estoque baixo" : "Sem estoque"}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => { loaded.current = false; load(); }} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Estoque atual</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Mínimo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ajustar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-lg font-bold ${
                      p.stock === 0 ? "text-red-600" : p.stock <= p.stock_min ? "text-amber-600" : "text-foreground"
                    }`}>{p.stock}</span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground hidden sm:table-cell">{p.stock_min}</TableCell>
                  <TableCell className="text-center"><StockBadge p={p} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openAjuste(p)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog ajuste */}
      <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
          </DialogHeader>
          {produtoSel && (
            <div className="space-y-4">
              <div className="bg-secondary rounded-xl p-3">
                <p className="font-semibold text-sm">{produtoSel.name}</p>
                <p className="text-xs text-muted-foreground">{produtoSel.brand}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estoque atual: <strong>{produtoSel.stock}</strong> unidade{produtoSel.stock !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de ajuste</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["entrada", "saida", "inventario"] as const).map(t => (
                    <button key={t} onClick={() => setTipoAjuste(t)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        tipoAjuste === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}>
                      {t === "entrada" ? "Entrada" : t === "saida" ? "Saida" : "Inventario"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tipoAjuste === "entrada"    ? "Adiciona ao estoque atual (recebimento de mercadoria)" :
                   tipoAjuste === "saida"      ? "Subtrai do estoque atual (perda, avaria...)" :
                   "Define a quantidade exata (contagem fisica)"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>{tipoAjuste === "inventario" ? "Quantidade real contada" : "Quantidade"}</Label>
                <Input
                  type="number" min="0"
                  value={qtdAjuste}
                  onChange={e => setQtdAjuste(e.target.value)}
                  placeholder="0"
                  onKeyDown={e => e.key === "Enter" && handleSaveAjuste()}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Estoque minimo (alerta)</Label>
                <Input
                  type="number" min="0"
                  value={stockMinEdit}
                  onChange={e => setStockMinEdit(e.target.value)}
                  placeholder="5"
                />
              </div>

              <Button className="w-full" onClick={handleSaveAjuste} disabled={saving}>
                {saving ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Aba Relatorios ───────────────────────────────────────────────────────────
type PeriodKey = "hoje" | "semana" | "mes" | "mes_passado";

function getDateRange(period: PeriodKey): { start: Date; end: Date } {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "hoje") {
    return { start: today, end: now };
  }
  if (period === "semana") {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return { start, end: now };
  }
  if (period === "mes") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
  // mes_passado
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  };
}

function RelatoriosTab({ isActive }: { isActive: boolean }) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);
  const [period, setPeriod]   = useState<PeriodKey>("mes");
  const [pdfOpen,    setPdfOpen]    = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfSecoes,  setPdfSecoes]  = useState<PDFSecoes>({
    pedidos:       true,
    produtos:      true,
    colaboradores: true,
    fluxoCaixa:    false,
    contas:        false,
    comissoes:     false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await fetchAllOrders());
      loaded.current = true;
    } catch { toast.error("Erro ao carregar relatorio"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) load();
  }, [isActive, load]);

  const range = getDateRange(period);

  const pedidosPeriod = useMemo(() =>
    orders.filter(o => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.created_at);
      return d >= range.start && d <= range.end;
    }),
  [orders, range.start, range.end]);

  const faturamento = useMemo(() =>
    pedidosPeriod.reduce((s, o) => s + Number(o.total), 0),
  [pedidosPeriod]);

  const ticketMedio = pedidosPeriod.length > 0 ? faturamento / pedidosPeriod.length : 0;

  const totalItens = useMemo(() =>
    pedidosPeriod.reduce((s, o) => s + (o.order_items?.length ?? 0), 0),
  [pedidosPeriod]);

  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    pedidosPeriod.forEach(o => {
      const d   = new Date(o.created_at);
      const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key]  = (map[key] ?? 0) + Number(o.total);
    });
    return Object.entries(map)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => {
        const [ad, am] = a.date.split("/").map(Number);
        const [bd, bm] = b.date.split("/").map(Number);
        return am !== bm ? am - bm : ad - bd;
      });
  }, [pedidosPeriod]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {};
    pedidosPeriod.forEach(o => {
      (o.order_items ?? []).forEach(item => {
        const k = item.product_name ?? item.product_id;
        if (!map[k]) map[k] = { name: item.product_name ?? k, qty: 0, total: 0 };
        map[k].qty   += item.quantity;
        map[k].total += item.quantity * Number(item.unit_price);
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [pedidosPeriod]);

  const byColaborador = useMemo(() => {
    const map: Record<string, { nome: string; pedidos: number; total: number }> = {};
    pedidosPeriod.forEach(o => {
      const nome = o.vendedor_nome ?? "Sem vendedor";
      if (!map[nome]) map[nome] = { nome, pedidos: 0, total: 0 };
      map[nome].pedidos++;
      map[nome].total += Number(o.total);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [pedidosPeriod]);

  const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
    { key: "hoje",        label: "Hoje"         },
    { key: "semana",      label: "Esta semana"  },
    { key: "mes",         label: "Este mes"     },
    { key: "mes_passado", label: "Mes passado"  },
  ];

  const handleGerarPDF = useCallback(async () => {
    setPdfLoading(true);
    try {
      const mesMes = period === "mes_passado"
        ? (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })()
        : new Date().toISOString().slice(0, 7);

      const r = getDateRange(period);

      const [fluxoData, contasData, colaboradoresData] = await Promise.all([
        pdfSecoes.fluxoCaixa ? fetchFluxoCombinado(mesMes) : Promise.resolve([]),
        pdfSecoes.contas     ? fetchContas()               : Promise.resolve([]),
        pdfSecoes.comissoes  ? fetchColaboradores()        : Promise.resolve([]),
      ]);

      const fluxoFiltrado = fluxoData.filter(f => {
        const d = new Date(f.data + "T00:00:00");
        return d >= r.start && d <= r.end;
      });

      const periodLabel = PERIOD_OPTIONS.find(o => o.key === period)?.label ?? period;

      gerarRelatorioPDF({
        titulo:  "Relatorio de Desempenho",
        periodo: periodLabel,
        secoes:  pdfSecoes,
        dados: {
          orders:        pedidosPeriod,
          fluxo:         fluxoFiltrado,
          contas:        contasData,
          colaboradores: colaboradoresData,
        },
        metricas: {
          faturamento:  faturamento,
          totalPedidos: pedidosPeriod.length,
          ticketMedio:  ticketMedio,
          totalItens:   totalItens,
        },
      });

      setPdfOpen(false);
      toast.success("PDF gerado com sucesso");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setPdfLoading(false);
    }
  }, [pdfSecoes, period, pedidosPeriod, faturamento, ticketMedio, totalItens, PERIOD_OPTIONS]);

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIOD_OPTIONS.map(o => (
          <button key={o.key} onClick={() => setPeriod(o.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === o.key
                ? "bg-primary text-primary-foreground"
                : "bg-background border border-border text-muted-foreground hover:text-foreground"
            }`}>
            {o.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { loaded.current = false; load(); }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Atualizar
          </Button>
          <Button size="sm" onClick={() => setPdfOpen(true)} className="gap-1.5">
            <FileDown className="h-3.5 w-3.5" />Gerar PDF
          </Button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Faturamento",   value: fmt(faturamento),            icon: TrendingUp,  color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Pedidos",       value: String(pedidosPeriod.length), icon: ShoppingBag, color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Ticket medio",  value: fmt(ticketMedio),             icon: BarChart2,   color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Itens vendidos",value: String(totalItens),           icon: Package,     color: "text-orange-600", bg: "bg-orange-50" },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-background rounded-xl border border-border p-4">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${m.bg} mb-3`}>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-xl font-bold">{loading ? "..." : m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Grafico de barras */}
      {revenueByDay.length > 1 && (
        <div className="bg-background rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Faturamento por dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => `R$${(v as number) >= 1000 ? `${((v as number) / 1000).toFixed(1)}k` : v}`}
                tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50}
              />
              <Tooltip formatter={(v: unknown) => [fmt(v as number), "Receita"]} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Paineis inferiores */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top produtos */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Produtos mais vendidos</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sem dados para o periodo.</p>
          ) : (
            <div className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <div key={p.name} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} un.</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{fmt(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por colaborador */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Vendas por colaborador</h3>
          </div>
          {byColaborador.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sem dados para o periodo.</p>
          ) : (
            <div className="divide-y divide-border">
              {byColaborador.map((c, i) => (
                <div key={c.nome} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.pedidos} pedido{c.pedidos !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog PDF ────────────────────────────────────────────────────── */}
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerar Relatorio PDF</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground -mt-1">
            Periodo selecionado:{" "}
            <span className="font-medium text-foreground">
              {PERIOD_OPTIONS.find(o => o.key === period)?.label}
            </span>
          </p>

          <div className="space-y-3 py-1">
            <p className="text-sm font-medium">Secoes a incluir</p>
            {(
              [
                { key: "pedidos",       label: "Lista de pedidos"           },
                { key: "produtos",      label: "Produtos mais vendidos"     },
                { key: "colaboradores", label: "Vendas por colaborador"     },
                { key: "fluxoCaixa",   label: "Fluxo de caixa"             },
                { key: "contas",        label: "Contas a pagar / receber"   },
                { key: "comissoes",     label: "Comissoes de colaboradores" },
              ] as { key: keyof PDFSecoes; label: string }[]
            ).map(s => (
              <label key={s.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                <Checkbox
                  checked={pdfSecoes[s.key]}
                  onCheckedChange={v => setPdfSecoes(prev => ({ ...prev, [s.key]: !!v }))}
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setPdfOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleGerarPDF} disabled={pdfLoading} className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" />
              {pdfLoading ? "Gerando..." : "Baixar PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Aba Metas ────────────────────────────────────────────────────────────────
function MetasTab({ isActive }: { isActive: boolean }) {
  const now = new Date();
  const [mes, setMes]         = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [ordersDoMes, setOrdersDoMes] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode]           = useState(false);
  const [editFaturamento, setEditFaturamento] = useState("");
  const [editPedidos, setEditPedidos]     = useState("");
  const [saving, setSaving]               = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [metaData, ordersData] = await Promise.all([fetchMeta(mes), fetchAllOrders()]);
      setMeta(metaData);
      const [year, month] = mes.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);
      setOrdersDoMes(ordersData.filter(o => {
        if (o.status === "cancelled") return false;
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      }));
    } catch { toast.error("Erro ao carregar metas"); }
    finally { setLoading(false); }
  }, [mes]);

  useEffect(() => {
    if (isActive) load();
  }, [isActive, load]);

  const faturamentoReal = ordersDoMes.reduce((s, o) => s + Number(o.total), 0);
  const pedidosReal     = ordersDoMes.length;

  const pctFaturamento = meta?.meta_faturamento
    ? Math.min(100, Math.round((faturamentoReal / meta.meta_faturamento) * 100))
    : 0;
  const pctPedidos = meta?.meta_pedidos
    ? Math.min(100, Math.round((pedidosReal / meta.meta_pedidos) * 100))
    : 0;

  function startEdit() {
    setEditFaturamento(meta?.meta_faturamento ? String(meta.meta_faturamento) : "");
    setEditPedidos(meta?.meta_pedidos ? String(meta.meta_pedidos) : "");
    setEditMode(true);
  }

  async function handleSave() {
    const f = parseFloat(editFaturamento.replace(",", "."));
    const p = parseInt(editPedidos, 10);
    if (isNaN(f) || f < 0 || isNaN(p) || p < 0) { toast.error("Valores invalidos"); return; }
    setSaving(true);
    try {
      const saved = await saveMeta({ mes, meta_faturamento: f, meta_pedidos: p });
      setMeta(saved);
      setEditMode(false);
      toast.success("Metas salvas");
    } catch { toast.error("Erro ao salvar metas"); }
    finally { setSaving(false); }
  }

  function prevMes() {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function nextMes() {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m, 1);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const mesLabel = new Date(mes + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function ProgressBar({ value, done }: { value: number; done: boolean }) {
    return (
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? "bg-green-500" : value >= 70 ? "bg-primary" : value >= 40 ? "bg-amber-500" : "bg-red-400"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Navegacao de mes */}
      <div className="flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3">
        <button onClick={prevMes} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold capitalize text-sm">{mesLabel}</p>
        <button onClick={nextMes} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Carregando...
        </div>
      ) : (
        <>
          {/* Cards de progresso */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Faturamento */}
            <div className="bg-background border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faturamento</p>
                  <p className="text-2xl font-bold mt-1">{fmt(faturamentoReal)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {meta?.meta_faturamento ? `meta: ${fmt(meta.meta_faturamento)}` : "Meta nao definida"}
                  </p>
                </div>
                <span className={`text-sm font-bold shrink-0 mt-1 ${pctFaturamento >= 100 ? "text-green-600" : "text-primary"}`}>
                  {meta?.meta_faturamento ? `${pctFaturamento}%` : "--"}
                </span>
              </div>
              <ProgressBar value={pctFaturamento} done={pctFaturamento >= 100} />
              {pctFaturamento >= 100 && (
                <p className="text-xs font-semibold text-green-600">Meta atingida!</p>
              )}
            </div>

            {/* Pedidos */}
            <div className="bg-background border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pedidos</p>
                  <p className="text-2xl font-bold mt-1">{pedidosReal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {meta?.meta_pedidos ? `meta: ${meta.meta_pedidos} pedidos` : "Meta nao definida"}
                  </p>
                </div>
                <span className={`text-sm font-bold shrink-0 mt-1 ${pctPedidos >= 100 ? "text-green-600" : "text-primary"}`}>
                  {meta?.meta_pedidos ? `${pctPedidos}%` : "--"}
                </span>
              </div>
              <ProgressBar value={pctPedidos} done={pctPedidos >= 100} />
              {pctPedidos >= 100 && (
                <p className="text-xs font-semibold text-green-600">Meta atingida!</p>
              )}
            </div>
          </div>

          {/* Formulario de edicao */}
          {editMode ? (
            <div className="bg-background border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm">Definir metas — <span className="capitalize font-normal text-muted-foreground">{mesLabel}</span></h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Meta de faturamento (R$)</Label>
                  <Input type="number" min="0" value={editFaturamento} onChange={e => setEditFaturamento(e.target.value)} placeholder="Ex: 10000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta de pedidos</Label>
                  <Input type="number" min="0" value={editPedidos} onChange={e => setEditPedidos(e.target.value)} placeholder="Ex: 50" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar metas
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={startEdit} className="gap-1.5">
              <Pencil className="h-4 w-4" />
              {meta ? "Editar metas" : "Definir metas do mes"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Aba Cupons ───────────────────────────────────────────────────────────────
function CuponsTab({ isActive }: { isActive: boolean }) {
  const [cupons,  setCupons]  = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  const [open,        setOpen]        = useState(false);
  const [delId,       setDelId]       = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  // Form
  const [codigo,      setCodigo]      = useState("");
  const [tipo,        setTipo]        = useState<"percentual" | "fixo">("percentual");
  const [valor,       setValor]       = useState("");
  const [minValor,    setMinValor]    = useState("");
  const [validade,    setValidade]    = useState("");
  const [usosLimite,  setUsosLimite]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCupons(await fetchCupons());
      loaded.current = true;
    } catch { toast.error("Erro ao carregar cupons"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) load();
  }, [isActive, load]);

  function resetForm() {
    setCodigo(""); setTipo("percentual"); setValor("");
    setMinValor(""); setValidade(""); setUsosLimite("");
  }

  async function handleCreate() {
    if (!codigo.trim()) { toast.error("Informe o codigo do cupom"); return; }
    const v = parseFloat(valor.replace(",", "."));
    if (isNaN(v) || v <= 0) { toast.error("Valor invalido"); return; }
    setSaving(true);
    try {
      const input: CupomInput = {
        codigo,
        tipo,
        valor: v,
        valor_minimo: minValor ? parseFloat(minValor.replace(",", ".")) : null,
        validade:     validade || null,
        usos_limite:  usosLimite ? parseInt(usosLimite) : null,
        ativo:        true,
      };
      const novo = await createCupom(input);
      setCupons(prev => [novo, ...prev]);
      toast.success("Cupom criado");
      setOpen(false);
      resetForm();
    } catch { toast.error("Erro ao criar cupom"); }
    finally { setSaving(false); }
  }

  async function handleToggle(c: Cupom) {
    await toggleCupomAtivo(c.id, !c.ativo);
    setCupons(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x));
  }

  async function handleDelete() {
    if (!delId) return;
    await deleteCupom(delId);
    setCupons(prev => prev.filter(x => x.id !== delId));
    setDelId(null);
    toast.success("Cupom removido");
  }

  const ativos   = cupons.filter(c => c.ativo).length;
  const totalUsos = cupons.reduce((s, c) => s + c.usos_count, 0);

  return (
    <div className="space-y-4">
      {/* Stats + ações */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-3 flex-1">
          <div className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Ativos: </span>
            <span className="font-bold">{ativos}</span>
          </div>
          <div className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Usos totais: </span>
            <span className="font-bold">{totalUsos}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { loaded.current = false; load(); }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Atualizar
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" />Novo cupom
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Carregando...
          </div>
        ) : cupons.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhum cupom cadastrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead className="hidden sm:table-cell">Pedido min.</TableHead>
                <TableHead className="hidden sm:table-cell">Validade</TableHead>
                <TableHead className="text-center">Usos</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Excluir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="font-mono font-bold text-sm tracking-wider">{c.codigo}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.tipo === "percentual" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {c.tipo === "percentual" ? <BadgePercent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {c.tipo === "percentual" ? `${c.valor}%` : `R$${c.valor.toFixed(2).replace(".",",")}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {c.valor_minimo ? `R$${c.valor_minimo.toFixed(2).replace(".",",")}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {c.validade ? new Date(c.validade + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {c.usos_count}{c.usos_limite ? `/${c.usos_limite}` : ""}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={c.ativo} onCheckedChange={() => handleToggle(c)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={() => setDelId(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog criar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo cupom</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Codigo *</Label>
              <Input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="Ex: FARMA10" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de desconto</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["percentual","fixo"] as const).map(t => (
                  <button key={t} onClick={() => setTipo(t)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      tipo === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                    }`}>
                    {t === "percentual" ? "Porcentagem (%)" : "Valor fixo (R$)"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor do desconto *</Label>
                <Input type="number" min="0" value={valor} onChange={e => setValor(e.target.value)}
                  placeholder={tipo === "percentual" ? "Ex: 10" : "Ex: 50"} />
              </div>
              <div className="space-y-1.5">
                <Label>Pedido minimo (R$)</Label>
                <Input type="number" min="0" value={minValor} onChange={e => setMinValor(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input type="date" value={validade} onChange={e => setValidade(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Limite de usos</Label>
                <Input type="number" min="1" value={usosLimite} onChange={e => setUsosLimite(e.target.value)} placeholder="Ilimitado" />
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar cupom
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!delId} onOpenChange={v => { if (!v) setDelId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Aba Contas a Pagar/Receber ────────────────────────────────────────────────
type ContaFiltro = "todos" | "pagar" | "receber" | "vencidas" | "pagas";

function ContasTab({ isActive }: { isActive: boolean }) {
  const [contas,  setContas]  = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);
  const [filtro, setFiltro]   = useState<ContaFiltro>("todos");
  const [open,   setOpen]     = useState(false);
  const [delId,  setDelId]    = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);

  // Form
  const [desc,      setDesc]      = useState("");
  const [valor,     setValor]     = useState("");
  const [tipo,      setTipo]      = useState<ContaTipo>("pagar");
  const [venc,      setVenc]      = useState("");
  const [categ,     setCateg]     = useState("");
  const [obs,       setObs]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContas(await fetchContas());
      loaded.current = true;
    } catch { toast.error("Erro ao carregar contas"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive && !loaded.current) load();
  }, [isActive, load]);

  function resetForm() {
    setDesc(""); setValor(""); setTipo("pagar");
    setVenc(""); setCateg(""); setObs("");
  }

  async function handleCreate() {
    if (!desc.trim() || !valor || !venc || !categ) { toast.error("Preencha todos os campos obrigatorios"); return; }
    const v = parseFloat(valor.replace(",", "."));
    if (isNaN(v) || v <= 0) { toast.error("Valor invalido"); return; }
    setSaving(true);
    try {
      const input: ContaInput = { descricao: desc, valor: v, tipo, vencimento: venc, categoria: categ, observacao: obs };
      const nova = await createConta(input);
      setContas(prev => [...prev, nova].sort((a, b) => a.vencimento.localeCompare(b.vencimento)));
      toast.success("Conta adicionada");
      setOpen(false);
      resetForm();
    } catch { toast.error("Erro ao criar conta"); }
    finally { setSaving(false); }
  }

  async function handleTogglePago(c: Conta) {
    const newStatus = c.status === "pago" ? "pendente" : "pago";
    await updateContaStatus(c.id, newStatus);
    const today = new Date().toISOString().split("T")[0];
    setContas(prev => prev.map(x => x.id === c.id
      ? { ...x, status: newStatus === "pendente" && x.vencimento < today ? "vencido" : newStatus }
      : x
    ));
    toast.success(newStatus === "pago" ? "Marcado como pago" : "Marcado como pendente");
  }

  async function handleDelete() {
    if (!delId) return;
    await deleteConta(delId);
    setContas(prev => prev.filter(x => x.id !== delId));
    setDelId(null);
    toast.success("Conta removida");
  }

  const filtered = contas.filter(c => {
    if (filtro === "pagar")    return c.tipo === "pagar"   && c.status !== "pago";
    if (filtro === "receber")  return c.tipo === "receber" && c.status !== "pago";
    if (filtro === "vencidas") return c.status === "vencido";
    if (filtro === "pagas")    return c.status === "pago";
    return true;
  });

  const totalPagar    = contas.filter(c => c.tipo === "pagar"   && c.status !== "pago").reduce((s, c) => s + Number(c.valor), 0);
  const totalReceber  = contas.filter(c => c.tipo === "receber" && c.status !== "pago").reduce((s, c) => s + Number(c.valor), 0);
  const totalVencidas = contas.filter(c => c.status === "vencido").length;
  const saldo         = totalReceber - totalPagar;

  const STATUS_BADGE: Record<string, string> = {
    pendente: "bg-amber-100 text-amber-700",
    pago:     "bg-green-100 text-green-700",
    vencido:  "bg-red-100 text-red-700",
  };
  const STATUS_LABEL_C: Record<string, string> = { pendente: "Pendente", pago: "Pago", vencido: "Vencida" };

  const FILTROS: { key: ContaFiltro; label: string }[] = [
    { key: "todos",    label: "Todas"    },
    { key: "pagar",    label: "A pagar"  },
    { key: "receber",  label: "A receber"},
    { key: "vencidas", label: "Vencidas" },
    { key: "pagas",    label: "Pagas"    },
  ];

  const CATS = tipo === "pagar" ? CATEGORIAS_PAGAR : CATEGORIAS_RECEBER;

  return (
    <div className="space-y-4">
      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "A pagar",  value: fmt(totalPagar),   color: "text-red-600",   bg: "bg-red-50",    icon: TrendingDown  },
          { label: "A receber",value: fmt(totalReceber), color: "text-green-600", bg: "bg-green-50",  icon: TrendingUp    },
          { label: "Vencidas", value: String(totalVencidas), color: totalVencidas > 0 ? "text-red-600" : "text-gray-400", bg: totalVencidas > 0 ? "bg-red-50" : "bg-gray-50", icon: CalendarClock },
          { label: "Saldo prev.",value: fmt(saldo),      color: saldo >= 0 ? "text-green-600" : "text-red-600", bg: saldo >= 0 ? "bg-green-50" : "bg-red-50", icon: BarChart2 },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-background border border-border rounded-xl p-4">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${m.bg} mb-2`}>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-lg font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros + Nova conta */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {FILTROS.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}>
              {f.label}
              {f.key === "vencidas" && totalVencidas > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full">{totalVencidas}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { loaded.current = false; load(); }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" />Nova conta
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma conta encontrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descricao</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.tipo === "pagar" ? "bg-red-500" : "bg-green-500"}`} />
                      <div>
                        <p className="font-medium text-sm">{c.descricao}</p>
                        <p className="text-xs text-muted-foreground">{c.tipo === "pagar" ? "A pagar" : "A receber"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{c.categoria}</TableCell>
                  <TableCell>
                    <span className={`font-semibold text-sm ${c.tipo === "pagar" ? "text-red-600" : "text-green-600"}`}>
                      {c.tipo === "pagar" ? "-" : "+"}{fmt(Number(c.valor))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(c.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>
                      {STATUS_LABEL_C[c.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleTogglePago(c)}
                        title={c.status === "pago" ? "Marcar como pendente" : "Marcar como pago"}>
                        {c.status === "pago"
                          ? <Ban className="h-4 w-4 text-muted-foreground" />
                          : <BadgeCheck className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        onClick={() => setDelId(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog nova conta */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova conta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["pagar","receber"] as const).map(t => (
                  <button key={t} onClick={() => { setTipo(t); setCateg(""); }}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      tipo === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                    }`}>
                    {t === "pagar" ? "Conta a pagar" : "Conta a receber"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descricao *</Label>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Aluguel de março" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" min="0" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento *</Label>
                <Input type="date" value={venc} onChange={e => setVenc(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <select value={categ} onChange={e => setCateg(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Selecione...</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Observacao</Label>
              <Input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Adicionar conta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={v => { if (!v) setDelId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Aba Comissoes ────────────────────────────────────────────────────────────
function ComissoesTab({ isActive }: { isActive: boolean }) {
  const now = new Date();
  const [mes, setMes]       = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(false);
  // Inline edit de comissao_pct
  const [editPct, setEditPct] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cols, ords] = await Promise.all([fetchColaboradores(), fetchAllOrders()]);
      setColaboradores(cols);
      setOrders(ords);
    } catch { toast.error("Erro ao carregar comissoes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isActive) load();
  }, [isActive, load]);

  const ordersDoMes = useMemo(() => {
    const [year, month] = mes.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);
    return orders.filter(o => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });
  }, [orders, mes]);

  // Computa vendas por colaborador
  const stats = useMemo(() => {
    return colaboradores.map(col => {
      const vendas = ordersDoMes.filter(o => o.vendedor_nome === col.nome);
      const totalVendido = vendas.reduce((s, o) => s + Number(o.total), 0);
      const pct = col.comissao_pct ?? 0;
      return {
        colaborador: col,
        pedidos: vendas.length,
        totalVendido,
        comissaoPct: pct,
        valorComissao: totalVendido * (pct / 100),
      };
    }).sort((a, b) => b.totalVendido - a.totalVendido);
  }, [colaboradores, ordersDoMes]);

  const totalComissoes = stats.reduce((s, r) => s + r.valorComissao, 0);

  async function handleSavePct(col: Colaborador) {
    const raw = editPct[col.id];
    if (raw === undefined) return;
    const pct = parseFloat(raw.replace(",", "."));
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error("Percentual invalido (0-100)"); return; }
    setSavingId(col.id);
    try {
      await restPatch("colaboradores", { column: "id", value: col.id }, { comissao_pct: pct });
      setColaboradores(prev => prev.map(c => c.id === col.id ? { ...c, comissao_pct: pct } : c));
      setEditPct(prev => { const n = { ...prev }; delete n[col.id]; return n; });
      toast.success("Comissao atualizada");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSavingId(null); }
  }

  function prevMes() {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function nextMes() {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m, 1);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const mesLabel = new Date(mes + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Mes + total */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-background border border-border rounded-xl px-3 py-2">
          <button onClick={prevMes} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-sm capitalize px-2">{mesLabel}</span>
          <button onClick={nextMes} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">Total de comissoes:</span>
          <span className="font-bold">{fmt(totalComissoes)}</span>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-1.5 ml-auto">
          <RefreshCw className="h-3.5 w-3.5" />Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Carregando...
          </div>
        ) : colaboradores.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum colaborador cadastrado. Adicione colaboradores primeiro.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-center">Pedidos</TableHead>
                <TableHead className="text-right">Total vendido</TableHead>
                <TableHead className="text-center">Comissao %</TableHead>
                <TableHead className="text-right">Valor comissao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map(({ colaborador: col, pedidos, totalVendido, comissaoPct, valorComissao }) => {
                const isEditing  = editPct[col.id] !== undefined;
                const isSaving   = savingId === col.id;
                return (
                  <TableRow key={col.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{col.nome}</p>
                      <p className="text-xs text-muted-foreground">{col.ativo ? "Ativo" : "Inativo"}</p>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{pedidos}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{fmt(totalVendido)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={isEditing ? editPct[col.id] : comissaoPct}
                          onChange={e => setEditPct(prev => ({ ...prev, [col.id]: e.target.value }))}
                          className="w-16 text-center text-sm border border-input rounded-md px-2 py-1 bg-background"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                        {isEditing && (
                          <Button size="sm" className="h-7 px-2" onClick={() => handleSavePct(col)} disabled={isSaving}>
                            {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold text-sm ${valorComissao > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {fmt(valorComissao)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Altere o % de comissao diretamente na tabela. O valor e calculado sobre o total vendido no mes.
      </p>
    </div>
  );
}

// ─── Grupos de navegação da sidebar ──────────────────────────────────────────
interface NavEntry { id: string; label: string; icon: LucideIcon }
interface NavGroup { label: string; items: NavEntry[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: "GERAL",
    items: [
      { id: "dashboard", label: "Dashboard",   icon: BarChart2   },
      { id: "pedidos",   label: "Pedidos",     icon: ShoppingBag },
    ],
  },
  {
    label: "ATENDIMENTO",
    items: [
      { id: "pdv",      label: "Nova Venda",  icon: ShoppingCart },
      { id: "clientes", label: "Clientes",    icon: Users        },
    ],
  },
  {
    label: "FINANCEIRO",
    items: [
      { id: "fluxo-caixa",   label: "Fluxo de Caixa", icon: Wallet        },
      { id: "contas",        label: "Contas",          icon: CreditCard    },
      { id: "metas",         label: "Metas",           icon: Target        },
      { id: "relatorios",    label: "Relatorios",      icon: FileBarChart2 },
      { id: "comissoes",     label: "Comissoes",       icon: Award         },
      { id: "colaboradores", label: "Colaboradores",   icon: Users         },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { id: "cupons", label: "Cupons", icon: Tag },
    ],
  },
  {
    label: "CATÁLOGO",
    items: [
      { id: "estoque",  label: "Estoque",      icon: Boxes      },
      { id: "produtos", label: "Produtos",     icon: Package    },
      { id: "secoes",   label: "Secoes",       icon: LayoutList },
      { id: "banners",  label: "Banners",      icon: ImageIcon  },
    ],
  },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Visão geral",           sub: "Resumo de desempenho da loja." },
  pedidos:   { title: "Gerenciar pedidos",      sub: "Visualize, filtre e atualize o status de cada pedido." },
  pdv:       { title: "Nova Venda — PDV",       sub: "Registre vendas presenciais rapidamente." },
  clientes:       { title: "Clientes",               sub: "Clientes cadastrados na plataforma." },
  "fluxo-caixa":   { title: "Fluxo de Caixa",   sub: "Registre entradas e saidas e acompanhe o saldo." },
  colaboradores:   { title: "Colaboradores",    sub: "Gerencie a equipe da farmacia." },
  estoque:         { title: "Estoque",          sub: "Controle as quantidades de produtos e receba alertas de reposicao." },
  metas:           { title: "Metas do mes",     sub: "Defina metas de faturamento e pedidos e acompanhe o progresso." },
  relatorios:      { title: "Relatorios",       sub: "Analise vendas, produtos e colaboradores por periodo." },
  cupons:          { title: "Cupons de desconto", sub: "Crie e gerencie codigos promocionais para seus clientes." },
  contas:          { title: "Contas a pagar/receber", sub: "Controle seus compromissos financeiros e recebimentos." },
  comissoes:       { title: "Comissoes",         sub: "Calcule automaticamente as comissoes dos colaboradores por mes." },
  produtos:  { title: "Produtos",               sub: "Gerencie o catalogo de produtos." },
  secoes:    { title: "Secoes do carrossel",    sub: "Crie, renomeie e reordene secoes da pagina inicial." },
  banners:   { title: "Banners",                sub: "Imagens do carrossel principal (1200 x 400 px)." },
};

// ─── Dashboard principal ──────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab,    setActiveTab]    = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const heading = PAGE_TITLES[activeTab] ?? { title: activeTab, sub: "" };

  /* Sidebar content (shared entre desktop e mobile overlay) */
  function SidebarNav() {
    return (
      <nav className="p-3 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon     = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-background border-b border-border sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3">
            {/* Hamburger — apenas mobile */}
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <Heart className="h-6 w-6 text-primary" fill="currentColor" />
              <span className="text-lg font-extrabold text-primary tracking-tight">RB FARMA</span>
              <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">Admin</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("/", "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver loja</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar desktop ─────────────────────────────────────────── */}
        <aside className="hidden lg:block w-52 shrink-0 bg-background border-r border-border sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto">
          <SidebarNav />
        </aside>

        {/* ── Sidebar mobile overlay ──────────────────────────────────── */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-[57px] bottom-0 w-52 bg-background border-r border-border z-40 overflow-y-auto lg:hidden">
              <SidebarNav />
            </aside>
          </>
        )}

        {/* ── Conteúdo principal ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden">

          {/* Cabeçalho da página */}
          <div className="mb-6">
            <h2 className="text-xl font-bold">{heading.title}</h2>
            <p className="text-sm text-muted-foreground">{heading.sub}</p>
          </div>

          {activeTab === "dashboard" && <DashboardTab   isActive={activeTab === "dashboard"} />}
          {activeTab === "pedidos"   && <AdminOrdersTab isActive={activeTab === "pedidos"}   />}
          {activeTab === "pdv"       && <PDVTab         isActive={activeTab === "pdv"}       />}
          {activeTab === "clientes"  && <ClientesTab    isActive={activeTab === "clientes"}  />}
          {activeTab === "produtos"  && <ProductsTab    isActive={activeTab === "produtos"}  />}
          {activeTab === "secoes"    && <SectionsTab    isActive={activeTab === "secoes"}    />}
          {activeTab === "banners"      && <BannersTab      isActive={activeTab === "banners"}      />}
          {activeTab === "fluxo-caixa"   && <FluxoCaixaTab     isActive={activeTab === "fluxo-caixa"}   />}
          {activeTab === "colaboradores" && <ColaboradoresTab  isActive={activeTab === "colaboradores"} />}
          {activeTab === "estoque"       && <EstoqueTab        isActive={activeTab === "estoque"}       />}
          {activeTab === "relatorios"    && <RelatoriosTab     isActive={activeTab === "relatorios"}    />}
          {activeTab === "metas"         && <MetasTab          isActive={activeTab === "metas"}         />}
          {activeTab === "cupons"        && <CuponsTab         isActive={activeTab === "cupons"}        />}
          {activeTab === "contas"        && <ContasTab         isActive={activeTab === "contas"}        />}
          {activeTab === "comissoes"     && <ComissoesTab      isActive={activeTab === "comissoes"}     />}
        </main>
      </div>
    </div>
  );
}

// ─── Pagina principal ─────────────────────────────────────────────────────────
export default function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-muted-foreground text-sm">Carregando...</div>
    </div>
  );

  if (!session) return <LoginForm />;
  return <AdminDashboard />;
}
