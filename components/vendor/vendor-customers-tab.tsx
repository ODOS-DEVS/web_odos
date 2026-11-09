"use client";

import { useMemo, useState } from "react";
import { Phone, Search, Store, Users } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { useVendorCustomers } from "@/hooks/use-vendor-customers";
import { useVendorOrders } from "@/hooks/use-vendor-orders";
import { formatDate, formatMoney } from "@/libs/format";
import { ApiError } from "@/services/http";
import type { VendorOrder } from "@/services/vendor-orders.service";
import type { VendorCustomerRead } from "@/types/vendor";

const PAGE_SIZE = 6;

const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "").slice(-9);

/**
 * The API's customer row has no order list, so match this vendor's own orders to the customer by phone
 * (last 9 digits, so "+233…" and "0…" agree) or, failing that, by exact name.
 */
function ordersFor(customer: VendorCustomerRead, orders: VendorOrder[]) {
  const phone = digits(customer.customer_phone);
  const name = customer.customer_name.trim().toLowerCase();
  return orders
    .filter((order) => (phone ? digits(order.buyerPhone) === phone : order.buyerName.trim().toLowerCase() === name))
    .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
}

function CustomerRow({ customer, onSelect }: { customer: VendorCustomerRead; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left hover:border-foreground/30"
    >
      <Media src={null} name={customer.customer_name} className="size-12 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{customer.customer_name}</p>
        {customer.customer_phone && <p className="mt-0.5 truncate text-xs text-muted">{customer.customer_phone}</p>}
        <p className="mt-0.5 text-xs text-muted">
          {customer.order_count} {customer.order_count === 1 ? "order" : "orders"}
          {customer.last_order_at && (
            <>
              {" "}
              · Last <time dateTime={customer.last_order_at}>{formatDate(customer.last_order_at)}</time>
            </>
          )}
        </p>
      </div>

      <p className="shrink-0 font-semibold tabular-nums">{formatMoney(customer.total_spent)}</p>
    </button>
  );
}

function CustomerDetails({ customer, orders, ordersLoading }: { customer: VendorCustomerRead; orders: VendorOrder[]; ordersLoading: boolean }) {
  const averageOrder = customer.order_count > 0 ? customer.total_spent / customer.order_count : 0;
  const address = orders[0]?.address;

  return (
    <div className="overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <Media src={null} name={customer.customer_name} className="size-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold tracking-normal">{customer.customer_name}</h3>
          {customer.last_order_at && <p className="text-sm text-muted">Last ordered {formatDate(customer.last_order_at)}</p>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-surface-muted p-4 text-center">
        <div>
          <p className="text-xs text-muted">Orders</p>
          <p className="mt-1 font-semibold tabular-nums">{customer.order_count}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Total spent</p>
          <p className="mt-1 font-semibold tabular-nums">{formatMoney(customer.total_spent)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Avg order</p>
          <p className="mt-1 font-semibold tabular-nums">{formatMoney(averageOrder)}</p>
        </div>
      </div>

      {(customer.customer_phone || address) && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold tracking-normal">Contact & shipping</h3>
          <div className="space-y-2 rounded-2xl border border-line bg-surface-muted p-4 text-sm leading-6 text-muted">
            {customer.customer_phone && (
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-muted" aria-hidden />
                <a href={`tel:${customer.customer_phone}`} className="hover:underline">
                  {customer.customer_phone}
                </a>
              </p>
            )}
            {address && (
              <p>
                {address.street}
                <br />
                {address.city}, {address.region}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold tracking-normal">Recent orders</h3>
        {ordersLoading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Their orders will show here.</p>
        ) : (
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
        )}
      </section>
    </div>
  );
}

export function VendorCustomersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading customers">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <div className="size-12 shrink-0 rounded-full bg-surface-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-32 rounded bg-surface-muted" />
            <div className="h-3 w-44 rounded bg-surface-muted" />
            <div className="h-3 w-28 rounded bg-surface-muted" />
          </div>
          <div className="h-5 w-20 shrink-0 rounded bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

/** Vendor → Customers: GET /vendor/customers (search on the server), with each buyer's orders in a drawer. */
export function VendorCustomersTab() {
  const [query, setQuery] = useState("");
  const customers = useVendorCustomers(query);
  const { orders, isLoading: ordersLoading } = useVendorOrders();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => customers.data ?? [], [customers.data]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = rows.find((c) => c.customer_key === selectedKey) ?? null;
  const notVendor = customers.error instanceof ApiError && customers.error.status === 403;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name or phone"
          aria-label="Search customers"
          className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
        />
      </div>

      {customers.isPending ? (
        <VendorCustomersSkeleton />
      ) : customers.isError ? (
        notVendor ? (
          <EmptyState
            icon={<Store className="size-10 text-muted" aria-hidden />}
            title="This account isn’t a vendor yet"
            description="Once your store is approved, the people who buy from you will be listed here."
          />
        ) : (
          <QueryError error={customers.error} onRetry={() => customers.refetch()} title="We couldn’t load your customers" />
        )
      ) : rows.length > 0 ? (
        <div className={customers.searching ? "opacity-60 transition-opacity" : undefined}>
          <ul className="space-y-3">
            {pageRows.map((customer) => (
              <li key={customer.customer_key}>
                <CustomerRow customer={customer} onSelect={() => setSelectedKey(customer.customer_key)} />
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      ) : query.trim() ? (
        <EmptyState icon={<Users className="size-10 text-muted" aria-hidden />} title="No customers match" description="Try a different name or number." />
      ) : (
        <EmptyState
          icon={<Users className="size-10 text-muted" aria-hidden />}
          title="No customers yet"
          description="When people order from your store, they’ll be listed here with what they’ve spent."
        />
      )}

      <Drawer
        open={selected !== null}
        onClose={() => setSelectedKey(null)}
        title={selected?.customer_name ?? "Customer"}
        labelId="vendor-customer-details-heading"
      >
        {selected && <CustomerDetails customer={selected} orders={ordersFor(selected, orders)} ordersLoading={ordersLoading} />}
      </Drawer>
    </div>
  );
}
