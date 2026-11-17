"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader, Panel, PanelHeader, SkeletonRows } from "@/components/vendor/vendor-ui";
import { formatDate, formatMoney } from "@/libs/format";
import { useUpcomingFlashEvents } from "@/hooks/use-catalog";
import { useNominateForFlashSale, useVendorFlashNominations } from "@/hooks/use-vendor-store";
import { useVendorProducts } from "@/hooks/use-vendor";

const TONE: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

/**
 * Flash sale slots are allocated by ODOS, not self-served: a vendor nominates a product at a
 * price and ODOS approves or rejects it. The form mirrors that — it submits a request, and the
 * list below shows where each request got to.
 */
export function FlashSalesView() {
  const nominations = useVendorFlashNominations();
  const products = useVendorProducts();
  const events = useUpcomingFlashEvents();
  const nominate = useNominateForFlashSale();

  const [productId, setProductId] = useState("");
  const [eventId, setEventId] = useState("");
  const [price, setPrice] = useState("");
  const [stockLimit, setStockLimit] = useState("");
  const [maxPerUser, setMaxPerUser] = useState("");
  const [note, setNote] = useState("");

  const selected = products.data?.find((p) => p.id === productId);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!productId || !price) return;

    nominate.mutate(
      {
        productId,
        eventId: eventId || null,
        proposedPrice: Number(price),
        proposedOldPrice: selected?.price ?? null,
        stockLimit: stockLimit ? Number(stockLimit) : null,
        maxPerUser: maxPerUser ? Number(maxPerUser) : null,
        vendorNote: note.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Nomination sent to ODOS for review");
          setProductId("");
          setPrice("");
          setStockLimit("");
          setMaxPerUser("");
          setNote("");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't send that nomination."),
      },
    );
  };

  if (nominations.isError) {
    return <QueryError title="We couldn't load your flash sales" error={nominations.error} onRetry={() => nominations.refetch()} />;
  }

  const rows = nominations.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Flash sales"
        description="Nominate a product at a discount. ODOS reviews every nomination before it goes live."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <PanelHeader title="Nominate a product" />
          <form onSubmit={onSubmit} className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Product</span>
              <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)} required>
                <option value="">Choose a product</option>
                {products.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(p.price)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Event</span>
              <select className={inputClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">Any upcoming event</option>
                {events.data?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Flash price (GH₵)</span>
              <input className={inputClass} inputMode="numeric" value={price} onChange={(e) => setPrice(digitsOnly(e.target.value))} required />
              {selected && (
                <span className="mt-1 block text-xs text-muted">
                  Normally {formatMoney(selected.price)}
                  {price && Number(price) < selected.price &&
                    ` · ${Math.round((1 - Number(price) / selected.price) * 100)}% off`}
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Units</span>
                <input className={inputClass} inputMode="numeric" value={stockLimit} onChange={(e) => setStockLimit(digitsOnly(e.target.value))} placeholder="All" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Max each</span>
                <input className={inputClass} inputMode="numeric" value={maxPerUser} onChange={(e) => setMaxPerUser(digitsOnly(e.target.value))} placeholder="No cap" />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Note to ODOS</span>
              <textarea className={`${inputClass} h-20 resize-y py-3`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
            </label>

            <Button type="submit" className="w-full" disabled={nominate.isPending || !productId || !price}>
              {nominate.isPending ? "Sending…" : "Submit nomination"}
            </Button>
          </form>
        </Panel>

        <div className="lg:col-span-2">
          {nominations.isPending ? (
            <SkeletonRows count={3} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Zap className="size-10 text-muted" aria-hidden />}
              title="No nominations yet"
              description="Nominate a product and it appears here with its review status."
            />
          ) : (
            <Panel>
              <PanelHeader title={`Your nominations (${rows.length})`} />
              <ul className="divide-y divide-line">
                {rows.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                    <Media src={n.productImageUrl} name={n.productTitle ?? "Product"} sizes="48px" className="size-12 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.productTitle ?? n.productId}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {n.eventTitle ?? "Any event"} · submitted {formatDate(n.createdAt)}
                      </p>
                      {n.proposedPrice !== null && (
                        <p className="mt-1 text-xs">
                          <span className="font-semibold">{formatMoney(n.proposedPrice)}</span>
                          {n.proposedOldPrice !== null && (
                            <span className="ml-1.5 text-muted line-through">{formatMoney(n.proposedOldPrice)}</span>
                          )}
                          {n.stockLimit !== null && <span className="ml-2 text-muted">{n.stockLimit} units</span>}
                        </p>
                      )}
                      {n.reviewNotes && <p className="mt-1 text-xs text-muted">ODOS said: {n.reviewNotes}</p>}
                      {n.status === "approved" && n.unitsSold !== null && (
                        <p className="mt-1 text-xs text-success">
                          {n.unitsSold} sold{n.unitsRemaining !== null && ` · ${n.unitsRemaining} left`}
                        </p>
                      )}
                    </div>
                    <Badge tone={TONE[n.status] ?? "neutral"}>{n.status}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
