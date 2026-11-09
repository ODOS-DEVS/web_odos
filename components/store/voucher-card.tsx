"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { useClaimVoucher } from "@/hooks/use-vouchers";
import { formatMoneyCompact } from "@/libs/format";
import type { Voucher } from "@/types/catalog";

function formatVoucherDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function VoucherCard({ voucher }: { voucher: Voucher }) {
  const session = useSession();
  const claim = useClaimVoucher();

  const onClaim = () =>
    claim.mutate(voucher.id, {
      onSuccess: () => toast.success("Offer saved to your wallet"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "We couldn't save that offer"),
    });

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted">{voucher.issuerName ?? "Offer"}</span>
        <Badge>{voucher.title}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold">{voucher.rewardText}</p>
      <p className="mt-1 text-sm text-muted">
        {voucher.minSpend > 0 ? `Min spend ${formatMoneyCompact(voucher.minSpend)}` : "No minimum spend"}
      </p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex flex-col uppercase">
          <span className="text-[10px] font-medium leading-tight text-muted">{voucher.expiresAt ? "Valid" : "Offer"}</span>
          <span className="text-[11px] font-semibold leading-tight tabular-nums">
            {voucher.expiresAt ? formatVoucherDate(voucher.expiresAt) : "No end date"}
          </span>
        </div>
        {voucher.claimed ? (
          <Badge tone="accent">Saved</Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onClaim}
            // Claiming writes to the shopper's own wallet, so it needs a session.
            disabled={!session || claim.isPending}
            title={session ? undefined : "Log in to save this offer"}
          >
            {claim.isPending ? "Saving…" : "Save offer"}
          </Button>
        )}
      </div>
    </div>
  );
}
