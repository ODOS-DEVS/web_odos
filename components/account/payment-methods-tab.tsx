"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { CodeField } from "@/components/auth/code-field";
import { LogoBadge, type Logo } from "@/components/checkout/logo-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { LogoPill, TogglePill } from "@/components/ui/toggle-pill";
import { usePaymentMethods, type SavedPaymentMethod } from "@/hooks/use-payment-methods";
import { useQueryParam } from "@/hooks/use-query-param";
import { authService } from "@/services/auth.service";
import type { SavedPaymentMethodCreate } from "@/types/api";

const NETWORKS: { id: "MTN" | "Telecel" | "AT"; label: string; logo: Logo }[] = [
  { id: "MTN", label: "MTN MoMo", logo: { kind: "image", src: "/payment-logos/mtn-official.png", alt: "MTN" } },
  { id: "Telecel", label: "Telecel Cash", logo: { kind: "image", src: "/payment-logos/telecel-icon.png", alt: "Telecel" } },
  { id: "AT", label: "AT Money", logo: { kind: "image", src: "/payment-logos/at-official.png", alt: "AT" } },
];

const VISA_LOGO: Logo = { kind: "image", src: "/payment-logos/visa-official.svg", alt: "Visa" };
const MASTERCARD_LOGO: Logo = { kind: "image", src: "/payment-logos/mastercard-official.svg", alt: "Mastercard" };

/** Identifies the card network from its IIN/BIN prefix so we can show the real brand mark instead of a placeholder. */
function detectCardBrand(cardNumber: string): { label: string; logo: Logo } {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return { label: "Visa", logo: VISA_LOGO };
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]\d|[3-6]\d\d|7[01]\d|720)/.test(digits))
    return { label: "Mastercard", logo: MASTERCARD_LOGO };
  return { label: "Card", logo: { kind: "monogram", text: "••", bg: "#1f2937", fg: "#ffffff" } };
}

