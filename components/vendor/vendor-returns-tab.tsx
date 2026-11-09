"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, Package, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { useVendorReturns } from "@/hooks/use-vendor";
import { formatDate } from "@/libs/format";
import type { VendorReturnRequestRead } from "@/types/vendor";

export function VendorReturnsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading returns">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 animate-pulse">
          <div className="size-14 shrink-0 rounded-xl bg-surface-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4.5 w-36 rounded bg-surface-muted" />
            <div className="h-3.5 w-52 rounded bg-surface-muted" />
            <div className="h-3 w-28 rounded bg-surface-muted" />
          </div>
          <div className="h-6 w-20 rounded-full bg-surface-muted shrink-0" />
        </div>
      ))}
    </div>
  );
}

function ReturnDetailDrawer({
  returnItem,
  onClose,
}: {
  returnItem: VendorReturnRequestRead;
  onClose: () => void;
}) {
  const { patchReturn, isPatching } = useVendorReturns();
  const [adminNote, setAdminNote] = useState(returnItem.admin_note ?? "");

  const onUpdate = async (status: "approved" | "rejected") => {
    try {
      await patchReturn({
        id: returnItem.id,
        input: {
          status,
          admin_note: adminNote.trim() || undefined,
        },
      });
      toast.success(`Return request ${status}`);
      onClose();
    } catch {
      toast.error(`Failed to update return request`);
    }
  };

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center gap-3">
        <Media
          src={returnItem.product_image_url ?? null}
          name={returnItem.product_title}
          sizes="64px"
          className="size-16 shrink-0 rounded-xl"
        />
        <div className="min-w-0">
          <p className="font-semibold">{returnItem.product_title}</p>
          <p className="text-xs text-muted">
            Order {returnItem.order_number} · Qty {returnItem.quantity}
          </p>
          <p className="text-xs text-muted">Customer: {returnItem.customer_name ?? "Buyer"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface-muted p-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted">Type:</span>
          <span className="font-medium uppercase">{returnItem.request_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Reason:</span>
          <span className="font-medium">{returnItem.reason}</span>
        </div>
        {returnItem.details && (
          <div className="pt-2 border-t border-line/60">
            <span className="text-muted block mb-1">Customer notes:</span>
            <p className="text-foreground leading-relaxed">{returnItem.details}</p>
          </div>
        )}
      </div>

      {returnItem.evidence_image_urls && returnItem.evidence_image_urls.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2">Customer Evidence Photos</p>
          <div className="flex gap-2 overflow-x-auto">
            {returnItem.evidence_image_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <Media src={url} name={`Evidence ${i + 1}`} sizes="80px" className="size-20 shrink-0 rounded-xl" />
              </a>
            ))}
          </div>
        </div>
      )}

      {returnItem.status === "pending" ? (
        <div className="space-y-3 pt-3 border-t border-line">
          <div className="space-y-1.5">
            <label htmlFor="admin-note" className="text-xs font-semibold text-muted">
              Resolution Note (Optional)
            </label>
            <input
              id="admin-note"
              type="text"
              placeholder="e.g. Approved for refund upon drop-off"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted/60"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="accent"
              className="flex-1"
              disabled={isPatching}
              onClick={() => onUpdate("approved")}
            >
              <CheckCircle2 className="size-4 mr-1.5" /> Approve return
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-danger hover:border-danger hover:text-danger"
              disabled={isPatching}
              onClick={() => onUpdate("rejected")}
            >
              <XCircle className="size-4 mr-1.5" /> Decline
            </Button>
          </div>
        </div>
      ) : (
        <Badge tone={returnItem.status === "approved" ? "success" : "danger"} className="capitalize">
          {returnItem.status}
        </Badge>
      )}
    </div>
  );
}

export function VendorReturnsTab() {
  const { returns, isLoading } = useVendorReturns();
  const [selectedReturn, setSelectedReturn] = useState<VendorReturnRequestRead | null>(null);

  if (isLoading && returns.length === 0) {
    return <VendorReturnsSkeleton />;
  }

  if (returns.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-10 text-muted" aria-hidden />}
        title="No return requests"
        description="Buyer exchange and return claims for your store's items will show here for your review and resolution."
      />
    );
  }

  return (
    <div className="space-y-4">
      {returns.map((ret) => (
        <div
          key={ret.id}
          className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4.5"
        >
          <Media
            src={ret.product_image_url ?? null}
            name={ret.product_title}
            sizes="56px"
            className="size-14 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{ret.product_title}</p>
              <Badge tone={ret.status === "approved" ? "success" : ret.status === "rejected" ? "danger" : "warning"}>
                {ret.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted truncate">
              Order {ret.order_number} · Reason: {ret.reason}
            </p>
            <p className="mt-1 text-xs text-muted">Requested on {formatDate(ret.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedReturn(ret)}
            aria-label={`View return request for ${ret.product_title}`}
            className="press grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface-muted text-muted hover:border-foreground hover:text-foreground"
          >
            <Eye className="size-4" />
          </button>
        </div>
      ))}

      <Drawer
        open={selectedReturn !== null}
        onClose={() => setSelectedReturn(null)}
        title="Return Request Details"
        labelId="return-request-details-heading"
      >
        {selectedReturn && <ReturnDetailDrawer returnItem={selectedReturn} onClose={() => setSelectedReturn(null)} />}
      </Drawer>
    </div>
  );
}

