"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ImagePlus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Media } from "@/components/ui/media";
import { inputClass } from "@/components/ui/field";
import { SearchInput, SkeletonRows } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import {
  useSectionProducts,
  useSetSectionProducts,
  useUpdateStoreSection,
  useUploadSectionCover,
} from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";
import type { VendorStoreSection } from "@/types/vendor";

const STATUS_FILTERS = {
  all: "All products",
  active: "Live only",
  out_of_stock: "Out of stock",
} as const;

/**
 * Edit one shelf: its copy, its cover, and which products sit on it.
 *
 * The picker is multi-select over the vendor's own catalogue — loaded from their own token, so
 * there is nothing here that could show another store's stock, and the API re-checks ownership
 * on save regardless.
 *
 * Saving sends the complete shelf rather than a list of additions, which is what makes
 * unticking a product actually remove it. Products may sit on several shelves at once: a
 * T-shirt belongs under both "T-Shirts" and "New Arrivals", and nothing here prevents that.
 */
export function SectionEditor({
  section,
  onClose,
}: {
  section: VendorStoreSection;
  onClose: () => void;
}) {
  const products = useVendorProducts();
  const assigned = useSectionProducts(section.id);
  const setProducts = useSetSectionProducts();
  const update = useUpdateStoreSection();
  const uploadCover = useUploadSectionCover();

  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<keyof typeof STATUS_FILTERS>("all");
  // Null until the vendor touches something, then it holds their edit. Derived rather than
  // seeded from an effect: the shelf on the server is the truth until there is a draft, so
  // there is no moment where an empty selection could be mistaken for "cleared the shelf".
  const [draft, setDraft] = useState<string[] | null>(null);

  const rows = useMemo(() => {
    const all = products.data ?? [];
    const needle = query.trim().toLowerCase();
    return all.filter((product) => {
      if (statusFilter === "active" && product.status !== "active") return false;
      if (statusFilter === "out_of_stock" && product.availableStock > 0) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle)
      );
    });
  }, [products.data, query, statusFilter]);

  const selection = draft ?? assigned.data ?? [];
  const selected = new Set(selection);
  const pageIds = rows.map((r) => r.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setDraft((current) => {
      const base = current ?? assigned.data ?? [];
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });

  const toggleAllOnPage = () =>
    setDraft((current) => {
      const base = current ?? assigned.data ?? [];
      if (allOnPageSelected) return base.filter((id) => !pageIds.includes(id));
      return [...new Set([...base, ...pageIds])];
    });

  const save = async () => {
    try {
      const trimmed = title.trim();
      if (trimmed !== section.title || description.trim() !== (section.description ?? "")) {
        await update.mutateAsync({
          id: section.id,
          title: trimmed || undefined,
          description: description.trim(),
        });
      }
      await setProducts.mutateAsync({ sectionId: section.id, productIds: selection });
      toast.success(`${trimmed || section.title} updated`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't save that section.");
    }
  };

  const onCover = (file: File) => {
    uploadCover.mutate(
      { sectionId: section.id, file },
      {
        onSuccess: () => toast.success("Cover image updated"),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't upload that image."),
      },
    );
  };

  const busy = setProducts.isPending || update.isPending;

  return (
    <Drawer open onClose={onClose} title={`Edit ${section.title}`} labelId="section-editor">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-3 border-b border-line px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Section name</span>
            <input
              className={inputClass}
              value={title}
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <textarea
              className={cn(inputClass, "h-20 resize-y py-3")}
              value={description}
              maxLength={500}
              placeholder="What's on this shelf? Shown on the section's own page."
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="flex items-center gap-3">
            <Media
              src={section.coverImageUrl}
              name={section.title}
              className="size-16 shrink-0 rounded-xl"
              sizes="64px"
            />
            <label className="press inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-foreground/40">
              <ImagePlus className="size-4" aria-hidden />
              {uploadCover.isPending ? "Uploading…" : section.coverImageUrl ? "Replace cover" : "Add cover"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploadCover.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onCover(file);
                  // Reset so re-picking the same file fires change again.
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2 border-b border-line px-5 py-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search your products"
            label="Search your products"
            icon={<Search className="size-4" aria-hidden />}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as keyof typeof STATUS_FILTERS)}
              aria-label="Filter products"
              className="h-9 rounded-full border border-line bg-surface px-3 text-xs"
            >
              {Object.entries(STATUS_FILTERS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" variant="ghost" onClick={toggleAllOnPage} disabled={pageIds.length === 0}>
              {allOnPageSelected ? "Clear these" : "Select all shown"}
            </Button>
            <span className="ml-auto text-xs font-medium text-muted">{selection.length} selected</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {products.isPending || assigned.isPending ? (
            <div className="p-5">
              <SkeletonRows count={4} />
            </div>
          ) : rows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              {query.trim() ? "No products match that search." : "You have no products yet."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((product) => {
                const isPicked = selected.has(product.id);
                return (
                  <li key={product.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-5 py-3">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isPicked}
                        onChange={() => toggle(product.id)}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md border",
                          isPicked ? "border-accent bg-accent text-white" : "border-line",
                        )}
                      >
                        {isPicked && <Check className="size-3.5" />}
                      </span>
                      <Media
                        src={product.imageUrl}
                        name={product.name}
                        className="size-11 shrink-0 rounded-lg"
                        sizes="44px"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {formatMoney(product.price)} · {product.availableStock} in stock
                        </span>
                      </span>
                      {product.status !== "active" && <Badge tone="neutral">{product.status}</Badge>}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          <Button type="button" className="w-full" disabled={busy || assigned.isPending} onClick={save}>
            {busy
              ? "Saving…"
              : `Save section · ${selection.length} ${selection.length === 1 ? "product" : "products"}`}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
