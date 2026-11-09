"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { useVendorVouchers } from "@/hooks/use-vendor";
import { formatDate } from "@/libs/format";

export function VendorVouchersSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading vouchers">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 animate-pulse">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 rounded bg-surface-muted" />
            <div className="h-4 w-48 rounded bg-surface-muted" />
          </div>
          <div className="size-8 rounded-full bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

function CreateVoucherForm({ onDone }: { onDone: () => void }) {
  const { createVoucher, isMutating } = useVendorVouchers();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<"fixed_amount" | "percentage">("fixed_amount");
  const [discountValue, setDiscountValue] = useState("10");
  const [minSubtotal, setMinSubtotal] = useState("50");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createVoucher({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_subtotal: Number(minSubtotal),
        reward_text:
          discountType === "fixed_amount"
            ? `GH¢${discountValue} off on orders over GH¢${minSubtotal}`
            : `${discountValue}% off on orders over GH¢${minSubtotal}`,
        owner_type: "vendor",
        availability: "public",
      });
      toast.success("Voucher created successfully");
      onDone();
    } catch {
      toast.error("Failed to create voucher");
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Create Store Voucher</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDiscountType("fixed_amount")}
            className={`rounded-xl px-2.5 py-1 text-xs font-medium border transition-colors ${
              discountType === "fixed_amount" ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"
            }`}
          >
            Fixed GH¢
          </button>
          <button
            type="button"
            onClick={() => setDiscountType("percentage")}
            className={`rounded-xl px-2.5 py-1 text-xs font-medium border transition-colors ${
              discountType === "percentage" ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"
            }`}
          >
            Percentage %
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="voucher-code"
          label="Voucher Code"
          placeholder="e.g. SAVE10"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <Field
          id="voucher-title"
          label="Headline / Label"
          placeholder="e.g. GH¢10 off store items"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Field
          id="voucher-discount"
          label={discountType === "fixed_amount" ? "Discount (GH¢)" : "Discount (%)"}
          type="number"
          min="1"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          required
        />
        <Field
          id="voucher-min"
          label="Minimum Order Subtotal (GH¢)"
          type="number"
          min="0"
          value={minSubtotal}
          onChange={(e) => setMinSubtotal(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="accent" disabled={isMutating}>
          {isMutating ? "Creating…" : "Save Voucher"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={isMutating}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function VendorVouchersTab() {
  const { vouchers, isLoading, deleteVoucher, isMutating } = useVendorVouchers();
  const [creating, setCreating] = useState(false);

  if (isLoading && vouchers.length === 0) {
    return <VendorVouchersSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Store Vouchers</h2>
        {!creating && (
          <Button variant="accent" size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4 mr-1.5" /> New voucher
          </Button>
        )}
      </div>

      {creating && <CreateVoucherForm onDone={() => setCreating(false)} />}

      {vouchers.length === 0 && !creating ? (
        <EmptyState
          icon={<Ticket className="size-10 text-muted" aria-hidden />}
          title="No vouchers active"
          description="Create coupon codes to incentivize buyers and increase basket sizes in your store."
          action={
            <Button variant="accent" size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4 mr-1.5" /> Create voucher
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {vouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-5"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-md">
                    {voucher.code}
                  </span>
                  <Badge tone={voucher.is_active !== false ? "success" : "neutral"}>
                    {voucher.is_active !== false ? "Active" : "Expired"}
                  </Badge>
                </div>
                <p className="font-semibold text-sm truncate">{voucher.title}</p>
                <p className="text-xs text-muted leading-relaxed">{voucher.reward_text}</p>
                {voucher.expires_at && (
                  <p className="text-[11px] text-muted">Expires {formatDate(voucher.expires_at)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteVoucher(voucher.id);
                    toast.success("Voucher deleted");
                  } catch {
                    toast.error("Failed to delete voucher");
                  }
                }}
                disabled={isMutating}
                aria-label={`Delete voucher ${voucher.code}`}
                className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

