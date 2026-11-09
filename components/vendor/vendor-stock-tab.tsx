"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, CheckCircle2, History, Pencil, Search, Store } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useBulkUpdateStock,
  useInventoryList,
  useInventoryMovements,
  useInventoryStats,
  useLowStockAlerts,
  useUpdateInventoryItem,
  useVendorStoreId,
} from "@/hooks/use-vendor-inventory";
import { cn } from "@/libs/cn";
import { formatDateTime, formatMoney } from "@/libs/format";
import type { InventoryItem, InventoryStatus } from "@/services/vendor-inventory.service";

const PAGE_SIZE = 10;

const STATUS: Record<InventoryStatus, { label: string; tone: BadgeTone }> = {
  in_stock: { label: "In stock", tone: "success" },
  low_stock: { label: "Low stock", tone: "warning" },
  out_of_stock: { label: "Out of stock", tone: "danger" },
};

const FILTERS: { value: InventoryStatus | "all"; label: string }[] = [
  { value: "all", label: "All stock" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

export function VendorStockSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading inventory">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse space-y-2 rounded-2xl border border-line bg-surface p-4">
            <div className="h-4 w-20 rounded bg-surface-muted" />
            <div className="h-7 w-16 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-full bg-surface-muted" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <div className="size-12 shrink-0 rounded-xl bg-surface-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 rounded bg-surface-muted" />
              <div className="h-3 w-24 rounded bg-surface-muted" />
            </div>
            <div className="h-6 w-16 rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone?: "warning" | "danger" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-4",
        tone === "warning" ? "border-warning/30" : tone === "danger" ? "border-danger/30" : "border-line",
      )}
    >
      <p className={cn("text-xs", tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-muted")}>{label}</p>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-foreground")}>{value}</p>
      <p className="mt-1 text-[11px] text-muted">{hint}</p>
    </div>
  );
}

function Stats() {
  const { data: stats } = useInventoryStats();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="In stock" value={stats?.inStock ?? 0} hint={`${stats?.trackedProducts ?? 0} tracked products`} />
      <StatCard label="Total units" value={stats?.totalUnits ?? 0} hint={`Worth ${formatMoney(stats?.inventoryValue ?? 0)}`} />
      <StatCard label="Low stock" value={stats?.lowStock ?? 0} hint="Needs restocking" tone="warning" />
      <StatCard label="Out of stock" value={stats?.outOfStock ?? 0} hint="0 units left" tone="danger" />
    </div>
  );
}

