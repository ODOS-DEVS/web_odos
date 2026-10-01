"use client";

import type { CSSProperties } from "react";
import { Store as StoreIcon } from "lucide-react";
import { StoreCard, StoreCardSkeleton } from "@/components/store/store-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { MOCK_STORES } from "@/mocks/catalog.mock";
import { fakeQuery } from "@/mocks/query";

export function StoresView() {
  const stores = fakeQuery(MOCK_STORES);

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Stores</h1>
        <p className="mt-2 text-muted">Every store on ODOS packs and delivers its own orders, and sets its own delivery rates.</p>
      </header>

      {stores.isPending ? (
        <ul className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <StoreCardSkeleton />
            </li>
          ))}
        </ul>
      ) : stores.isError ? (
        <QueryError error={stores.error} onRetry={() => stores.refetch()} title="We couldn’t load stores" />
      ) : stores.data.length === 0 ? (
        <EmptyState icon={<StoreIcon className="size-10 text-muted" aria-hidden />} title="No stores yet" description="Check back soon." />
      ) : (
        <ul className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {stores.data.map((store, index) => (
            <li key={store.id} className="rise-in" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
              <StoreCard store={store} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
