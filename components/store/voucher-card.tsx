import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoneyCompact } from "@/libs/format";
import type { Voucher } from "@/types/catalog";

function formatVoucherDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function VoucherCard({ voucher }: { voucher: Voucher }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted">Fix Amount</span>
        <Badge>{voucher.label}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold">{formatMoneyCompact(voucher.amountOff)} OFF</p>
      <p className="mt-1 text-sm text-muted">Min spent {formatMoneyCompact(voucher.minSpend)}</p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex flex-col uppercase">
          <span className="text-[10px] font-medium leading-tight text-muted">Valid</span>
          <span className="text-[11px] font-semibold leading-tight tabular-nums">{formatVoucherDate(voucher.expiresAt)}</span>
        </div>
        <Button size="sm" variant="outline">
          Save offer
        </Button>
      </div>
    </div>
  );
}
