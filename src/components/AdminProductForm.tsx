import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/services/productsService";
import { useActiveSections } from "@/hooks/useSections";
import type { ProductCategory } from "@/types";

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "medicamentos",    label: "Medicamentos"        },
  { value: "vitaminas",       label: "Vitaminas"           },
  { value: "skincare",        label: "Cuidados com a Pele" },
  { value: "dermocosmeticos", label: "Dermocosméticos"     },
  { value: "higiene",         label: "Higiene Pessoal"     },
  { value: "beleza",          label: "Beleza"              },
  { value: "suplementos",     label: "Suplementos"         },
  { value: "perfumes",        label: "Perfumes"            },
  { value: "manipulados",     label: "Manipulados"         },
];

// ─── Schema de validação ──────────────────────────────────────────────────────
const schema = z.object({
  name:          z.string().min(2, "Nome obrigatório"),
  brand:         z.string().min(1, "Marca obrigatória"),
  quantity:      z.string().min(1, "Quantidade obrigatória"),
  price:         z.coerce.number().positive("Preço deve ser positivo"),
  originalPrice: z.coerce.number().positive("Preço original deve ser positivo"),
  category:      z.string().min(1, "Categoria obrigatória"),
  sections:      z.array(z.string()).min(1, "Selecione ao menos uma seção"),
  isActive:      z.boolean(),
  /** null = sem controle de estoque; número = quantidade disponível */
  stock:         z.union([z.coerce.number().int().min(0, "Mínimo 0"), z.literal(null)]),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AdminProductFormProps {
  /** Produto em edição (undefined = novo) */
  product?: {
    id:            string;
    name:          string;
    brand:         string;
    quantity:      string;
    price:         number;
    originalPrice: number;
    discount:      number;
    image:         string;
    category:      string;
    sections:      string[];
    isActive:      boolean;
    stock:         number | null;
  };
  onSuccess: () => void;
  onCancel:  () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function AdminProductForm({
  product,
  onSuccess,
  onCancel,
}: AdminProductFormProps) {
  const isEditing  = Boolean(product);
  const fileRef    = useRef<HTMLInputElement>(null);
  const allSections = useActiveSections(); // seções vindas do Supabase

  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imageUrl,       setImageUrl]       = useState<string>(product?.image ?? "");
  const [imagePreview,   setImagePreview]   = useState<string>(product?.image ?? "");
  const [stockEnabled,   setStockEnabled]   = useState<boolean>(product?.stock !== null && product?.stock !== undefined);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:          product?.name          ?? "",
      brand:         product?.brand         ?? "",
      quantity:      product?.quantity      ?? "1 un",
      price:         product?.price         ?? 0,
      originalPrice: product?.originalPrice ?? 0,
      category:      product?.category      ?? "medicamentos",
      sections:      product?.sections      ?? [],
      isActive:      product?.isActive      ?? true,
      stock:         product?.stock         ?? null,
    },
  });

  // Calcula desconto automaticamente
  const priceVal    = watch("price");
  const origPrice   = watch("originalPrice");
  const autoDiscount =
    origPrice > 0 && priceVal < origPrice
      ? Math.round(((origPrice - priceVal) / origPrice) * 100)
      : 0;

  // Atualiza preview quando o usuário digita/cola uma URL
  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value;
    setImageUrl(url);
    if (!imageFile) setImagePreview(url); // só usa URL se não tiver arquivo
  }

  // Preview de imagem ao selecionar arquivo (sobrepõe a URL)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Remove o arquivo selecionado e volta a usar a URL
  function handleRemoveFile() {
    setImageFile(null);
    setImagePreview(imageUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Submit
  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        name:          values.name,
        brand:         values.brand,
        quantity:      values.quantity,
        price:         values.price,
        originalPrice: values.originalPrice,
        discount:      autoDiscount,
        imageUrl:      imageFile ? imagePreview : imageUrl,
        category:      values.category as ProductCategory,
        sections:      values.sections,
        isActive:      values.isActive,
        stock:         stockEnabled ? (values.stock ?? 0) : null,
      };

      if (isEditing && product) {
        await updateProduct(product.id, input, imageFile ?? undefined);
      } else {
        await createProduct(input, imageFile ?? undefined);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nome */}
      <div className="space-y-1">
        <Label htmlFor="name">Nome do produto *</Label>
        <Input id="name" {...register("name")} placeholder="Ex: Dipirona 500mg" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Marca */}
      <div className="space-y-1">
        <Label htmlFor="brand">Marca *</Label>
        <Input id="brand" {...register("brand")} placeholder="Ex: Medley" />
        {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
      </div>

      {/* Quantidade */}
      <div className="space-y-1">
        <Label htmlFor="quantity">Quantidade / Apresentação *</Label>
        <Input id="quantity" {...register("quantity")} placeholder="Ex: 20 comprimidos" />
        {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
      </div>

      {/* Preços */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="originalPrice">Preço original (R$) *</Label>
          <Input
            id="originalPrice"
            type="number"
            step="0.01"
            {...register("originalPrice")}
            placeholder="0.00"
          />
          {errors.originalPrice && (
            <p className="text-xs text-destructive">{errors.originalPrice.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="price">Preço com desconto (R$) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price")}
            placeholder="0.00"
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
      </div>

      {autoDiscount > 0 && (
        <p className="text-sm text-green-600 font-medium">
          Desconto calculado: {autoDiscount}%
        </p>
      )}

      {/* Categoria */}
      <div className="space-y-1">
        <Label>Categoria *</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Seções */}
      <div className="space-y-2">
        <Label>Seções do carrossel * <span className="text-xs text-muted-foreground">(selecione ao menos uma)</span></Label>
        <Controller
          control={control}
          name="sections"
          render={({ field }) => (
            <div className="space-y-2">
              {allSections.map((sec) => {
                const checked = field.value.includes(sec.name);
                return (
                  <div key={sec.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`section-${sec.id}`}
                      checked={checked}
                      onCheckedChange={(v) => {
                        if (v) {
                          field.onChange([...field.value, sec.name]);
                        } else {
                          field.onChange(field.value.filter((s) => s !== sec.name));
                        }
                      }}
                    />
                    <label
                      htmlFor={`section-${sec.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {sec.name}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        />
        {errors.sections && (
          <p className="text-xs text-destructive">{errors.sections.message}</p>
        )}
      </div>

      {/* Imagem */}
      <div className="space-y-2">
        <Label>Foto do produto</Label>

        {/* Preview */}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-24 h-24 object-contain rounded-lg border border-border bg-secondary"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
        )}

        {/* URL */}
        <div className="space-y-1">
          <Label htmlFor="imageUrl" className="text-xs text-muted-foreground">
            Cole o link da imagem
          </Label>
          <Input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="https://exemplo.com/foto-produto.jpg"
            disabled={Boolean(imageFile)}
          />
        </div>

        {/* Separador */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          ou
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Upload de arquivo */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            {imageFile ? "Trocar arquivo" : "Selecionar arquivo"}
          </Button>
          {imageFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-destructive hover:text-destructive text-xs"
            >
              ✕ Remover arquivo
            </Button>
          )}
          {imageFile && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {imageFile.name}
            </span>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Estoque ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="stockEnabled"
            checked={stockEnabled}
            onCheckedChange={(v) => {
              const on = Boolean(v);
              setStockEnabled(on);
              if (!on) setValue("stock", null);
              else setValue("stock", 0);
            }}
          />
          <Label htmlFor="stockEnabled" className="cursor-pointer font-medium">
            Controlar estoque deste produto
          </Label>
        </div>

        {stockEnabled && (
          <div className="space-y-1 pl-6">
            <Label htmlFor="stock">Quantidade em estoque</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              step={1}
              {...register("stock")}
              placeholder="0"
              className="max-w-[160px]"
            />
            {errors.stock && (
              <p className="text-xs text-destructive">{errors.stock.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              0 = sem estoque · 1–5 = "Últimas unidades" · acima de 5 = em estoque
            </p>
          </div>
        )}

        {!stockEnabled && (
          <p className="text-xs text-muted-foreground pl-6">
            Sem controle — o produto sempre aparecerá como disponível.
          </p>
        )}
      </div>

      {/* Ativo */}
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Checkbox
              id="isActive"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(Boolean(v))}
            />
          )}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Produto ativo (visível no site)
        </Label>
      </div>

      {/* Erro global */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Ações */}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}
