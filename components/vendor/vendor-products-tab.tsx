"use client";

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Boxes, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { TogglePill } from "@/components/ui/toggle-pill";
import { cn } from "@/libs/cn";
import { discountPercent, formatDate } from "@/libs/format";
import {
  useCreateVendorProduct,
  useDeleteVendorProduct,
  useSaveVendorProduct,
  useVendorProducts,
} from "@/hooks/use-vendor";
import type { VendorProduct, VendorProductStatus } from "@/types/vendor";

const STATUS_FILTERS: { value: VendorProductStatus | "all" | "out_of_stock"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" },
];

const PAGE_SIZE = 6;

type DraftProduct = {
  name: string;
  description: string;
  category: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  status: VendorProductStatus;
  images: File[];
};

const EMPTY_DRAFT: DraftProduct = {
  name: "",
  description: "",
  category: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  status: "active",
  images: [],
};

function toDraft(product: VendorProduct): DraftProduct {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice !== null ? String(product.compareAtPrice) : "",
    stock: String(product.stock),
    status: product.status,
    images: [],
  };
}

/** Prices are integers end to end: the backend parses them with a bare `int()`, which raises on "85.50". */
const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

function stockBadge(stock: number): { tone: BadgeTone; label: string } {
  if (stock <= 0) return { tone: "danger", label: "Out of stock" };
  if (stock <= 10) return { tone: "warning", label: `Low stock · ${stock}` };
  return { tone: "neutral", label: `${stock} in stock` };
}