function MethodForm({
  initial,
  onDone,
}: {
  initial?: SavedPaymentMethod | null;
  onDone: () => void;
}) {
  const { addAsync, updateAsync, isSaving } = usePaymentMethods();
  const [type, setType] = useState<"momo" | "card">(initial?.kind ?? "momo");

  const initialNetwork =
    NETWORKS.find((n) => n.id.toLowerCase() === (initial?.network?.toLowerCase() ?? "")) ??
    NETWORKS.find((n) => initial?.label.toLowerCase().includes(n.id.toLowerCase())) ??
    NETWORKS[0];

  const [network, setNetwork] = useState(initialNetwork);
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [cardNumber, setCardNumber] = useState(initial?.last4 ? `**** **** **** ${initial.last4}` : "");
  const [expiry, setExpiry] = useState(initial?.expiry ?? "");
  const [cvv, setCvv] = useState("");

  // Phone verification state for new MoMo numbers
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendCode = async (targetPhone: string) => {
    const num = targetPhone.replace(/\s+/g, "").trim();
    if (!num) {
      toast.error("Please enter a phone number");
      return;
    }
    setIsSendingCode(true);
    try {
      await authService.sendPhoneCode(num);
      setVerifyingPhone(true);
      setCountdown(60);
      toast.success(`Verification code sent to ${num}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send verification SMS");
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPhone = phone.replace(/\s+/g, "").trim();
    const brand = detectCardBrand(cardNumber);
    const last4 = cardNumber.trim().slice(-4) || initial?.last4 || "0000";

    const payload: SavedPaymentMethodCreate =
      type === "momo"
        ? {
            type: "momo",
            label: network.label,
            network: network.id,
            phone: cleanPhone,
            is_default: Boolean(initial?.isDefault),
            // Compatibility aliases
            payment_type: "momo",
            payment_label: network.label,
            payment_network: network.id,
            payment_phone: cleanPhone,
          }
        : {
            type: "card",
            label: `**** ${last4}`,
            card_name: brand.label,
            card_last4: last4,
            expiry: expiry.trim(),
            is_default: Boolean(initial?.isDefault),
            // Compatibility aliases
            payment_type: "card",
            payment_label: `**** ${last4}`,
            payment_network: brand.label,
            payment_last4: last4,
            card_expiry: expiry.trim(),
          };

    try {
      // If currently verifying OTP code, verify it first with the backend
      if (type === "momo" && verifyingPhone) {
        if (!otpCode.trim() || otpCode.trim().length < 6) {
          toast.error("Please enter the 6-digit verification code");
          return;
        }
        setIsVerifyingCode(true);
        try {
          await authService.verifyPhone(cleanPhone, otpCode.trim());
          toast.success("Phone verified");
        } catch (vErr) {
          toast.error(vErr instanceof Error ? vErr.message : "Invalid or expired verification code");
          setIsVerifyingCode(false);
          return;
        }
      }

      if (initial) {
        await updateAsync(initial.id, payload);
        toast.success("Payment method updated");
      } else {
        await addAsync(payload);
        toast.success("Payment method added");
      }
      onDone();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      const lower = msg.toLowerCase();
      // If the backend requires SMS verification before saving:
      if (
        lower.includes("verify this phone") ||
        lower.includes("sms") ||
        lower.includes("code we send")
      ) {
        setVerifyingPhone(true);
        setCountdown(60);
        try {
          await authService.sendPhoneCode(cleanPhone);
          toast.info(`Verification code sent to ${cleanPhone} by SMS. Enter it below to save.`);
        } catch (sErr) {
          toast.error(sErr instanceof Error ? sErr.message : "Failed to send SMS code. Click Resend code.");
        }
        return;
      }
      toast.error(msg || "Failed to save payment method");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <TogglePill
            selected={type === "momo"}
            onClick={() => {
              setType("momo");
              setVerifyingPhone(false);
              setOtpCode("");
            }}
          >
            Mobile Money
          </TogglePill>
          <TogglePill
            selected={type === "card"}
            onClick={() => {
              setType("card");
              setVerifyingPhone(false);
              setOtpCode("");
            }}
          >
            Bank Card
          </TogglePill>
        </div>
        {initial && <span className="text-xs font-medium text-muted">Editing</span>}
      </div>

      {type === "momo" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => (
              <LogoPill
                key={n.id}
                selected={network.id === n.id}
                logo={n.logo}
                label={n.label}
                onClick={() => setNetwork(n)}
              />
            ))}
          </div>

          <Field
            id="momo-phone"
            label="Phone number"
            type="tel"
            required
            placeholder="024 000 0000"
            value={phone}
            disabled={verifyingPhone}
            onChange={(e) => setPhone(e.target.value)}
            hint={
              !verifyingPhone && phone.trim().length >= 9 ? (
                <button
                  type="button"
                  onClick={() => sendCode(phone)}
                  disabled={isSendingCode || countdown > 0}
                  className="text-xs font-medium text-accent hover:opacity-80 disabled:opacity-50"
                >
                  {isSendingCode ? "Sending SMS…" : countdown > 0 ? `Resend in ${countdown}s` : "Send SMS code"}
                </button>
              ) : undefined
            }
          />

          {verifyingPhone && (
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">SMS Verification Required</p>
                  <p className="text-xs text-muted">
                    Enter the 6-digit code sent to <strong className="text-foreground">{phone}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyingPhone(false);
                    setOtpCode("");
                  }}
                  className="text-xs font-medium text-muted hover:text-foreground"
                >
                  Change number
                </button>
              </div>

              <div className="flex justify-center py-1">
                <CodeField
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isVerifyingCode}
                  label=""
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted pt-1 border-t border-line/60">
                <span>Didn&apos;t receive the SMS?</span>
                <button
                  type="button"
                  onClick={() => sendCode(phone)}
                  disabled={isSendingCode || countdown > 0}
                  className="font-medium text-accent hover:opacity-80 disabled:opacity-50"
                >
                  {isSendingCode ? "Sending…" : countdown > 0 ? `Resend code (${countdown}s)` : "Resend SMS"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              id="card-number"
              label="Card number"
              required={!initial}
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            {cardNumber.trim() && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <LogoBadge logo={detectCardBrand(cardNumber).logo} className="size-5" />
                <span className="text-xs text-muted">{detectCardBrand(cardNumber).label}</span>
              </div>
            )}
          </div>
          <Field
            id="card-expiry"
            label="Expiry"
            required
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
          <Field
            id="card-cvv"
            label="CVV"
            type="password"
            inputMode="numeric"
            maxLength={4}
            required={!initial}
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
          />
        </div>
      )}

      <div className="mt-5 flex gap-2.5">
        <Button
          type="submit"
          variant="accent"
          disabled={isSaving || isSendingCode || isVerifyingCode || (verifyingPhone && otpCode.length < 6)}
        >
          {isVerifyingCode
            ? "Verifying code…"
            : isSaving
            ? "Saving…"
            : verifyingPhone
            ? "Verify code & save"
            : initial
            ? "Save changes"
            : "Save method"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setVerifyingPhone(false);
            setOtpCode("");
            onDone();
          }}
          disabled={isSaving || isVerifyingCode}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MethodRow({
  method,
  onEdit,
}: {
  method: SavedPaymentMethod;
  onEdit: () => void;
}) {
  const { remove, setDefault } = usePaymentMethods();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <LogoBadge logo={method.logo} className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{method.label}</p>
          {method.isDefault && <Badge tone="neutral">Default</Badge>}
        </div>
        {method.subtitle ? <p className="truncate text-xs text-muted">{method.subtitle}</p> : null}
      </div>
      {!method.isDefault && (
        <button
          type="button"
          onClick={() => setDefault(method.id)}
          className="press shrink-0 text-xs font-medium text-accent hover:opacity-80"
        >
          Make default
        </button>
      )}
      <button
        type="button"
        onClick={onEdit}
        title={`Edit ${method.label}`}
        aria-label={`Edit ${method.label}`}
        className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => remove(method.id)}
        aria-label={`Remove ${method.label}`}
        className="press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function PaymentMethodsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading payment methods">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 animate-pulse"
        >
          <div className="size-10 shrink-0 rounded-xl bg-surface-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 rounded-md bg-surface-muted" />
              {i === 0 && <div className="h-4 w-14 rounded-full bg-surface-muted" />}
            </div>
            <div className="h-3 w-40 rounded-md bg-surface-muted" />
          </div>
          {i > 0 && <div className="h-4 w-20 rounded-md bg-surface-muted shrink-0" />}
          <div className="size-8 shrink-0 rounded-full bg-surface-muted" />
        </div>
      ))}
      <div className="h-11 w-full rounded-2xl border border-line/60 bg-surface/40 animate-pulse" />
    </div>
  );
}

export function PaymentMethodsTab() {
  const { methods, isLoading, isFetching, isSaving } = usePaymentMethods();
  const [addingParam, setAddingParam] = useQueryParam("payment");
  const adding = addingParam === "new";
  const [editingId, setEditingId] = useState<string | null>(null);

  const setAdding = (next: boolean) => {
    if (next) setEditingId(null);
    setAddingParam(next ? "new" : null);
  };

  const isInitialLoading = isLoading || (methods.length === 0 && (isFetching || isSaving));

  return (
    <div className="space-y-4">
      {isInitialLoading && methods.length === 0 ? (
        <PaymentMethodsSkeleton />
      ) : methods.length === 0 && !adding ? (
        <EmptyState
          icon={<CreditCard className="size-8 text-muted" />}
          iconBadge
          title="No saved payment methods"
          description="You haven't saved any payment methods yet. Add Mobile Money or a bank card for 1-click checkout."
          action={
            <Button variant="accent" onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add payment method
            </Button>
          }
        />
      ) : (
        methods.map((method) =>
          editingId === method.id ? (
            <MethodForm
              key={method.id}
              initial={method}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <MethodRow
              key={method.id}
              method={method}
              onEdit={() => {
                setAddingParam(null);
                setEditingId(method.id);
              }}
            />
          )
        )
      )}

      {adding ? (
        <MethodForm onDone={() => setAdding(false)} />
      ) : methods.length > 0 && !editingId ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add payment method
        </Button>
      ) : null}
    </div>
  );
}
