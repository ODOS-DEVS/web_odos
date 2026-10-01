"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { DeliverySpeed } from "@/types/delivery";
import { RequireLogin } from "@/components/auth/require-login";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { useSession } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { GHANA_REGIONS, toOrderItems } from "@/libs/checkout";
import { formatMoney } from "@/libs/format";
import { mockDeliveryQuote } from "@/mocks/delivery.mock";
import { useFakeMutation } from "@/mocks/mutation";
import { mockCheckout } from "@/mocks/payments.mock";
import { fakeQuery } from "@/mocks/query";
import { ApiError } from "@/services/http";
import { ChoiceCard } from "./choice-card";
import { PAYMENT_METHODS, PaymentMethodPicker } from "./payment-method-picker";

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-lg font-semibold tracking-normal">
        <span className="grid size-7 place-items-center rounded-full bg-foreground text-sm text-background tabular-nums">{number}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CheckoutForm() {
  const user = useSession()?.user;
  const { ready, lines, subtotal, count } = useCart();
  const checkout = useFakeMutation(mockCheckout);

  const [name, setName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [region, setRegion] = useState<string>(user?.region ?? "Greater Accra");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<DeliverySpeed>("economy");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.find((m) => m.isDefault) ?? PAYMENT_METHODS[0]);

  // Region (not city) drives pricing, so typing a city doesn't fire a new quote per keystroke.
  const quote = fakeQuery(
    mockDeliveryQuote({
      subtotal,
      method,
      region,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.price })),
    }),
  );

  if (!ready) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;

  if (lines.length === 0 && !checkout.isPending && !checkout.isSuccess) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-line px-6 py-24 text-center">
        <ShoppingBag className="size-10 text-muted" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold">Nothing to check out</h2>
        <p className="mt-2 text-sm text-muted">Add something to your cart first.</p>
        <ButtonLink href="/products" className="mt-6">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  const shipping = quote.data?.shippingAmount ?? null;
  const total = subtotal + (shipping ?? 0);
  const options = quote.data?.options.filter((o) => o.available) ?? [];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shipping === null) return;

    checkout.mutate(
      {
        source: "cart",
        items: toOrderItems(lines),
        subtotal_amount: subtotal,
        shipping_amount: shipping,
        delivery_method: method,
        discount_amount: 0,
        total_amount: total,
        address_full_name: name.trim(),
        address_phone: phone.trim(),
        address_street: street.trim(),
        address_city: city.trim(),
        address_region: region,
        delivery_instructions: notes.trim() || null,
        // `payment_type` is free text on the API (≤30 chars).
        payment_type: paymentMethod.kind,
        payment_label: paymentMethod.label,
        callback_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`,
      },
      {
        onSuccess: (session) => {
          // The cart is cleared on the result page once the payment is confirmed, not before.
          window.location.assign(session.authorization_url);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "We couldn’t start your payment. Please try again."),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <Step number={1} title="Delivery address">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="sm:col-span-2" />
            <Field id="phone" label="Phone number" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Field id="city" label="City or town" autoComplete="address-level2" required value={city} onChange={(e) => setCity(e.target.value)} />
            <Field id="street" label="Street address" autoComplete="street-address" required value={street} onChange={(e) => setStreet(e.target.value)} className="sm:col-span-2" />
            <div>
              <label htmlFor="region" className="mb-1.5 block text-sm font-medium">
                Region
              </label>
              <select id="region" name="region" required value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
                {GHANA_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <Field
              id="notes"
              label="Delivery notes"
              hint="Optional"
              placeholder="Landmark, gate code, leave with security…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </Step>

        <Step number={2} title="Delivery speed">
          <p className="-mt-2 mb-5 text-sm text-muted">Each vendor delivers their own package; the speed you choose applies to the whole order.</p>
          {quote.isPending || (quote.isFetching && !quote.data) ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-18 animate-pulse rounded-xl bg-surface-muted" />
              ))}
            </div>
          ) : quote.isError && !quote.data ? (
            <p role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-danger">
              We couldn’t price delivery. {quote.error instanceof ApiError ? quote.error.message : ""}{" "}
              <button type="button" onClick={() => quote.refetch()} className="font-medium underline underline-offset-2">
                Try again
              </button>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {options.map((option) => (
                <ChoiceCard
                  key={option.id}
                  name="delivery"
                  value={option.id}
                  checked={method === option.id}
                  onChange={(next) => setMethod(next as DeliverySpeed)}
                  title={option.title}
                  description={option.eta}
                  trailing={option.amount === 0 ? <span className="text-success">Free</span> : formatMoney(option.amount)}
                />
              ))}
            </div>
          )}

          {quote.data && quote.data.packages.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              {quote.data.packages.map((pkg) => (
                <li key={pkg.storeId ?? pkg.storeName} className="flex justify-between gap-4">
                  <span className="min-w-0 truncate">{pkg.storeName ?? "Vendor"}</span>
                  <span className="shrink-0 text-muted tabular-nums">{pkg.deliveryFee === 0 ? "Free delivery" : `${formatMoney(pkg.deliveryFee)} delivery`}</span>
                </li>
              ))}
            </ul>
          )}
        </Step>

        <Step number={3} title="Payment">
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        </Step>
      </div>

      <div className="lg:sticky lg:top-40">
        <OrderSummary totals={{ items: subtotal, delivery: shipping, total, vendors: new Set(lines.map((l) => l.storeId)).size }}>
          <Button type="submit" size="lg" variant="accent" className="w-full" disabled={checkout.isPending || shipping === null}>
            <Lock className="size-4" aria-hidden />
            {checkout.isPending ? "Starting payment…" : `Pay ${formatMoney(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            {count} {count === 1 ? "item" : "items"} · Need to change something?{" "}
            <Link href="/cart" className="underline underline-offset-2 hover:text-foreground">
              Back to cart
            </Link>
          </p>
        </OrderSummary>
      </div>
    </form>
  );
}

export function CheckoutView() {
  return (
    <RequireLogin next="/checkout" message="Log in so we can place your order and let you track each vendor’s delivery.">
      <CheckoutForm />
    </RequireLogin>
  );
}
