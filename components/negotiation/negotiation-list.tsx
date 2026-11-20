"use client";

import Link from "next/link";
import { Handshake } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { useNegotiations } from "@/hooks/use-negotiations";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import type { Negotiation, NegotiationActor } from "@/types/negotiation";

export const NEGOTIATION_FILTERS = [
  { id: "all", label: "All" },
  { id: "awaiting_me", label: "Needs my reply" },
  { id: "awaiting_them", label: "Awaiting them" },
  { id: "agreed", label: "Agreed" },
  { id: "completed", label: "Purchased" },
  { id: "rejected", label: "Declined" },
  { id: "expired", label: "Expired" },
] as const;

const STATUS_TONE: Record<Negotiation["status"], BadgeTone> = {
  open: "warning",
  agreed: "success",
  completed: "success",
  rejected: "danger",
  withdrawn: "neutral",
  expired: "neutral",
};

/** What this row is waiting on, said in one line rather than left to a status word. */
function summary(n: Negotiation, viewerRole: NegotiationActor): string {
  if (n.status === "completed") return "Bought at the agreed price";
  if (n.status === "agreed" && n.agreement) {
    return viewerRole === "customer"
      ? `Agreed at ${formatMoney(n.agreement.agreedUnitPrice)} — ready to check out`
      : `Agreed at ${formatMoney(n.agreement.agreedUnitPrice)} — awaiting checkout`;
  }
  if (n.status === "expired") return "The agreed price expired";
  if (n.status === "rejected") return "Declined";
  if (n.awaiting === viewerRole) return "Your reply is needed";
  if (n.awaiting) return `Waiting on the ${n.awaiting === "vendor" ? "seller" : "buyer"}`;
  return "No offer on the table";
}

export function NegotiationList({
  viewerRole,
  filter,
  basePath,
}: {
  viewerRole: NegotiationActor;
  filter: string;
  /** Where a row links to — the two sides have their own detail routes. */
  basePath: string;
}) {
  const query = useNegotiations(viewerRole, filter);

  if (query.isError) {
    return <QueryError title="We couldn't load your negotiations" error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
        ))}
      </ul>
    );
  }

  const rows = query.data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Handshake className="size-10 text-muted" aria-hidden />}
        title={filter === "all" ? "No negotiations yet" : "Nothing here"}
        description={
          viewerRole === "customer"
            ? "Find a product marked “Price negotiable” and make the seller an offer."
            : "Offers from shoppers on your negotiable products will appear here."
        }
        action={
          viewerRole === "customer" ? (
            <ButtonLink href="/products" variant="accent">
              Browse products
            </ButtonLink>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((n) => {
        const latest = n.agreement?.agreedUnitPrice ?? n.latestOffer?.unitPrice ?? null;
        const needsMe = n.awaiting === viewerRole;
        return (
          <li key={n.id}>
            <Link
              href={`${basePath}/${n.id}`}
              className={cn(
                "press flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-colors hover:border-foreground/30",
                needsMe ? "border-accent/50" : "border-line",
              )}
            >
              <Media src={n.productImageUrl} name={n.productTitle} sizes="56px" className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{n.productTitle}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {viewerRole === "vendor" ? (n.customerName ?? "Shopper") : (n.storeName ?? "Seller")} · {n.reference}
                </p>
                <p className="mt-1 truncate text-xs text-muted">{summary(n, viewerRole)}</p>
              </div>
              <div className="shrink-0 text-right">
                {latest !== null && (
                  <p className="text-sm font-semibold">{formatMoney(latest)}</p>
                )}
                <p className="text-xs text-muted line-through">{formatMoney(n.listedUnitPrice)}</p>
                <Badge tone={STATUS_TONE[n.status]} className="mt-1.5">
                  {n.status}
                </Badge>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
