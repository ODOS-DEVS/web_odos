"use client";

import { useMemo } from "react";
import type { PaymentMethod } from "@/components/checkout/payment-method-picker";
import { formatMoney } from "@/libs/format";
import { logoForMethod, subtitleForMethod } from "@/libs/payment-logos";
import { usePaymentMethods } from "./use-payment-methods";
import { useWallet } from "./use-wallet";

/** Offered when nothing is saved yet, so a first-time shopper can still check out. */
const GENERIC: PaymentMethod[] = [
  {
    id: "generic-momo",
    label: "Mobile Money",
    subtitle: "Pay with MTN, Telecel or AT on the next screen",
    cta: "Pay with Mobile Money",
    kind: "momo",
    logo: { kind: "image", src: "/payment-logos/mtn-official.png", alt: "Mobile Money" },
  },
  {
    id: "generic-card",
    label: "Bank Card",
    subtitle: "Pay with Visa or Mastercard on the next screen",
    cta: "Pay with card",
    kind: "card",
    logo: { kind: "monogram", text: "••", bg: "#1f2937", fg: "#ffffff" },
  },
];

/**
 * What the shopper can actually pay with: their real wallet balance and their own saved methods,
 * plus the generic options — payment is completed on the provider's hosted page, so a saved method
 * is a convenience, never a requirement.
 */
export function usePaymentOptions() {
  const { methods } = usePaymentMethods();
  const { balance, ready: walletReady } = useWallet();

  return useMemo<PaymentMethod[]>(() => {
    const saved: PaymentMethod[] = methods.map((m) => ({
      id: m.id,
      label: m.label,
      subtitle: subtitleForMethod(m),
      cta: `Pay with ${m.label}`,
      kind: m.kind,
      isDefault: m.isDefault,
      logo: logoForMethod(m),
    }));

    const wallet: PaymentMethod[] = walletReady
      ? [
          {
            id: "wallet",
            label: "ODOS Wallet",
            subtitle: `${formatMoney(balance)} available`,
            cta: "Pay with wallet",
            kind: "wallet",
            logo: { kind: "monogram", text: "O", bg: "#fde3d2", fg: "#cf4310" },
          },
        ]
      : [];

    // Saved methods first — one of them carries `isDefault`, which is what checkout preselects.
    return [...saved, ...wallet, ...GENERIC];
  }, [methods, balance, walletReady]);
}
