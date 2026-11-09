"use client";

import { usePathname } from "next/navigation";
import { Check, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { useSession } from "@/hooks/use-auth";
import { useClaimVoucher, useStoreVouchers } from "@/hooks/use-product-extras";
import { formatDate, formatMoneyCompact } from "@/libs/format";
import type { StoreVoucher } from "@/types/voucher";

/** The vendor's live vouchers, each claimable into the shopper's wallet. Hidden when there are none. */
export function ProductVouchers({ storeId, storeName }: { storeId: string; storeName: string }) {
  const vouchers = useStoreVouchers(storeId);
  if (!vouchers.data || vouchers.data.length === 0) return null;

  return (
    <section aria-labelledby="vouchers-heading" className="rounded-2xl border border-line bg-surface p-5">
      <h2 id="vouchers-heading" className="flex items-center gap-2 text-sm font-semibold">
        <TicketPercent className="size-4 text-accent" aria-hidden />
        Vouchers from {storeName}
      </h2>
      <ul className="mt-4 space-y-3">
        {vouchers.data.map((voucher) => (
          <VoucherRow key={voucher.id} voucher={voucher} storeId={storeId} />
        ))}
      </ul>
    </section>
  );
}

function VoucherRow({ voucher, storeId }: { voucher: StoreVoucher; storeId: string }) {
  const session = useSession();
  const pathname = usePathname();
  const claim = useClaimVoucher(storeId);

  const conditions = [
    voucher.minSubtotal > 0 ? `Min spend ${formatMoneyCompact(voucher.minSubtotal)}` : "No minimum spend",
    voucher.expiresAt ? `Until ${formatDate(voucher.expiresAt)}` : null,
  ].filter(Boolean);

  const onClaim = () =>
    claim.mutate(voucher.id, {
      onSuccess: () => toast.success(`${voucher.title} saved to your vouchers`),
      onError: (error) => toast.error(error.message),
    });

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{voucher.rewardText}</p>
        <p className="truncate text-xs text-muted">{voucher.title}</p>
        <p className="mt-0.5 text-xs text-muted">{conditions.join(" · ")}</p>
      </div>
      {voucher.claimed ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
          <Check className="size-3.5" aria-hidden /> Saved
        </span>
      ) : session ? (
        <Button size="sm" variant="outline" className="shrink-0" disabled={claim.isPending} onClick={onClaim}>
          {claim.isPending ? "Saving…" : "Claim"}
        </Button>
      ) : (
        <ButtonLink size="sm" variant="outline" className="shrink-0" href={`/login?next=${encodeURIComponent(pathname)}`}>
          Log in to claim
        </ButtonLink>
      )}
    </li>
  );
}
