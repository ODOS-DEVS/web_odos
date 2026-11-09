"use client";

import { formatMoney } from "@/libs/format";
import { ChoiceCard } from "./choice-card";
import { LogoBadge, type Logo } from "./logo-badge";

/**
 * How the order is paid:
 * - `online`: the hosted payment page (Kutanapay), where the shopper picks mobile money or card;
 * - `wallet`: straight from the ODOS Wallet, no redirect — offered only when the balance covers the total.
 */
export type PaymentChoice = "online" | "wallet";

export const PAYMENT_LABELS: Record<PaymentChoice, { type: string; label: string }> = {
  online: { type: "online", label: "Mobile Money / Card" },
  wallet: { type: "wallet", label: "ODOS Wallet" },
};

const MOMO_LOGOS: Logo[] = [
  { kind: "image", src: "/payment-logos/mtn-official.png", alt: "MTN" },
  { kind: "image", src: "/payment-logos/telecel-icon.png", alt: "Telecel" },
  { kind: "image", src: "/payment-logos/at-official.png", alt: "AT" },
];

export function PaymentMethodPicker({
  value,
  onChange,
  total,
  walletBalance,
}: {
  value: PaymentChoice;
  onChange: (choice: PaymentChoice) => void;
  total: number;
  /** `undefined` while loading or when the wallet can't be read. */
  walletBalance: number | undefined;
}) {
  const walletCovers = walletBalance !== undefined && walletBalance >= total && total > 0;

  return (
    <div className="space-y-2.5">
      <ChoiceCard
        name="payment"
        value="online"
        checked={value === "online"}
        onChange={() => onChange("online")}
        title="Mobile Money or card"
        description="MTN MoMo, Telecel Cash, AT Money, Visa or Mastercard — you choose on the secure payment page."
        trailing={
          <span className="flex -space-x-2">
            {MOMO_LOGOS.map((logo) => (
              <LogoBadge key={logo.kind === "image" ? logo.src : logo.text} logo={logo} className="size-7 ring-2 ring-surface" />
            ))}
          </span>
        }
      />
      {walletBalance !== undefined && (
        <ChoiceCard
          name="payment"
          value="wallet"
          checked={value === "wallet"}
          onChange={() => walletCovers && onChange("wallet")}
          className={walletCovers ? undefined : "pointer-events-none opacity-50"}
          title="ODOS Wallet"
          description={
            walletCovers
              ? `${formatMoney(walletBalance)} available · paid instantly`
              : `${formatMoney(walletBalance)} available — not enough for this order`
          }
        />
      )}
    </div>
  );
}
