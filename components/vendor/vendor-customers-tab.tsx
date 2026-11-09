"use client";

import { useMemo, useState } from "react";
import { Mail, MapPin, Phone, Search, Users } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { useVendorCustomers, useVendorOrders } from "@/hooks/use-vendor";
import { formatDate, formatMoney } from "@/libs/format";
import type { VendorCustomer as VendorCustomerRow, VendorOrder } from "@/types/vendor";

const PAGE_SIZE = 6;

/**
 * The roster comes aggregated from `/vendor/customers` (spend and counts are the server's, not a
 * local sum). There is no customer→orders endpoint, so the "recent orders" panel matches the order
 * list on name and phone, and the address is taken from the most recent of those.
 */
type VendorCustomer = VendorCustomerRow & {
  address: VendorOrder["address"] | null;
  orders: VendorOrder[];
};

function withOrders(customers: VendorCustomerRow[], orders: VendorOrder[]): VendorCustomer[] {
  return customers
    .map((customer) => {
      const mine = orders
        .filter((o) => o.buyerName === customer.name && (!customer.phone || o.buyerPhone === customer.phone))
        .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
      return { ...customer, orders: mine, address: mine[0]?.address ?? null };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

function CustomerRow({ customer, onSelect }: { customer: VendorCustomer; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left">
      <Media src={null} name={customer.name} className="size-12 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{customer.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{customer.phone ?? "No phone on file"}</p>
        <p className="mt-0.5 text-xs text-muted">
          {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"}
          {customer.lastOrderAt && (
            <>
              {" · Last "}
              <time dateTime={customer.lastOrderAt}>{formatDate(customer.lastOrderAt)}</time>
            </>
          )}
        </p>
      </div>

      <p className="shrink-0 font-semibold tabular-nums">{formatMoney(customer.totalSpent)}</p>
    </button>
  );
}

function CustomerDetails({ customer }: { customer: VendorCustomer }) {
  const averageOrder = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
  const orders = customer.orders;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <Media src={null} name={customer.name} className="size-14 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-normal">{customer.name}</p>
          <p className="truncate text-sm text-muted">{customer.phone ?? "No phone on file"}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface-muted p-3.5">
          <p className="text-xs text-muted">Orders</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{customer.orderCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface-muted p-3.5">
          <p className="text-xs text-muted">Lifetime spent</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(customer.totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface-muted p-3.5">
          <p className="text-xs text-muted">Average order</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(averageOrder)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface-muted p-3.5">
          <p className="text-xs text-muted">Last order</p>
          <p className="mt-1 text-sm font-semibold">{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}</p>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold tracking-normal">Contact</h3>
        <div className="space-y-2 rounded-2xl border border-line bg-surface-muted p-4 text-sm">
          <p className="flex items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted" aria-hidden />
            {customer.phone ?? "No phone on file"}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 shrink-0 text-muted" aria-hidden />
            {customer.phone ?? "—"}
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <span>
              {customer.address?.street ?? "No address on file"}
              <br />
              {[customer.address?.city, customer.address?.region].filter(Boolean).join(", ")}
            </span>
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold tracking-normal">Recent orders</h3>
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{order.number}</p>
                <p className="mt-0.5 text-xs text-muted">{formatDate(order.placedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <StatusBadge status={order.status} />
                <p className="font-semibold tabular-nums">{formatMoney(order.total)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function VendorCustomersTab() {
  const roster = useVendorCustomers();
  const orders = useVendorOrders();
  const customers = useMemo(() => withOrders(roster.data ?? [], orders.data ?? []), [roster.data, orders.data]);

  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) => customer.name.toLowerCase().includes(q) || (customer.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamped during render (not via effect): keeps the page in range as filters shrink the result set,
  // without the extra render pass a `setState` in `useEffect` would cause.
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedCustomer = customers.find((customer) => customer.key === selectedKey) ?? null;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or phone"
          className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
      </div>

      {rows.length > 0 ? (
        <>
          <ul className="space-y-3">
            {pageRows.map((customer) => (
              <li key={customer.key}>
                <CustomerRow customer={customer} onSelect={() => setSelectedKey(customer.key)} />
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState icon={<Users className="size-10 text-muted" aria-hidden />} title="No customers match" description="Try a different search term." />
      )}

      <Drawer
        open={selectedCustomer !== null}
        onClose={() => setSelectedKey(null)}
        title={selectedCustomer?.name ?? "Customer"}
        labelId="vendor-customer-details-heading"
      >
        {selectedCustomer && <CustomerDetails customer={selectedCustomer} />}
      </Drawer>
    </div>
  );
}
