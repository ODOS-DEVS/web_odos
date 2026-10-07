"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, Copy, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";
import { useSavedVouchers } from "@/hooks/use-saved-vouchers";
import { cn } from "@/libs/cn";
import { formatMoneyCompact } from "@/libs/format";
import type { SavedVoucher } from "@/types/voucher";

function formatVoucherDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function RedeemForm() {
  const { redeem } = useSavedVouchers();
  const [code, setCode] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = redeem(code);
    if (result === "ok") {
      toast.success("Voucher added to your wallet");
      setCode("");
    } else if (result === "already-redeemed") {
      toast.error("You've already redeemed this code");
    } else {
      toast.error("That code isn't valid or has expired");
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-sm font-semibold">Redeem a code</h2>
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          placeholder="Enter voucher code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={cn(inputClass, "sm:flex-1")}
        />
        <Button type="submit" variant="accent" disabled={!code.trim()} className="sm:w-auto">
          Redeem
        </Button>
      </div>
    </form>
  );
}

function SavedVoucherCard({ voucher }: { voucher: SavedVoucher }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the code");
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted">Voucher</span>
        <Badge tone="accent">{voucher.label}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold">{formatMoneyCompact(voucher.amountOff)} OFF</p>
      <p className="mt-1 text-sm text-muted">
        {voucher.minSpend > 0 ? `Min spend ${formatMoneyCompact(voucher.minSpend)}` : "No minimum spend"}
      </p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex flex-col uppercase">
          <span className="text-[10px] font-medium leading-tight text-muted">Expires</span>
          <span className="text-[11px] font-semibold leading-tight tabular-nums">{formatVoucherDate(voucher.expiresAt)}</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="press inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-foreground"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span className="font-mono tracking-wide">{voucher.code}</span>
        </button>
      </div>
    </div>
  );
}

export function VouchersTab() {
  const { vouchers } = useSavedVouchers();

  return (
    <div className="space-y-5">
      <RedeemForm />

      {vouchers.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-6 text-muted" aria-hidden />}
          iconBadge
          title="No vouchers yet"
          description="Vouchers you save from a store, or redeem with a code, will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {vouchers.map((voucher) => (
            <SavedVoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </div>
      )}
    </div>
  );
}
