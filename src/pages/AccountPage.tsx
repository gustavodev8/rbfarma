import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, User, ShoppingBag, LogOut, CheckCircle2,
  Package, Loader2, AlertCircle, ChevronDown, ChevronUp, Edit3, Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserOrders, STATUS_LABEL, STATUS_COLOR } from "@/services/ordersService";
import Header from "@/components/Header";
import type { Order } from "@/services/ordersService";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/* ── Abas ─────────────────────────────────────────────────────── */
type Tab = "profile" | "orders";

/* ── Tab: Dados pessoais ─────────────────────────────────────── */
function ProfileTab() {
  const { user, profile, updateProfile } = useAuth();
  const [name,      setName]      = useState(profile?.name  ?? "");
  const [cpf,       setCpf]       = useState(profile?.cpf   ?? "");
  const [phone,     setPhone]     = useState(profile?.phone ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? "");
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (profile?.name)       setName(profile.name);
    if (profile?.cpf)        setCpf(profile.cpf);
    if (profile?.phone)      setPhone(profile.phone);
    if (profile?.birth_date) setBirthDate(profile.birth_date);
  }, [profile]);

  async function handleSave() {
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true);
    setError("");
    const res = await updateProfile({ name, cpf, phone, birth_date: birthDate });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#e8001c] focus:ring-1 focus:ring-[#e8001c]/20 transition-colors";

  return (
    <div className="space-y-5">
      {/* Avatar / nome */}
      <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
        <div className="w-14 h-14 rounded-full bg-[#e8001c] flex items-center justify-center text-white text-xl font-bold shrink-0">
          {name.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{name || "Usuário"}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Nome completo *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">E-mail</label>
          <input value={user?.email ?? ""} disabled className={inputCls + " bg-gray-50 cursor-not-allowed text-gray-400"} />
          <p className="text-[11px] text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">CPF</label>
          <input value={cpf} onChange={e=>setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Telefone</label>
          <input value={phone} onChange={e=>setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Data de nascimento</label>
          <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />Dados atualizados com sucesso!
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-[#e8001c] hover:bg-[#c4001a] text-white font-bold px-6 py-2.5 rounded-full transition-colors text-sm disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

/* ── Card de pedido ──────────────────────────────────────────── */
function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);

  const paymentLabel: Record<string, string> = {
    pix:    "PIX",
    credit: "Cartão de crédito",
    boleto: "Boleto bancário",
  };

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Cabeçalho */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-800">{order.order_number}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {fmtDate(order.created_at)} · {order.order_items?.length ?? 0} {order.order_items?.length === 1 ? "produto" : "produtos"} ·{" "}
            {paymentLabel[order.payment_method]}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-extrabold text-gray-800">{fmt(order.total)}</p>
          <p className="text-xs text-gray-400">{order.payment_method === "credit" && order.payment_installments > 1
            ? `${order.payment_installments}× ${fmt(order.total / order.payment_installments)}`
            : "À vista"}</p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {/* Detalhes */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {/* Itens */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Itens do pedido</p>
            <ul className="space-y-2">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 shrink-0 overflow-hidden">
                    <img src={item.product_image} alt={item.product_name}
                      className="w-full h-full object-contain p-0.5"
                      onError={e=>{(e.target as HTMLImageElement).src="/placeholder.svg"}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-medium line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{item.product_brand} · {item.product_quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 shrink-0">
                    {item.quantity}× {fmt(item.unit_price)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Entrega */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Entrega</p>
            <p className="text-sm text-gray-600">
              {order.shipping_address}, {order.shipping_number}
              {order.shipping_complement ? `, ${order.shipping_complement}` : ""} —{" "}
              {order.shipping_neighborhood ? `${order.shipping_neighborhood}, ` : ""}
              {order.shipping_city}/{order.shipping_state} — CEP {order.shipping_cep}
            </p>
          </div>

          {/* Valores */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Desconto</span><span>-{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-green-600">
              <span>Frete</span><span>Grátis</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-gray-100">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Pedidos ────────────────────────────────────────────── */
function OrdersTab() {
  const { user } = useAuth();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchUserOrders(user.id).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-[#e8001c] animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-base font-semibold text-gray-600">Nenhum pedido encontrado</p>
        <p className="text-sm text-gray-400">Quando você fizer um pedido, ele aparecerá aqui.</p>
        <Link
          to="/"
          className="mt-2 bg-[#e8001c] hover:bg-[#c4001a] text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
        >
          Ir às compras
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ACCOUNT PAGE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function AccountPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const navigate = useNavigate();

  // Redireciona para login se não logado
  useEffect(() => {
    if (!loading && !user) {
      navigate("/entrar", { state: { from: "/minha-conta" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#e8001c] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-[#e8001c] transition-colors">Página inicial</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-700 font-medium">Minha conta</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Minha conta</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Olá, <span className="font-semibold text-gray-700">{profile?.name?.split(" ")[0] || "usuário"}</span>! 👋
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e8001c] border border-gray-200 hover:border-[#e8001c] px-4 py-2 rounded-full transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start">

          {/* ── Sidebar de navegação ──────────────────────────────── */}
          <div className="w-full sm:w-48 shrink-0">
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {[
                { key: "profile" as Tab, icon: User,        label: "Dados pessoais" },
                { key: "orders"  as Tab, icon: ShoppingBag, label: "Meus pedidos"   },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left
                    border-l-2 ${tab === key
                      ? "border-[#e8001c] bg-red-50 text-[#e8001c]"
                      : "border-transparent text-gray-600 hover:bg-gray-50"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Conteúdo da aba ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {tab === "profile" ? <ProfileTab /> : <OrdersTab />}
          </div>

        </div>
      </div>
    </div>
  );
}
