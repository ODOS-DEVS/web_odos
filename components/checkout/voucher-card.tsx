"use client";

import { useState } from "react";
import { Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useSavedVouchers } from "@/hooks/use-vouchers";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { ApiError } from "@/services/http";
import { vouchersService, type VoucherPreview } from "@/services/vouchers.service";
import type { CartLine } from "@/types/cart";

function formatVoucherDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function VoucherCard({
  lines,
  subtotal,
  shipping,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
}: {
  lines: CartLine[];
  subtotal: number;
  shipping: number | null;
  appliedVoucher: VoucherPreview | null;
  onApplyVoucher: (voucher: VoucherPreview) => void;
  onRemoveVoucher: () => void;
}) {
  const [code, setCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const { vouchers: savedVouchers, isPending: walletPending } = useSavedVouchers();

  const applyCode = async (rawCode: string) => {
    const trimmed = rawCode.trim().toUpperCase();
    if (!trimmed) return;

    setIsApplying(true);
    try {
      const preview = await vouchersService.preview({
        voucher_code: trimmed,
        items: lines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          unit_price: l.price,
        })),
        shipping_amount: shipping ?? 0,
      });
      onApplyVoucher(preview);
      toast.success(`Voucher "${preview.code}" applied!`);
      setCode("");
      setWalletOpen(false);
    } catch (err) {
      // The server's refusal is the answer — its message names the actual
      // reason (expired, limit reached, items not eligible). An earlier
      // version "recovered" here by regex-guessing a discount from the reward
      // text and applying it anyway, which the order endpoint then rejected
      // at the final step — a checkout dead end instead of an honest no.
      toast.error(err instanceof ApiError ? err.message : "We couldn’t check that code. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <section
        aria-label="Voucher"
        className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-normal text-foreground">Voucher</h2>
          <button
            type="button"
            onClick={() => setWalletOpen(true)}
            className="press rounded-full bg-surface-muted px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-line"
          >
            Browse Wallet
          </button>
        </div>

        {appliedVoucher ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-muted p-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="accent">{appliedVoucher.code}</Badge>
                <span className="truncate text-xs font-medium text-foreground">{appliedVoucher.reward_text}</span>
              </div>
              <p className="mt-1 text-xs text-success">
                −{formatMoney(appliedVoucher.discount_amount)} discount applied
              </p>
            </div>
            <button
              type="button"
              onClick={onRemoveVoucher}
              aria-label="Remove voucher"
              className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-line hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="mt-4 flex gap-2.5">
            <input
              type="text"
              placeholder="Enter voucher code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCode(code);
                }
              }}
              className="h-11 flex-1 rounded-full bg-surface-muted px-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent"
            />
            <Button
              type="button"
              variant="accent"
              size="md"
              disabled={!code.trim() || isApplying}
              onClick={() => applyCode(code)}
              className="h-11 rounded-full px-6 font-semibold"
            >
              {isApplying ? "Applying…" : "Apply"}
            </Button>
          </div>
        )}

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Apply an Odos promo here, or pick a claimed store offer from your wallet
        </p>
      </section>

      <Drawer
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        title="Your Voucher Wallet"
        labelId="voucher-wallet-heading"
      >
        <div className="flex-1 overflow-y-auto p-5">
          {walletPending ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </div>
          ) : savedVouchers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-muted">
                <Ticket className="size-6 text-muted" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-semibold">No saved vouchers</p>
              <p className="mt-1 text-xs text-muted">
                Claim vouchers on store pages or promotions to use them at checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedVouchers.map((voucher) => {
                const eligible = voucher.minSpend <= 0 || subtotal >= voucher.minSpend;
                const isSelected = appliedVoucher?.code.toUpperCase() === voucher.code.toUpperCase();

                return (
                  <div
                    key={voucher.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      isSelected
                        ? "border-accent bg-accent/5"
                        : eligible
                          ? "border-line bg-surface hover:border-line-strong"
                          : "border-line/60 bg-surface-muted/40 opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-xs font-semibold tracking-wider text-accent">
                        {voucher.code}
                      </span>
                      <Badge tone="accent">{voucher.label}</Badge>
                    </div>

                    <p className="mt-2 text-xl font-semibold">{voucher.rewardText}</p>

                    <p className="mt-1 text-xs text-muted">
                      {voucher.minSpend > 0 ? `Min spend ${formatMoney(voucher.minSpend)}` : "No minimum spend"}
                      {voucher.expiresAt && ` · Valid until ${formatVoucherDate(voucher.expiresAt)}`}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/60 pt-3">
                      {!eligible ? (
                        <span className="text-xs text-muted">
                          Spend {formatMoney(voucher.minSpend - subtotal)} more to qualify
                        </span>
                      ) : (
                        <span className="text-xs text-success">Eligible for this order</span>
                      )}

                      {isSelected ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onRemoveVoucher();
                            setWalletOpen(false);
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="accent"
                          size="sm"
                          disabled={!eligible || isApplying}
                          onClick={() => applyCode(voucher.code)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}

