import { ACCOUNT_ENDPOINTS } from "@/libs/api-endpoint";
import type { Logo } from "@/components/checkout/logo-badge";
import type { SavedPaymentMethodCreate, SavedPaymentMethodRead } from "@/types/api";
import { apiFetch } from "./http";

export type SavedPaymentMethod = {
  id: string;
  kind: "momo" | "card";
  label: string;
  subtitle: string;
  logo: Logo;
  isDefault?: boolean;
  phone?: string;
  network?: string;
  cardName?: string;
  last4?: string;
  expiry?: string;
  raw?: any;
};

export const PAYMENT_LOGOS: Record<string, Logo> = {
  mtn: { kind: "image", src: "/payment-logos/mtn-official.png", alt: "MTN" },
  telecel: { kind: "image", src: "/payment-logos/telecel-icon.png", alt: "Telecel" },
  at: { kind: "image", src: "/payment-logos/at-official.png", alt: "AT" },
  visa: { kind: "image", src: "/payment-logos/visa-official.svg", alt: "Visa" },
  mastercard: { kind: "image", src: "/payment-logos/mastercard-official.svg", alt: "Mastercard" },
};

export function resolvePaymentLogo(network: string | null | undefined, type: string): Logo {
  const key = (network ?? "").toLowerCase();
  if (key.includes("mtn")) return PAYMENT_LOGOS.mtn;
  if (key.includes("telecel") || key.includes("vodafone")) return PAYMENT_LOGOS.telecel;
  if (key.includes("at") || key.includes("airteltigo")) return PAYMENT_LOGOS.at;
  if (key.includes("visa")) return PAYMENT_LOGOS.visa;
  if (key.includes("mastercard")) return PAYMENT_LOGOS.mastercard;
  if (type === "card") return PAYMENT_LOGOS.mastercard;
  return { kind: "monogram", text: "••", bg: "#1f2937", fg: "#ffffff" };
}

export function toSavedPaymentMethod(apiMethod: SavedPaymentMethodRead | any): SavedPaymentMethod {
  const raw = apiMethod ?? {};
  const rawType = (raw.type || raw.payment_type || "").toLowerCase();
  const rawNetwork = (raw.network || raw.payment_network || raw.provider || raw.brand || "").trim();
  const isCard =
    rawType === "card" ||
    rawNetwork.toLowerCase().includes("visa") ||
    rawNetwork.toLowerCase().includes("mastercard") ||
    Boolean(raw.card_last4 || raw.last4 || raw.payment_last4);
  const kind: "momo" | "card" = isCard ? "card" : "momo";

  let networkName = rawNetwork;
  if (!networkName) {
    const rawLabel = (raw.label || raw.payment_label || "").toLowerCase();
    if (rawLabel.includes("mtn")) networkName = "MTN";
    else if (rawLabel.includes("telecel") || rawLabel.includes("vodafone")) networkName = "Telecel";
    else if (rawLabel.includes("at") || rawLabel.includes("airteltigo")) networkName = "AT";
    else if (isCard) networkName = raw.card_name || "Card";
  }

  const phone = raw.phone || raw.payment_phone || raw.phone_number || raw.account_number || "";
  const last4 = raw.card_last4 || raw.payment_last4 || raw.last4 || "";
  const expiry = raw.expiry || raw.card_expiry || "";
  const cardName = raw.card_name || networkName || "Card";

  const logo = resolvePaymentLogo(networkName || (isCard ? cardName : undefined), kind);

  let label = raw.label || raw.payment_label;
  if (!label || label === "undefined") {
    if (isCard) {
      label = last4 ? `**** ${last4}` : cardName || "Bank Card";
    } else {
      const netUpper = networkName.toUpperCase();
      if (netUpper === "MTN") label = "MTN MoMo";
      else if (netUpper === "TELECEL") label = "Telecel Cash";
      else if (netUpper === "AT") label = "AT Money";
      else label = networkName ? `${networkName} Mobile Money` : "Mobile Money";
    }
  }

  let subtitle = "";
  if (isCard) {
    const brandName = cardName || "Card";
    const parts = [
      label !== brandName ? brandName : null,
      !label.includes(last4) && last4 ? `**** ${last4}` : null,
      expiry || null,
    ].filter(Boolean);
    subtitle = parts.length > 0 ? parts.join(" · ") : expiry || "--/--";
  } else {
    subtitle = phone || "";
  }

  return {
    id: String(raw.id),
    kind,
    label,
    subtitle,
    logo,
    isDefault: Boolean(raw.is_default ?? raw.isDefault),
    phone,
    network: networkName,
    cardName,
    last4,
    expiry,
    raw,
  };
}

export const paymentMethodsService = {
  async list(): Promise<SavedPaymentMethod[]> {
    const rows = await apiFetch<SavedPaymentMethodRead[]>(ACCOUNT_ENDPOINTS.paymentMethods, { revalidate: false });
    return rows.map(toSavedPaymentMethod);
  },

  async create(input: SavedPaymentMethodCreate): Promise<SavedPaymentMethod> {
    const created = await apiFetch<SavedPaymentMethodRead>(ACCOUNT_ENDPOINTS.paymentMethods, {
      method: "POST",
      body: input,
    });
    return toSavedPaymentMethod(created);
  },

  async update(id: string, input: SavedPaymentMethodCreate): Promise<SavedPaymentMethod> {
    try {
      const updated = await apiFetch<SavedPaymentMethodRead>(ACCOUNT_ENDPOINTS.paymentMethod(id), {
        method: "PATCH",
        body: input,
      });
      return toSavedPaymentMethod(updated);
    } catch {
      try {
        const updated = await apiFetch<SavedPaymentMethodRead>(ACCOUNT_ENDPOINTS.paymentMethod(id), {
          method: "PUT",
          body: input,
        });
        return toSavedPaymentMethod(updated);
      } catch {
        // Backend doesn't support PATCH/PUT for saved payment methods.
        // We atomically recreate: POST the new method, then delete the old one.
        const created = await paymentMethodsService.create(input);
        try {
          await paymentMethodsService.delete(id);
        } catch {
          // Ignore delete failure if already removed
        }
        if (input.is_default) {
          try {
            await paymentMethodsService.setDefault(created.id);
          } catch {
            // Ignore if already default
          }
        }
        return created;
      }
    }
  },

  delete(id: string): Promise<unknown> {
    return apiFetch<unknown>(ACCOUNT_ENDPOINTS.paymentMethod(id), { method: "DELETE" });
  },

  async setDefault(id: string): Promise<SavedPaymentMethod> {
    const updated = await apiFetch<SavedPaymentMethodRead>(ACCOUNT_ENDPOINTS.paymentMethodDefault(id), {
      method: "POST",
    });
    return toSavedPaymentMethod(updated);
  },
};