function ProductForm({
  draft,
  onChange,
  onSubmit,
  pending,
  submitLabel,
}: {
  draft: DraftProduct;
  onChange: (next: DraftProduct) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  submitLabel: string;
}) {
  const set = <K extends keyof DraftProduct>(key: K, value: DraftProduct[K]) => onChange({ ...draft, [key]: value });

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-5 p-5">
        <div className="flex items-center gap-3">
          <Media src={null} name={draft.name || "New product"} className="size-16 shrink-0 rounded-xl" />
          <label className="press inline-flex cursor-pointer items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-foreground">
            {draft.images.length > 0 ? `${draft.images.length} photo${draft.images.length > 1 ? "s" : ""} selected` : "Add photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length) set("images", [...draft.images, ...picked].slice(0, 5));
                e.target.value = "";
              }}
              className="sr-only"
            />
          </label>
        </div>

        <div>
          <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="product-description"
            required
            rows={3}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            className={cn(inputClass, "h-auto min-h-24 resize-none py-3")}
            placeholder="What is it, and what should a shopper know before buying?"
          />
        </div>

        <div>
          <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium">
            Product name
          </label>
          <input id="product-name" required value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. Air Max Retro" />
        </div>

        <div>
          <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium">
            Category
          </label>
          <input id="product-category" required value={draft.category} onChange={(e) => set("category", e.target.value)} className={inputClass} placeholder="e.g. Sneakers" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium">
              Price
            </label>
            <input
              id="product-price"
              required
              type="text"
              inputMode="numeric"
              value={draft.price}
              onChange={(e) => set("price", digitsOnly(e.target.value))}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="product-compare" className="mb-1.5 block text-sm font-medium">
              Compare-at price
            </label>
            <input
              id="product-compare"
              type="text"
              inputMode="numeric"
              value={draft.compareAtPrice}
              onChange={(e) => set("compareAtPrice", digitsOnly(e.target.value))}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label htmlFor="product-stock" className="mb-1.5 block text-sm font-medium">
            Stock
          </label>
          <input
            id="product-stock"
            required
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={draft.stock}
            onChange={(e) => set("stock", e.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Status</p>
          <div className="flex gap-2">
            <TogglePill selected={draft.status === "active"} onClick={() => set("status", "active")}>
              Active
            </TogglePill>
            <TogglePill selected={draft.status === "draft"} onClick={() => set("status", "draft")}>
              Draft
            </TogglePill>
          </div>
        </div>
      </div>

      <div className="border-t border-line p-5">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function ProductRow({
  product,
  onSelect,
  onEdit,
  onDelete,
}: {
  product: VendorProduct;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stock = stockBadge(product.stock);
  const off = discountPercent(product.price, product.compareAtPrice);

  const showStockBadge = stock.tone === "danger" || stock.tone === "warning";

  return (
    <article className="rounded-2xl border border-line bg-surface p-2.5">
      <div className="flex gap-3">
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 gap-3 text-left">
          <div className="relative size-16 shrink-0">
            <Media src={product.imageUrl} name={product.name} className="size-16 rounded-xl" />
            {off > 0 && (
              <Badge tone="accent" className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 text-[10px]">
                −{off}%
              </Badge>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{product.category}</p>
            <p className="mt-0.5 truncate text-sm font-medium">{product.name}</p>
            <Price value={product.price} compareAt={product.compareAtPrice ?? undefined} className="mt-1" />

            {(product.status === "draft" || showStockBadge) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {product.status === "draft" && <Badge tone="neutral">Draft</Badge>}
                {showStockBadge && <Badge tone={stock.tone}>{stock.label}</Badge>}
              </div>
            )}
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <Eye className="size-3.5 text-muted" aria-hidden />
          <button type="button" onClick={onEdit} aria-label={`Edit ${product.name}`} className="press grid size-7 place-items-center rounded-full hover:bg-surface-muted">
            <Pencil className="size-3.5 text-muted" aria-hidden />
          </button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${product.name}`} className="press grid size-7 place-items-center rounded-full hover:bg-danger-soft">
            <Trash2 className="size-3.5 text-danger" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductDetails({ product, onEdit, onDelete }: { product: VendorProduct; onEdit: () => void; onDelete: () => void }) {
  const stock = stockBadge(product.stock);
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-6 p-5">
        <div className="flex items-start gap-4">
          <Media src={product.imageUrl} name={product.name} className="size-24 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <p className="text-xs text-muted">{product.category}</p>
            <h3 className="mt-0.5 text-lg font-semibold tracking-normal">{product.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={product.status === "active" ? "success" : "neutral"}>{product.status === "active" ? "Active" : "Draft"}</Badge>
              {off > 0 && <Badge tone="accent">−{off}%</Badge>}
            </div>
          </div>
        </div>

        <section className="space-y-2 rounded-2xl border border-line bg-surface-muted p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Price</span>
            <Price value={product.price} compareAt={product.compareAtPrice ?? undefined} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Stock</span>
            <Badge tone={stock.tone}>{stock.label}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Last updated</span>
            <span>{formatDate(product.updatedAt)}</span>
          </div>
        </section>
      </div>

      <div className="flex gap-2 border-t border-line p-5">
        <Button type="button" variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-danger/30 text-danger hover:border-danger"
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </Button>
      </div>
    </div>
  );
}

export function VendorProductsTab() {
  const productsQuery = useVendorProducts();
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftProduct>(EMPTY_DRAFT);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VendorProduct | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const createMutation = useCreateVendorProduct();
  const saveMutation = useSaveVendorProduct();
  const deleteMutation = useDeleteVendorProduct();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === "active" && product.status !== "active") return false;
      if (filter === "draft" && product.status !== "draft") return false;
      if (filter === "out_of_stock" && product.stock > 0) return false;
      if (q && !product.name.toLowerCase().includes(q) && !product.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, filter, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamped during render (not via effect): keeps the page in range as filters shrink the result set,
  // without the extra render pass a `setState` in `useEffect` would cause.
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  };

  const openEdit = (product: VendorProduct) => {
    setSelectedId(null);
    setEditingId(product.id);
    setDraft(toDraft(product));
    setFormOpen(true);
  };

  const selectedProduct = products.find((product) => product.id === selectedId) ?? null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(draft.price) || 0;
    const compareAtPrice = draft.compareAtPrice.trim() ? Number(draft.compareAtPrice) : null;
    const stock = Number(draft.stock) || 0;

    const done = {
      onSuccess: () => {
        toast.success(editingId ? `${draft.name} updated` : `${draft.name} added to your catalogue`);
        setFormOpen(false);
      },
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "We couldn't save that product"),
    };

    const existing = editingId ? products.find((p) => p.id === editingId) : undefined;
    if (existing) {
      // The whole record goes back, not just the edited fields — a partial write clears the gallery.
      saveMutation.mutate(
        {
          product: existing,
          changes: { name: draft.name, price, compareAtPrice, stock, status: draft.status },
        },
        done,
      );
      return;
    }

    createMutation.mutate(
      {
        name: draft.name,
        description: draft.description,
        category: draft.category,
        price,
        compareAtPrice,
        stock,
        images: draft.images,
      },
      done,
    );
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} deleted`);
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "We couldn't delete that product"),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as (typeof STATUS_FILTERS)[number]["value"])}
          aria-label="Filter by status"
          className="h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm focus:border-foreground focus:outline-none"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <Button type="button" onClick={openCreate} className="shrink-0">
          <Plus className="size-4" aria-hidden />
          Add product
        </Button>
      </div>

      {rows.length > 0 ? (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {pageRows.map((product) => (
              <li key={product.id}>
                <ProductRow
                  product={product}
                  onSelect={() => setSelectedId(product.id)}
                  onEdit={() => openEdit(product)}
                  onDelete={() => setDeleteTarget(product)}
                />
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<Boxes className="size-10 text-muted" aria-hidden />}
          title="No products match"
          description="Try a different filter or search term, or add a new product."
          action={
            <Button type="button" variant="outline" onClick={openCreate}>
              Add product
            </Button>
          }
        />
      )}

      <Drawer
        open={selectedProduct !== null}
        onClose={() => setSelectedId(null)}
        title={selectedProduct?.name ?? "Product"}
        labelId="vendor-product-details-heading"
      >
        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            onEdit={() => openEdit(selectedProduct)}
            onDelete={() => {
              setSelectedId(null);
              setDeleteTarget(selectedProduct);
            }}
          />
        )}
      </Drawer>

      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? "Edit product" : "Add product"} labelId="vendor-product-form-heading">
        <ProductForm draft={draft} onChange={setDraft} onSubmit={onSubmit} pending={saveMutation.isPending || createMutation.isPending} submitLabel={editingId ? "Save changes" : "Add product"} />
      </Drawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete product?"}
        description="This removes it from your storefront. Shoppers won't be able to find or buy it anymore."
        confirmLabel="Delete"
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        pending={deleteMutation.isPending}
      />
    </div>
  );
}
