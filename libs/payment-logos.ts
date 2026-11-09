import type { Logo } from "@/components/checkout/logo-badge";
import type { SavedPaymentMethod } from "@/types/account";

/** Networks the backend accepts, with the mark to show for each. */
export const MOMO_NETWORKS: { id: "MTN" | "Telecel" | "AT"; label: string; logo: Logo }[] = [
  { id: "MTN", label: "MTN MoMo", logo: { kind: "image", src: "/payment-logos/mtn-official.png", alt: "MTN" } },
  { id: "Telecel", label: "Telecel Cash", logo: { kind: "image", src: "/payment-logos/telecel-icon.png", alt: "Telecel" } },
  { id: "AT", label: "AT Money", logo: { kind: "image", src: "/payment-logos/at-official.png", alt: "AT" } },
];

const VISA_LOGO: Logo = { kind: "image", src: "/payment-logos/visa-official.svg", alt: "Visa" };
const MASTERCARD_LOGO: Logo = { kind: "image", src: "/payment-logos/mastercard-official.svg", alt: "Mastercard" };
const GENERIC_CARD: Logo = { kind: "monogram", text: "••", bg: "#1f2937", fg: "#ffffff" };

/** Identifies the card network from its IIN/BIN prefix so the real brand mark shows. */
export function detectCardBrand(cardNumber: string): { label: string; logo: Logo } {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return { label: "Visa", logo: VISA_LOGO };
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]\d|[3-6]\d\d|7[01]\d|720)/.test(digits)) return { label: "Mastercard", logo: MASTERCARD_LOGO };
  return { label: "Card", logo: GENERIC_CARD };
}

/** The mark for a saved method, from the fields the API actually returns. */
export function logoForMethod(method: SavedPaymentMethod): Logo {
  if (method.kind === "momo") {
    return MOMO_NETWORKS.find((n) => n.id === method.network)?.logo ?? GENERIC_CARD;
  }
  // Only the last 4 is stored, so the brand comes from `card_name` when the backend kept it.
  if (method.cardName && /visa/i.test(method.cardName)) return VISA_LOGO;
  if (method.cardName && /master/i.test(method.cardName)) return MASTERCARD_LOGO;
  return GENERIC_CARD;
}

/** The second line under a saved method's name. */
export function subtitleForMethod(method: SavedPaymentMethod): string {
  if (method.kind === "momo") {
    return [MOMO_NETWORKS.find((n) => n.id === method.network)?.label ?? "Mobile Money", method.phone]
      .filter(Boolean)
      .join(" · ");
  }
  return [method.cardName || "Card", method.cardLast4 && `•••• ${method.cardLast4}`, method.expiry]
    .filter(Boolean)
    .join(" · ");
}
