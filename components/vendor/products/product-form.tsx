"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ImagePlus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/vendor/vendor-ui";
import { inputClass } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/libs/cn";
import { useCategories } from "@/hooks/use-catalog";
import {
  useCreateVendorProduct,
  useDeleteVendorProduct,
  useSaveVendorProduct,
  useSetVendorProductStatus,
} from "@/hooks/use-vendor";
import {
  VENDOR_PRODUCT_STATUS_LABELS,
  canHideVendorProduct,
  canRepublishVendorProduct,
} from "@/libs/vendor-orders";
import type { VendorProduct } from "@/types/vendor";

/**
 * Prices are whole cedis end to end: the API types them as `int` and parses with a bare `int()`,
 * which raises on "85.50". The input therefore refuses anything but digits rather than letting a
 * vendor type an amount the save would reject. (Mobile's own form does allow it, and fails.)
 */
const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

type Draft = {
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  colorOptions: string;
  sizeOptions: string;
  specifications: string;
  isReturnable: boolean;
};

const EMPTY: Draft = {
  name: "",
  description: "",
  category: "",
  categorySlug: "",
  subcategory: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  colorOptions: "",
  sizeOptions: "",
  specifications: "",
  isReturnable: true,
};

function toDraft(p: VendorProduct): Draft {
  return {
    name: p.name,
    description: p.description,
    category: p.category,
    categorySlug: p.categorySlug ?? "",
    subcategory: p.subcategory ?? "",
    price: String(p.price),
    compareAtPrice: p.compareAtPrice !== null ? String(p.compareAtPrice) : "",
    stock: String(p.stock),
    colorOptions: p.colorOptions.join(", "),
    sizeOptions: p.sizeOptions.join(", "),
    specifications: p.specifications.join("\n"),
    isReturnable: p.isReturnable,
  };
}

function Labelled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}


/**
 * Publish / hide, on the narrow `/status` endpoint rather than the whole-record write.
 *
 * The API gates both directions — hiding needs the product live or out of stock, republishing
 * needs it hidden/out-of-stock *and* in stock — so the button explains itself when neither is
 * available rather than offering a call that comes back 400.
 */
function VisibilityControl({ product }: { product: VendorProduct }) {
  const setStatus = useSetVendorProductStatus();
  const canHide = canHideVendorProduct(product.status);
  const canRepublish = canRepublishVendorProduct(product.status, product.stock);

  const apply = (status: "active" | "hidden") =>
    setStatus.mutate(
      { productId: product.id, status },
      {
        onSuccess: () => toast.success(status === "hidden" ? "Product hidden" : "Product republished"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't change visibility."),
      },
    );

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Visibility</p>
      <div className="flex items-center gap-2">
        <Badge tone={product.status === "active" ? "success" : product.status === "pending" ? "warning" : "neutral"}>
          {VENDOR_PRODUCT_STATUS_LABELS[product.status]}
        </Badge>
      </div>
      {canHide && (
        <Button type="button" variant="outline" size="sm" className="mt-2 w-full" disabled={setStatus.isPending} onClick={() => apply("hidden")}>
          <EyeOff className="size-4" aria-hidden />
          Hide from storefront
        </Button>
      )}
      {canRepublish && (
        <Button type="button" variant="outline" size="sm" className="mt-2 w-full" disabled={setStatus.isPending} onClick={() => apply("active")}>
          <Eye className="size-4" aria-hidden />
          Republish
        </Button>
      )}
      {!canHide && !canRepublish && (
        <p className="mt-1.5 text-xs text-muted">
          {product.status === "pending"
            ? "ODOS is reviewing this product. It goes live once approved — every edit sends it back for review."
            : product.status === "suspended"
              ? "Suspended by ODOS. Contact support to resolve it."
              : "Add stock before you can republish this product."}
        </p>
      )}
    </div>
  );
}

