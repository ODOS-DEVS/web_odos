"use client";

import type { CSSProperties } from "react";
import { PackageOpen } from "lucide-react";
import { RequireLogin } from "@/components/auth/require-login";
import { FilterChip } from "@/components/product/filter-chip";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { QueryError } from "@/components/ui/query-error";
import { isActive } from "@/libs/orders";
import { MOCK_ORDERS } from "@/mocks/orders.mock";
import { fakeQuery } from "@/mocks/query";
import { OrderCard } from "./order-card";

const TABS = [
  { value: undefined, label: "All", href: "/orders" },
  { value: "active", label: "In progress", href: "/orders?status=active" },
  { value: "delivered", label: "Delivered", href: "/orders?status=delivered" },
] as const;

function OrdersList({ status }: { status?: string }) {
  const orders = fakeQuery(MOCK_ORDERS);

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

  const rows = orders.data.filter((order) => (status === "active" ? isActive(order.status) : status === "delivered" ? order.status === "delivered" : true));

  return rows.length > 0 ? (
    <ul className="mt-6 space-y-4">
      {rows.map((order, index) => (
        <li key={order.id} className="rise-in" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
          <OrderCard order={order} />
        </li>
      ))}
    </ul>
  ) : (
    <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-line px-6 py-20 text-center">
      <PackageOpen className="size-10 text-muted" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold">No orders here yet</h2>
      <ButtonLink href="/products" className="mt-6">
        Start shopping
      </ButtonLink>
    </div>
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
        <OrdersList status={status} />
      </RequireLogin>
    </Container>
  );
}
