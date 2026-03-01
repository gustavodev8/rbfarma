import { useEffect, useState, useCallback, useRef } from "react";
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
import AdminProductForm from "@/components/AdminProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Image as ImageIcon, Download, Package,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

// ─── Tipo produto admin ───────────────────────────────────────────────────────
interface AdminProduct {
  id: string; name: string; brand: string; quantity: string;
  price: number; originalPrice: number; discount: number;
  image: string; category: string; sections: string[]; isActive: boolean;
  stock: number | null;
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

// ─── Skeleton linha ───────────────────────────────────────────────────────────
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
      console.error("[Admin] fetchAllProducts:", err);
      setLoadError(msg);
      toast.error(msg);
    }
    finally { setLoading(false); }
  }, []);

  // Só carrega quando a aba fica ativa pela primeira vez
  useEffect(() => {
    if (isActive && !loaded.current) loadProducts();
  }, [isActive, loadProducts]);

  async function handleToggleActive(p: AdminProduct) {
    try {
      await toggleProductActive(p.id, !p.isActive);
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
      toast.success(!p.isActive ? "Produto ativado" : "Produto desativado");
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success("Produto excluído");
    } catch { toast.error("Erro ao excluir produto"); }
    finally { setDeleteTarget(undefined); }
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto, marca..."
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
        </p>

        <Button
          onClick={() => { setEditingProduct(undefined); setDialogOpen(true); }}
          className="gap-1.5 ml-auto"
        >
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
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <img src={p.image || "/placeholder.svg"} alt={p.name}
                      className="w-12 h-12 object-contain rounded-lg bg-secondary"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
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
                        : p.sections.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
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

      {/* Dialog criar / editar */}
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

      {/* Confirmar exclusão */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(undefined)}>
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
      setSections((prev) => [...prev, created]);
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
      setSections((prev) => prev.map((s) => s.id === id ? updated : s));
      setEditingId(null);
      toast.success("Seção renomeada!");
    } catch { toast.error("Erro ao renomear"); }
  }

  async function handleToggle(section: Section) {
    try {
      await toggleSectionActive(section.id, !section.isActive);
      setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, isActive: !section.isActive } : s));
      toast.success(!section.isActive ? "Seção ativada" : "Seção desativada");
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSection(deleteTarget.id);
      setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
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
      await reorderSections(reordered.map((s) => ({ id: s.id, displayOrder: s.displayOrder })));
    } catch { toast.error("Erro ao reordenar"); loadSections(); }
  }

  return (
    <>
      {/* Adicionar nova seção */}
      <div className="flex gap-2 mb-6">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova seção..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" /> {adding ? "Criando..." : "Criar seção"}
        </Button>
      </div>

      {loading ? (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <Table>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
            </TableBody>
          </Table>
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
                  {/* Botões de ordem */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => move(index, "up")}
                        disabled={index === 0}
                        className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => move(index, "down")}
                        disabled={index === sections.length - 1}
                        className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Nome — editável inline */}
                  <TableCell>
                    {editingId === section.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(section.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="h-8 max-w-xs"
                        />
                        <Button size="sm" onClick={() => handleRename(section.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>✕</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{section.name}</span>
                        {!section.isActive && (
                          <Badge variant="secondary" className="text-xs">inativa</Badge>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Toggle visível */}
                  <TableCell>
                    <Switch
                      checked={section.isActive}
                      onCheckedChange={() => handleToggle(section)}
                    />
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setEditingId(section.id); setEditingName(section.name); }}
                        title="Renomear"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setDeleteTarget(section)}
                        className="text-destructive hover:text-destructive"
                        title="Excluir"
                      >
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

      {/* Confirmar exclusão */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(undefined)}>
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

    // Valida resolução exata 1200×400
    const { ok, w, h } = await validateBannerResolution(file);
    if (!ok) {
      setUploadError(
        `Resolução inválida: ${w}×${h}px. O banner deve ter exatamente 1200×400px.`
      );
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
      setBanners((prev) =>
        prev.map((b) => b.id === banner.id ? { ...b, isActive: !banner.isActive } : b)
      );
      toast.success(!banner.isActive ? "Banner ativado" : "Banner desativado");
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.id, deleteTarget.fileName);
      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
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
      await reorderBanners(reordered.map((b) => ({ id: b.id, displayOrder: b.displayOrder })));
    } catch { toast.error("Erro ao reordenar"); loadBanners(); }
  }

  return (
    <>
      {/* ── Upload ───────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-base font-semibold mb-1">Enviar novo banner</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Resolução obrigatória: <strong>1200 × 400 px</strong> · Formatos: PNG, JPG ou WebP
        </p>

        <label
          className={`inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-lg border-2 border-dashed transition-colors select-none ${
            uploading
              ? "border-primary/40 bg-primary/5 pointer-events-none text-muted-foreground"
              : "border-border hover:border-primary hover:bg-primary/5 text-foreground"
          }`}
        >
          <ImageIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">
            {uploading ? "Enviando…" : "Selecionar imagem"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {uploadError && (
          <div className="mt-3 flex items-start gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm max-w-md">
            <X className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* ── Lista de banners ─────────────────────────────────────────────────── */}
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
        <div className="p-8 text-center text-muted-foreground">
          Nenhum banner cadastrado. Envie o primeiro acima.
        </div>
      ) : (
        <div className="grid gap-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-background rounded-xl border border-border flex items-center gap-4 p-3 transition-opacity ${
                !banner.isActive ? "opacity-50" : ""
              }`}
            >
              {/* Reordenar */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => move(index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(index, "down")}
                  disabled={index === banners.length - 1}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="shrink-0 w-40 h-[53px] rounded-lg overflow-hidden bg-secondary">
                <img
                  src={banner.url}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{banner.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Posição {banner.displayOrder + 1}
                  {!banner.isActive && (
                    <Badge variant="secondary" className="text-xs ml-2">Inativo</Badge>
                  )}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {banner.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={banner.isActive}
                    onCheckedChange={() => handleToggleActive(banner)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  title="Exportar / Baixar"
                  onClick={() => handleExport(banner)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Excluir"
                  onClick={() => setDeleteTarget(banner)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmar exclusão */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo <strong>{deleteTarget?.fileName}</strong> será removido permanentemente
              do storage e do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("produtos");

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="text-lg font-extrabold text-primary tracking-tight">RB FARMA</span>
            <Badge variant="secondary" className="ml-1">Painel Admin</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="gap-1.5">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="produtos" className="gap-1.5">
              <LayoutList className="h-4 w-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="secoes" className="gap-1.5">
              <LayoutList className="h-4 w-4" /> Seções
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-1.5">
              <ImageIcon className="h-4 w-4" /> Banners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos">
            <ProductsTab isActive={activeTab === "produtos"} />
          </TabsContent>

          <TabsContent value="secoes">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Seções do carrossel</h2>
              <p className="text-sm text-muted-foreground">
                Crie, renomeie, reordene e ative/desative as seções exibidas na página inicial.
              </p>
            </div>
            <SectionsTab isActive={activeTab === "secoes"} />
          </TabsContent>

          <TabsContent value="banners">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Banners do carrossel principal</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie as imagens exibidas no banner da página inicial. Cada imagem deve ter
                exatamente <strong>1200 × 400 px</strong>.
              </p>
            </div>
            <BannersTab isActive={activeTab === "banners"} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
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
