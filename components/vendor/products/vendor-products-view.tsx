"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Package, Pencil, Plus, Search } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, SearchInput, Select, SkeletonRows, TableScroll } from "@/components/vendor/vendor-ui";
import { formatDate } from "@/libs/format";
import { isLowStock, isOutOfStock } from "@/hooks/use-vendor-portal";
import { VENDOR_PRODUCT_STATUS_LABELS } from "@/libs/vendor-orders";
import { useBulkUpdateVendorProducts, useVendorProducts } from "@/hooks/use-vendor";
import type { VendorProduct, VendorProductSelfServiceStatus, VendorProductStatus } from "@/types/vendor";

const PAGE_SIZE = 12;

type StatusFilter = "all" | "active" | "hidden" | "pending" | "low_stock" | "out_of_stock";
type SortKey = "recent" | "name" | "price_desc" | "stock_asc";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All products" },
  { value: "active", label: "Live" },
  { value: "hidden", label: "Hidden" },
  { value: "pending", label: "Under review" },
  { value: "low_stock", label: "Running low" },
  { value: "out_of_stock", label: "Out of stock" },
];

/** Only `active` reaches shoppers, so everything else reads as "not on sale". */
const STATUS_TONE: Record<VendorProductStatus, BadgeTone> = {
  active: "success",
  hidden: "neutral",
  pending: "warning",
  out_of_stock: "danger",
  suspended: "danger",
  draft: "neutral",
};

const SORTS: { value: string; label: string }[] = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "price_desc", label: "Highest price" },
  { value: "stock_asc", label: "Lowest stock" },
];

function stockBadge(product: VendorProduct): { tone: BadgeTone; label: string } {
  if (isOutOfStock(product.stock)) return { tone: "danger", label: "Out of stock" };
  if (isLowStock(product.stock)) return { tone: "warning", label: `${product.stock} left` };
  return { tone: "neutral", label: `${product.stock} in stock` };
}

export function VendorProductsView() {
  const productsQuery = useVendorProducts();
  const bulk = useBulkUpdateVendorProducts();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const all = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((p) => {
      if (status === "active" && p.status !== "active") return false;
      if (status === "hidden" && p.status !== "hidden") return false;
      if (status === "pending" && p.status !== "pending") return false;
      if (status === "low_stock" && !isLowStock(p.stock)) return false;
      if (status === "out_of_stock" && !isOutOfStock(p.stock)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "stock_asc") sorted.sort((a, b) => a.stock - b.stock);
    return sorted;
  }, [all, status, sort, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((p) => selected.has(p.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runBulk = (changes: { status?: VendorProductSelfServiceStatus; stock?: number }, message: string) => {
    const ids = [...selected];
    if (!ids.length) return;
    bulk.mutate(
      { productIds: ids, ...changes },
      {
        onSuccess: () => {
          toast.success(message.replace("{n}", String(ids.length)));
          setSelected(new Set());
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't update those products."),
      },
    );
  };

  if (productsQuery.isError) {
    return <QueryError title="We couldn't load your products" error={productsQuery.error} onRetry={() => productsQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description={`${all.length} product${all.length === 1 ? "" : "s"} in your catalogue.`}
        actions={
          <ButtonLink href="/seller/products/new">
            <Plus className="size-4" aria-hidden />
            Add product
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={(next) => {
            setQuery(next);
            setPage(1);
          }}
          label="Search products"
          placeholder="Search by name or category"
          icon={<Search className="size-4" aria-hidden />}
        />
        <Select label="Filter by status" value={status} onChange={(v) => { setStatus(v as StatusFilter); setPage(1); }} options={STATUS_FILTERS} />
        <Select label="Sort products" value={sort} onChange={(v) => setSort(v as SortKey)} options={SORTS} />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4">
          <p className="text-sm font-medium text-accent">{selected.size} selected</p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={bulk.isPending} onClick={() => runBulk({ status: "active" }, "{n} products published")}>
              Republish
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={bulk.isPending} onClick={() => runBulk({ status: "hidden" }, "{n} products hidden")}>
              Unpublish
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {productsQuery.isPending ? (
        <SkeletonRows count={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10 text-muted" aria-hidden />}
          title={all.length === 0 ? "No products yet" : "No products match"}
          description={
            all.length === 0
              ? "Add your first product and it goes live on the ODOS storefront straight away."
              : "Try a different search or filter."
          }
          action={all.length === 0 ? <ButtonLink href="/seller/products/new">Add your first product</ButtonLink> : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <TableScroll>
            <table className="w-full text-sm">
              <caption className="sr-only">Your products, with price, stock and visibility</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="w-10 pb-3">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allOnPageSelected}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (allOnPageSelected) pageRows.forEach((p) => next.delete(p.id));
                          else pageRows.forEach((p) => next.add(p.id));
                          return next;
                        })
                      }
                      className="size-4 accent-[var(--accent)]"
                    />
                  </th>
                  <th scope="col" className="pb-3 font-medium">Product</th>
                  <th scope="col" className="pb-3 font-medium">Price</th>
                  <th scope="col" className="pb-3 font-medium">Stock</th>
                  <th scope="col" className="pb-3 font-medium">Visibility</th>
                  <th scope="col" className="pb-3 font-medium">Updated</th>
                  <th scope="col" className="pb-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((product) => {
                  const stock = stockBadge(product);
                  return (
                    <tr key={product.id} className="align-middle">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={selected.has(product.id)}
                          onChange={() => toggle(product.id)}
                          className="size-4 accent-[var(--accent)]"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/seller/products/${product.id}`} className="press flex items-center gap-3 group">
                          <Media src={product.imageUrl} name={product.name} sizes="40px" className="size-10 shrink-0 rounded-lg" />
                          <span className="min-w-0">
                            <span className="block max-w-[18rem] truncate font-medium group-hover:text-accent">{product.name}</span>
                            <span className="block text-xs text-muted">{product.category}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Price value={product.price} compareAt={product.compareAtPrice ?? undefined} />
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={stock.tone}>{stock.label}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={STATUS_TONE[product.status]}>{VENDOR_PRODUCT_STATUS_LABELS[product.status]}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs whitespace-nowrap text-muted">{formatDate(product.updatedAt)}</td>
                      <td className="py-3 text-right">
                        <ButtonLink href={`/seller/products/${product.id}`} variant="ghost" size="sm">
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </ButtonLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
          <div className="mt-4">
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