function LowStockAlerts({ onEdit }: { onEdit: (item: InventoryItem) => void }) {
  const { data: alerts = [], isPending } = useLowStockAlerts();
  const bulk = useBulkUpdateStock();
  const [restockTo, setRestockTo] = useState("20");

  const restockAll = () => {
    const stock = Number(restockTo);
    if (!Number.isFinite(stock) || stock < 0) return toast.error("Enter a valid stock level");
    bulk.mutate(
      alerts.map((a) => ({ productId: a.productId, stock })),
      {
        onSuccess: () => toast.success(`Restocked ${alerts.length} ${alerts.length === 1 ? "product" : "products"} to ${stock}`),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (isPending) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold tracking-normal">
          <AlertTriangle className="size-4 text-warning" aria-hidden /> Low stock alerts
        </h3>
        {alerts.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="restock-all" className="text-xs text-muted">
              Restock all to
            </label>
            <input
              id="restock-all"
              type="number"
              min={0}
              inputMode="numeric"
              value={restockTo}
              onChange={(e) => setRestockTo(e.target.value)}
              className="h-9 w-20 rounded-full border border-line bg-surface px-3 text-sm tabular-nums focus:border-foreground focus:outline-none"
            />
            <Button size="sm" variant="outline" onClick={restockAll} disabled={bulk.isPending}>
              {bulk.isPending ? "Saving…" : "Apply"}
            </Button>
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-success" aria-hidden />
          <p className="font-medium text-foreground">All products have healthy stock</p>
          <p className="mt-0.5 text-xs">Anything running low will show up here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-warning/30 bg-surface">
          {alerts.map((item) => (
            <li key={item.productId} className="flex items-center justify-between gap-3 p-3.5 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <Media src={item.imageUrl} name={item.name} className="size-10 shrink-0 rounded-lg" />
                <p className="truncate font-medium">{item.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={item.stock <= 0 ? "danger" : "warning"}>{item.stock} left</Badge>
                <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                  Restock
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function InventoryRow({ item, onEdit }: { item: InventoryItem; onEdit: () => void }) {
  const status = STATUS[item.status];
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
      <Media src={item.imageUrl} name={item.name} className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {formatMoney(item.price)}
          {item.compareAtPrice ? <span className="ml-1.5 line-through">{formatMoney(item.compareAtPrice)}</span> : null}
          {item.sku ? ` · SKU ${item.sku}` : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm font-semibold tabular-nums">{item.stock} units</span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <Button size="icon" variant="ghost" onClick={onEdit} aria-label={`Edit stock and price for ${item.name}`}>
        <Pencil className="size-4" aria-hidden />
      </Button>
    </li>
  );
}

function InventoryList({ onEdit }: { onEdit: (item: InventoryItem) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InventoryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const list = useInventoryList({ search, status: filter === "all" ? "" : filter, page, pageSize: PAGE_SIZE });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  // When the API doesn't report a total, allow "next" whenever the page came back full.
  const totalPages = Math.max(page, Math.ceil(total / PAGE_SIZE), items.length === PAGE_SIZE ? page + 1 : page);

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold tracking-normal">
        <Boxes className="size-4 text-muted" aria-hidden /> Inventory
      </h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products"
            aria-label="Search inventory"
            className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as InventoryStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 rounded-full sm:w-44" aria-label="Filter by stock status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.isPending ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
      ) : list.isError ? (
        <QueryError error={list.error} onRetry={() => list.refetch()} title="We couldn’t load your inventory" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-10 text-muted" aria-hidden />}
          title={search.trim() || filter !== "all" ? "No products match" : "No products yet"}
          description={search.trim() || filter !== "all" ? "Try another search or filter." : "Add products in the Products tab to track their stock here."}
        />
      ) : (
        <div className={list.searching ? "opacity-60 transition-opacity" : undefined}>
          <ul className="space-y-2">
            {items.map((item) => (
              <InventoryRow key={item.productId} item={item} onEdit={() => onEdit(item)} />
            ))}
          </ul>
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </section>
  );
}

function Movements() {
  const { data: movements = [], isPending } = useInventoryMovements();
  if (isPending || movements.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold tracking-normal">
        <History className="size-4 text-muted" aria-hidden /> Recent stock changes
      </h3>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {movements.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{m.productTitle}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {m.reason.replace(/_/g, " ")}
                {m.note ? ` · ${m.note}` : ""} · {formatDateTime(m.createdAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("flex items-center justify-end gap-0.5 font-semibold tabular-nums", m.delta < 0 ? "text-danger" : "text-success")}>
                {m.delta < 0 ? <ArrowDownRight className="size-3.5" aria-hidden /> : <ArrowUpRight className="size-3.5" aria-hidden />}
                {m.delta > 0 ? `+${m.delta}` : m.delta}
              </p>
              <p className="text-xs text-muted tabular-nums">{m.stockAfter} left</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditItemForm({ item, onDone }: { item: InventoryItem; onDone: () => void }) {
  const [stock, setStock] = useState(String(item.stock));
  const [price, setPrice] = useState(String(item.price));
  const [oldPrice, setOldPrice] = useState(item.compareAtPrice ? String(item.compareAtPrice) : "");
  const update = useUpdateInventoryItem();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextStock = Number(stock);
    const nextPrice = Number(price);
    const nextOld = oldPrice.trim() ? Number(oldPrice) : null;
    if (!Number.isFinite(nextStock) || nextStock < 0) return toast.error("Stock must be 0 or more");
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) return toast.error("Enter a valid price");
    if (nextOld !== null && (!Number.isFinite(nextOld) || nextOld < 0)) return toast.error("Enter a valid old price");

    const priceChanged = nextPrice !== item.price || nextOld !== item.compareAtPrice;
    update.mutate(
      {
        productId: item.productId,
        stock: nextStock !== item.stock ? nextStock : undefined,
        price: priceChanged ? nextPrice : undefined,
        oldPrice: priceChanged ? nextOld : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Inventory updated");
          onDone();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <Media src={item.imageUrl} name={item.name} className="size-14 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.name}</p>
          <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
        </div>
      </div>
      <Field id="inv-stock" label="Units in stock" type="number" min={0} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Field id="inv-price" label="Price (GH₵)" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <Field
          id="inv-old-price"
          label="Old price"
          hint="Optional"
          type="number"
          min={0}
          step="0.01"
          value={oldPrice}
          onChange={(e) => setOldPrice(e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="accent" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Vendor → Stock: /vendor/inventory (list, stats, low-stock alerts, stock/price edits, bulk restock) + movement feed. */
export function VendorStockTab() {
  const { storeId, isPending } = useVendorStoreId();
  const stats = useInventoryStats();
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  if (isPending || (storeId && stats.isPending)) return <VendorStockSkeleton />;

  if (!storeId) {
    return (
      <EmptyState
        icon={<Store className="size-10 text-muted" aria-hidden />}
        title="Your store isn’t set up yet"
        description="Once your vendor account has a store, its stock levels will show here."
      />
    );
  }

  return (
    <div className="space-y-8">
      <Stats />
      <LowStockAlerts onEdit={setEditing} />
      <InventoryList onEdit={setEditing} />
      <Movements />

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title="Update stock & price" labelId="vendor-inventory-edit-heading">
        {editing && <EditItemForm key={editing.productId} item={editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
