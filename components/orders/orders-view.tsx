"use client";

import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import { RequireLogin } from "@/components/auth/require-login";
import { FilterChip } from "@/components/product/filter-chip";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { useOrders } from "@/hooks/use-orders";
import { isActive } from "@/libs/orders";
import { OrderCard } from "./order-card";

const TABS = [
  { value: undefined, label: "All", href: "/orders" },
  { value: "active", label: "In progress", href: "/orders?status=active" },
  { value: "delivered", label: "Delivered", href: "/orders?status=delivered" },
] as const;

const ORDERS_PER_PAGE = 6;

function OrdersList({ status }: { status?: string }) {
  const orders = useOrders();
  const [page, setPage] = useState(1);

  if (orders.isPending) {
    return (
      <div className="mt-6 space-y-4" aria-busy="true" aria-label="Loading orders">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
        ))}
      </div>
    );
  }
  if (orders.isError) return <div className="mt-6"><QueryError error={orders.error} onRetry={() => orders.refetch()} title="We couldn’t load your orders" /></div>;

  const rows = (orders.data ?? []).filter((order) => (status === "active" ? isActive(order.status) : status === "delivered" ? order.status === "delivered" : true));
  const pageCount = Math.ceil(rows.length / ORDERS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const visibleRows = rows.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  return rows.length > 0 ? (
    <>
      <ul className="mt-6 space-y-4">
        {visibleRows.map((order, index) => (
          <li key={order.id} className="rise-in" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Order pages">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                variant={currentPage === pageNumber ? "primary" : "ghost"}
                size="icon"
                className="size-9"
                aria-label={`Page ${pageNumber}`}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      )}
    </>
  ) : (
    <EmptyState
      icon={<PackageOpen className="size-10 text-muted" aria-hidden />}
      title="No orders here yet"
      className="mt-6"
      action={<ButtonLink href="/products">Start shopping</ButtonLink>}
    />
  );
}

export function OrdersView({ status }: { status?: string }) {
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <h1 className="text-3xl font-semibold sm:text-4xl">Your orders</h1>
      <p className="mt-2 text-muted">Track each vendor’s package from one place.</p>

      <RequireLogin next="/orders" message="Log in to see your orders and track every delivery.">
        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <FilterChip key={tab.label} href={tab.href} active={status === tab.value}>
              {tab.label}
            </FilterChip>
          ))}
        </div>
        <OrdersList key={status ?? "all"} status={status} />
      </RequireLogin>
    </Container>
  );
}