/** Create and edit share this form: the only differences are the gallery and the delete action. */
export function ProductForm({ product }: { product?: VendorProduct }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [draft, setDraft] = useState<Draft>(product ? toDraft(product) : EMPTY);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [gallery, setGallery] = useState<string[]>(product?.imageUrls ?? []);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const create = useCreateVendorProduct();
  const save = useSaveVendorProduct();
  const remove = useDeleteVendorProduct();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const subcategories = useMemo(
    () => categories?.find((c) => c.name === draft.category)?.subcategories ?? [],
    [categories, draft.category],
  );

  const pending = create.isPending || save.isPending;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!draft.name.trim()) return setError("Give the product a name.");
    if (!draft.description.trim()) return setError("A description is required by the catalogue.");
    if (!draft.category.trim()) return setError("Choose a category so shoppers can find it.");
    if (!draft.price) return setError("Set a price.");

    const compareAt = draft.compareAtPrice ? Number(draft.compareAtPrice) : null;
    if (compareAt !== null && compareAt <= Number(draft.price)) {
      return setError("The compare-at price has to be higher than the price for a discount to show.");
    }

    const shared = {
      name: draft.name,
      description: draft.description,
      category: draft.category,
      categorySlug: draft.categorySlug || null,
      subcategory: draft.subcategory || null,
      price: Number(draft.price),
      compareAtPrice: compareAt,
      stock: Number(draft.stock || 0),
      colorOptions: splitList(draft.colorOptions),
      sizeOptions: splitList(draft.sizeOptions),
      specifications: splitLines(draft.specifications),
      isReturnable: draft.isReturnable,
    };

    if (product) {
      save.mutate(
        { product, changes: { ...shared, imageUrls: gallery, newImages } },
        {
          onSuccess: () => {
            toast.success(`${draft.name} saved`);
            router.push("/seller/products");
          },
          onError: (e) => setError(e instanceof Error ? e.message : "We couldn't save this product."),
        },
      );
      return;
    }

    create.mutate(
      { ...shared, images: newImages },
      {
        onSuccess: () => {
          toast.success(`${draft.name} added to your catalogue`);
          router.push("/seller/products");
        },
        onError: (e) => setError(e instanceof Error ? e.message : "We couldn't add this product."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <PanelHeader title="Basics" />
            <div className="space-y-4 p-5">
              <Labelled label="Product name">
                <input className={inputClass} value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={255} required />
              </Labelled>
              <Labelled label="Description" hint="Up to 1000 characters. Shoppers see this on the product page.">
                <textarea
                  className={cn(inputClass, "h-32 resize-y py-3")}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={1000}
                  required
                />
              </Labelled>
              <div className="grid gap-4 sm:grid-cols-2">
                <Labelled label="Category">
                  <select
                    className={inputClass}
                    value={draft.category}
                    onChange={(e) => {
                      const match = categories?.find((c) => c.name === e.target.value);
                      setDraft((d) => ({ ...d, category: e.target.value, categorySlug: match?.slug ?? "", subcategory: "" }));
                    }}
                    required
                  >
                    <option value="">Choose a category</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Labelled>
                <Labelled label="Subcategory">
                  <select
                    className={inputClass}
                    value={draft.subcategory}
                    onChange={(e) => set("subcategory", e.target.value)}
                    disabled={!subcategories.length}
                  >
                    <option value="">{subcategories.length ? "None" : "Pick a category first"}</option>
                    {subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </Labelled>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Photos" />
            <div className="space-y-4 p-5">
              {gallery.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted">Current photos — remove any you no longer want.</p>
                  <ul className="flex flex-wrap gap-3">
                    {gallery.map((url) => (
                      <li key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Remote product photos are not in the image allowlist. */}
                        <img src={url} alt="" className="size-20 rounded-xl border border-line object-cover" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => setGallery((g) => g.filter((u) => u !== url))}
                          className="press absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-foreground text-background"
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {newImages.length > 0 && (
                <ul className="flex flex-wrap gap-3">
                  {newImages.map((file, i) => (
                    <li key={`${file.name}-${i}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Local object URL preview. */}
                      <img src={URL.createObjectURL(file)} alt="" className="size-20 rounded-xl border border-accent object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setNewImages((f) => f.filter((_, index) => index !== i))}
                        className="press absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-foreground text-background"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="press flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line text-sm text-muted hover:border-foreground">
                <ImagePlus className="size-5" aria-hidden />
                {editing ? "Add more photos" : "Upload photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    setNewImages((existing) => [...existing, ...Array.from(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Variations and details" />
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Labelled label="Colours" hint="Comma separated, e.g. Black, Cream, Navy">
                  <input className={inputClass} value={draft.colorOptions} onChange={(e) => set("colorOptions", e.target.value)} maxLength={255} />
                </Labelled>
                <Labelled label="Sizes" hint="Comma separated, e.g. S, M, L">
                  <input className={inputClass} value={draft.sizeOptions} onChange={(e) => set("sizeOptions", e.target.value)} maxLength={255} />
                </Labelled>
              </div>
              <Labelled label="Specifications" hint="One per line.">
                <textarea
                  className={cn(inputClass, "h-24 resize-y py-3")}
                  value={draft.specifications}
                  onChange={(e) => set("specifications", e.target.value)}
                  maxLength={3000}
                />
              </Labelled>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isReturnable}
                  onChange={(e) => set("isReturnable", e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Customers can return this product
              </label>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Pricing and stock" />
            <div className="space-y-4 p-5">
              <Labelled label="Price (GH₵)" hint="Whole cedis only — the catalogue does not store pesewas.">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) => set("price", digitsOnly(e.target.value))}
                  required
                />
              </Labelled>
              <Labelled label="Compare-at price (GH₵)" hint="Optional. Shows as a struck-through was-price.">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={draft.compareAtPrice}
                  onChange={(e) => set("compareAtPrice", digitsOnly(e.target.value))}
                />
              </Labelled>
              <Labelled label="Stock on hand">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={draft.stock}
                  onChange={(e) => set("stock", digitsOnly(e.target.value))}
                />
              </Labelled>
              {editing && product && <VisibilityControl product={product} />}
            </div>
          </Panel>

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add product"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.push("/seller/products")} disabled={pending}>
              Cancel
            </Button>
            {editing && (
              <Button type="button" variant="ghost" size="lg" className="text-danger" onClick={() => setConfirmingDelete(true)} disabled={pending}>
                <Trash2 className="size-4" aria-hidden />
                Delete product
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onCancel={() => setConfirmingDelete(false)}
        title={`Delete ${product?.name ?? "this product"}?`}
        description="It is removed from your catalogue and the storefront. This cannot be undone."
        confirmLabel="Delete product"
        pending={remove.isPending}
        onConfirm={() => {
          if (!product) return;
          remove.mutate(product.id, {
            onSuccess: () => {
              toast.success(`${product.name} deleted`);
              router.push("/seller/products");
            },
            onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't delete this product."),
            onSettled: () => setConfirmingDelete(false),
          });
        }}
      />
    </form>
  );
}
