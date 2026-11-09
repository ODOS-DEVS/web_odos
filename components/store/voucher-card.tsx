"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { useClaimVoucher } from "@/hooks/use-product-extras";
import { formatMoneyCompact } from "@/libs/format";
import type { StoreVoucher } from "@/types/voucher";

function formatVoucherDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** One of a store's live vouchers (GET /vouchers/stores/{id}), claimable into the shopper's wallet. */
export function VoucherCard({ voucher, storeId }: { voucher: StoreVoucher; storeId: string }) {
  const session = useSession();
  const pathname = usePathname();
  const claim = useClaimVoucher(storeId);

  const onClaim = () =>
    claim.mutate(voucher.id, {
      onSuccess: () => toast.success(`${voucher.title} saved to your vouchers`),
      onError: (error) => toast.error(error.message),
    });

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted">Code {voucher.code}</span>
        <Badge className="max-w-[60%] truncate">{voucher.title}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold">{voucher.rewardText}</p>
      <p className="mt-1 text-sm text-muted">
        {voucher.minSubtotal > 0 ? `Min spend ${formatMoneyCompact(voucher.minSubtotal)}` : "No minimum spend"}
      </p>
      {voucher.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{voucher.description}</p>}
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex flex-col uppercase">
          <span className="text-[10px] font-medium leading-tight text-muted">Valid</span>
          <span className="text-[11px] font-semibold leading-tight tabular-nums">
            {voucher.expiresAt ? `Until ${formatVoucherDate(voucher.expiresAt)}` : "No expiry"}
          </span>
        </div>
        {voucher.claimed ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
            <Check className="size-4" aria-hidden /> Saved
          </span>
        ) : session ? (
          <Button size="sm" variant="outline" disabled={claim.isPending} onClick={onClaim}>
            {claim.isPending ? "Saving…" : "Save offer"}
          </Button>
        ) : (
          <ButtonLink size="sm" variant="outline" href={`/login?next=${encodeURIComponent(pathname)}`}>
            Log in to save
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
