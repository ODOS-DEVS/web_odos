"use client";

import { useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { QueryError } from "@/components/ui/query-error";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useUpdateVendorReturn, useVendorReturns } from "@/hooks/use-vendor-ops";
import { formatDate, formatMoney } from "@/libs/format";
import type { VendorReturn } from "@/types/vendor";

/** Statuses with nothing left to decide. Everything else is the vendor's queue. */
const RESOLVED = new Set(["rejected", "refunded", "exchanged"]);

const STATUS_TONE: Record<string, BadgeTone> = {
  requested: "warning",
  under_review: "warning",
  approved: "accent",
  awaiting_return: "accent",
  received: "accent",
  refunded: "success",
  exchanged: "success",
  rejected: "danger",
};

/**
 * What the vendor may do next, mirroring the API's transition table: review
 * and decide while open, receive once approved, refund only after the goods
 * are back. "Refunded" from any earlier state is refused server-side (goods
 * not accounted for), so it is never offered early here.
 */
function actionsFor(status: string): { status: string; label: string; confirm?: { title: string; body: string }; destructive?: boolean }[] {
  switch (status) {
    case "requested":
      return [
        { status: "under_review", label: "Start reviewing" },
        { status: "approved", label: "Approve", confirm: { title: "Approve this return?", body: "The shopper will be told to send the item back." } },
        { status: "rejected", label: "Decline", destructive: true, confirm: { title: "Decline this return?", body: "The shopper is notified and this can’t be reopened." } },
      ];
    case "under_review":
      return [
        { status: "approved", label: "Approve", confirm: { title: "Approve this return?", body: "The shopper will be told to send the item back." } },
        { status: "rejected", label: "Decline", destructive: true, confirm: { title: "Decline this return?", body: "The shopper is notified and this can’t be reopened." } },
      ];
    case "approved":
    case "awaiting_return":
      return [
        { status: "received", label: "Mark item received", confirm: { title: "Item received?", body: "Confirm the returned item is back with you. Refunding becomes possible after this." } },
        { status: "rejected", label: "Decline", destructive: true, confirm: { title: "Decline this return?", body: "The shopper is notified and this can’t be reopened." } },
      ];
    case "received":
      return [
        { status: "refunded", label: "Refund the shopper", confirm: { title: "Refund this return?", body: "The amount moves out of your wallet balance. Refunds above the self-service limit are settled by ODOS instead — you’ll be told if this is one." } },
      ];
    default:
      return [];
  }
}

const formatStatus = (status: string) => status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function ReturnDetails({ item, onClose }: { item: VendorReturn; onClose: () => void }) {
  const update = useUpdateVendorReturn();
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<ReturnType<typeof actionsFor>[number] | null>(null);

  const apply = (status: string) => {
    update.mutate(
      { id: item.id, status, note: note.trim() || undefined },
      {
        onSuccess: (updated) => {
          setPendingAction(null);
          toast.success(`Return marked ${formatStatus(updated.status).toLowerCase()}`);
          if (RESOLVED.has(updated.status)) onClose();
        },
        onError: (e) => {
          setPendingAction(null);
          toast.error(e instanceof Error ? e.message : "We couldn’t update this return.");
        },
      },
    );
  };

  const actions = actionsFor(item.status);
  const refund = item.refundAmount;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center gap-3">
        <Media src={item.productImageUrl} name={item.productTitle} className="size-14 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-normal">{item.productTitle}</p>
          <p className="text-sm text-muted">
            Order {item.orderNumber} · Qty {item.quantity}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[item.status] ?? "neutral"}>{formatStatus(item.status)}</Badge>
        <Badge tone="neutral">{item.requestType === "exchange" ? "Exchange" : "Refund"} request</Badge>
        {refund !== null && <Badge tone="neutral">{formatMoney(refund)}</Badge>}
      </div>

      <dl className="mt-5 space-y-3 rounded-2xl border border-line bg-surface-muted p-4 text-sm">
        <div>
          <dt className="text-xs text-muted">Customer</dt>
          <dd className="mt-0.5 font-medium">{item.customerName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Reason</dt>
          <dd className="mt-0.5">{item.reason}</dd>
        </div>
        {item.details && (
          <div>
            <dt className="text-xs text-muted">Details</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{item.details}</dd>
          </div>
        )}
        {item.adminNote && (
          <div>
            <dt className="text-xs text-muted">Note on file</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{item.adminNote}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted">Requested</dt>
          <dd className="mt-0.5">
            <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
          </dd>
        </div>
      </dl>

      {item.evidenceImageUrls.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold tracking-normal">Shopper’s photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {item.evidenceImageUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="press block overflow-hidden rounded-xl border border-line">
                <Media src={url} name="Evidence photo" className="aspect-square w-full" />
              </a>
            ))}
          </div>
        </section>
      )}

      {actions.length > 0 && (
        <section className="mt-6">
          <label htmlFor="return-note" className="mb-1.5 block text-sm font-medium">
            Note to the shopper <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="return-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Saved with whichever decision you take below"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm placeholder:text-muted/70 focus:border-foreground focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.destructive ? "outline" : "primary"}
                disabled={update.isPending}
                className={action.destructive ? "border-danger text-danger hover:bg-danger-soft" : undefined}
                onClick={() => (action.confirm ? setPendingAction(action) : apply(action.status))}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.confirm?.title ?? ""}
        description={pendingAction?.confirm?.body}
        confirmLabel={update.isPending ? "Working…" : (pendingAction?.label ?? "Confirm")}
        pending={update.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && apply(pendingAction.status)}
      />
    </div>
  );
}

export function VendorReturnsTab() {
  const returns = useVendorReturns();
  const [queue, setQueue] = useState<"open" | "resolved">("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = returns.data ?? [];
    return all.filter((r) => RESOLVED.has(r.status) === (queue === "resolved"));
  }, [returns.data, queue]);

  if (returns.isPending) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  if (returns.isError) return <QueryError error={returns.error} onRetry={() => returns.refetch()} />;

  const all = returns.data ?? [];
  const openCount = all.filter((r) => !RESOLVED.has(r.status)).length;
  const selected = all.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <TogglePill selected={queue === "open"} onClick={() => setQueue("open")}>
          Open{openCount > 0 && ` (${openCount})`}
        </TogglePill>
        <TogglePill selected={queue === "resolved"} onClick={() => setQueue("resolved")}>
          Resolved
        </TogglePill>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left"
              >
                <Media src={item.productImageUrl} name={item.productTitle} className="size-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.productTitle}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {item.customerName} · Order {item.orderNumber} · {item.reason}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                  </p>
                </div>
                <Badge tone={STATUS_TONE[item.status] ?? "neutral"} className="shrink-0">
                  {formatStatus(item.status)}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<PackageSearch className="size-10 text-muted" aria-hidden />}
          title={queue === "open" ? "No open returns" : "No resolved returns yet"}
          description={
            queue === "open"
              ? "When a shopper asks to return one of your products, it lands here for your decision."
              : "Returns you’ve refunded, exchanged or declined will show up here."
          }
        />
      )}

      <Drawer open={selected !== null} onClose={() => setSelectedId(null)} title="Return request" labelId="vendor-return-details-heading">
        {selected && <ReturnDetails item={selected} onClose={() => setSelectedId(null)} />}
      </Drawer>
    </div>
  );
}
