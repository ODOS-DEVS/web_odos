"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, History, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useVendorProducts, useSetVendorProductStock } from "@/hooks/use-vendor";
import { useVendorMovements, useVendorPerformance } from "@/hooks/use-vendor-ops";
import { formatDate, formatMoney } from "@/libs/format";
import type { VendorProduct } from "@/types/vendor";

const PAGE_SIZE = 8;
const LOW_STOCK_AT = 5;
const PERFORMANCE_WINDOW_DAYS = 30;

type StockFilter = "all" | "low" | "out";

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "warning" | "danger" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StockRow({
  product,
  soldInWindow,
  onSet,
  saving,
}: {
  product: VendorProduct;
  soldInWindow: number;
  onSet: (stock: number) => void;
  saving: boolean;
}) {
  // Typing is local until committed — blur or Enter — so one row's edit never
  // fights the server refresh of the whole list.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(product.stock);

  const commit = () => {
    if (draft === null) return;
    const next = Number.parseInt(draft, 10);
    setDraft(null);
    if (!Number.isFinite(next) || next < 0 || next === product.stock) return;
    onSet(next);
  };

  const out = product.stock <= 0;
  const low = !out && product.stock <= LOW_STOCK_AT;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <Media src={product.imageUrl} name={product.name} className="size-12 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {formatMoney(product.price)}
          {soldInWindow > 0 && <> · {soldInWindow} sold in {PERFORMANCE_WINDOW_DAYS} days</>}
          {product.status === "draft" && <> · Draft</>}
        </p>
        {(out || low) && (
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${out ? "text-danger" : "text-warning"}`}>
            <AlertTriangle className="size-3.5" aria-hidden />
            {out ? "Out of stock — hidden from shoppers until restocked" : `Low stock — ${product.stock} left`}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor={`stock-${product.id}`}>
          Stock for {product.name}
        </label>
        <input
          id={`stock-${product.id}`}
          type="number"
          min={0}
          inputMode="numeric"
          value={shown}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setDraft(null);
          }}
          className="h-10 w-20 rounded-xl border border-line bg-surface px-3 text-center text-sm tabular-nums focus:border-foreground focus:outline-none disabled:opacity-50"
        />
      </div>
    </li>
  );
}

function MovementsFeed() {
  const movements = useVendorMovements();
  if (movements.isPending) return <div className="h-40 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (movements.isError) return <QueryError error={movements.error} onRetry={() => movements.refetch()} />;
  if (!movements.data?.length) {
    return <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">No stock movements yet. Sales and your own edits will show up here.</p>;
  }
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {movements.data.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{m.productTitle}</p>
            <p className="mt-0.5 text-xs text-muted">
              {m.reason.replace(/_/g, " ")} · <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time>
              {m.note && <> · {m.note}</>}
            </p>
          </div>
          <p className={`shrink-0 font-semibold tabular-nums ${m.delta < 0 ? "text-danger" : "text-success"}`}>
            {m.delta > 0 ? `+${m.delta}` : m.delta}
            <span className="ml-2 font-normal text-muted">→ {m.stockAfter}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function VendorStockTab() {
  const products = useVendorProducts();
  const performance = useVendorPerformance(PERFORMANCE_WINDOW_DAYS);
  const setStock = useSetVendorProductStock();

  const [filter, setFilter] = useState<StockFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showFeed, setShowFeed] = useState(false);
  // Only the row being saved shows as busy, not every row at once.
  const [savingId, setSavingId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = products.data ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (filter === "low" && (p.stock <= 0 || p.stock > LOW_STOCK_AT)) return false;
      if (filter === "out" && p.stock > 0) return false;
      return !q || p.name.toLowerCase().includes(q);
    });
  }, [products.data, filter, query]);

  if (products.isPending) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (products.isError) return <QueryError error={products.error} onRetry={() => products.refetch()} />;

  const all = products.data ?? [];
  const lowCount = all.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_AT).length;
  const outCount = all.filter((p) => p.stock <= 0).length;
  const unitCount = all.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
  const stockValue = all.reduce((sum, p) => sum + Math.max(0, p.stock) * p.price, 0);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSet = (product: VendorProduct, stock: number) => {
    setSavingId(product.id);
    setStock.mutate(
      { productId: product.id, stock },
      {
        onSuccess: () => toast.success(`${product.name}: stock set to ${stock}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn’t update that stock level."),
        onSettled: () => setSavingId(null),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Products" value={String(all.length)} />
        <StatTile label="Units on hand" value={unitCount.toLocaleString()} />
        <StatTile label="Stock value" value={formatMoney(stockValue)} />
        <StatTile
          label="Needs attention"
          value={`${lowCount} low · ${outCount} out`}
          tone={outCount > 0 ? "danger" : lowCount > 0 ? "warning" : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TogglePill selected={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }}>
          All
        </TogglePill>
        <TogglePill selected={filter === "low"} onClick={() => { setFilter("low"); setPage(1); }}>
          Low stock{lowCount > 0 && ` (${lowCount})`}
        </TogglePill>
        <TogglePill selected={filter === "out"} onClick={() => { setFilter("out"); setPage(1); }}>
          Out of stock{outCount > 0 && ` (${outCount})`}
        </TogglePill>

        <button
          type="button"
          onClick={() => setShowFeed((v) => !v)}
          className="press ml-auto flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <History className="size-4" aria-hidden />
          {showFeed ? "Hide movements" : "Stock movements"}
        </button>
      </div>

      {showFeed && <MovementsFeed />}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search products"
          className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
      </div>

      {pageRows.length > 0 ? (
        <>
          <ul className="space-y-3">
            {pageRows.map((product) => (
              <StockRow
                key={product.id}
                product={product}
                soldInWindow={performance.data?.get(product.id)?.unitsSold ?? 0}
                saving={savingId === product.id}
                onSet={(stock) => handleSet(product, stock)}
              />
            ))}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<Boxes className="size-10 text-muted" aria-hidden />}
          title={all.length === 0 ? "No products yet" : "Nothing matches"}
          description={all.length === 0 ? "Add your first product and its stock will be tracked here." : "Try a different search or filter."}
        />
      )}
    </div>
  );
}
