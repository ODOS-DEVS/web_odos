"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { DeliverySpeed } from "@/types/delivery";
import { RequireLogin } from "@/components/auth/require-login";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { useSession } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { rememberPendingPayment } from "@/libs/pending-payment";
import { RegionCitySelect } from "@/components/ui/region-city-select";
import { toOrderItems } from "@/libs/checkout";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import { useDeliveryQuote } from "@/hooks/use-delivery-quote";
import { useAddresses } from "@/hooks/use-addresses";
import { useCheckout, useWalletCheckout } from "@/hooks/use-orders";
import { useWallet } from "@/hooks/use-wallet";
import { usePaymentOptions } from "@/hooks/use-payment-options";
import { ApiError } from "@/services/http";
import type { VoucherPreview } from "@/services/vouchers.service";
import { ChoiceCard } from "./choice-card";
import { PaymentMethodPicker } from "./payment-method-picker";
import { VoucherCard } from "./voucher-card";

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
  const { ready, lines, subtotal, count, clear } = useCart();
  const checkout = useCheckout();
  const walletCheckout = useWalletCheckout();
  const { balance: walletBalance, ready: walletReady } = useWallet();
  const { addresses } = useAddresses();
  const router = useRouter();

  const [name, setName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [region, setRegion] = useState<string>(user?.region ?? "Greater Accra");
  const [notes, setNotes] = useState("");

  /**
   * Which saved address to deliver to — the one picked here, else the account default. `"new"`
   * means the shopper is typing a one-off address, so the fields below are theirs to fill.
   */
  const [addressChoice, setAddressChoice] = useState<string | null>(null);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const selectedAddress =
    addressChoice === "new" ? undefined : (addresses.find((a) => a.id === addressChoice) ?? defaultAddress);

  // The form mirrors whichever saved address is selected; typing is only possible under "new".
  const usingSaved = Boolean(selectedAddress);
  const fullName = usingSaved ? selectedAddress!.fullName : name;
  const phoneNumber = usingSaved ? selectedAddress!.phone : phone;
  const streetLine = usingSaved ? selectedAddress!.street : street;
  const cityName = usingSaved ? selectedAddress!.city : city;
  const regionName = usingSaved ? selectedAddress!.region : region;
  const [method, setMethod] = useState<DeliverySpeed>("economy");
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherPreview | null>(null);
  const paymentOptions = usePaymentOptions();
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const paymentMethod =
    paymentOptions.find((m) => m.id === paymentMethodId) ??
    paymentOptions.find((m) => m.isDefault) ??
    paymentOptions[0];

  // Region (not city) drives pricing, so typing a city doesn't fire a new quote per keystroke.
  const quote = useDeliveryQuote({
    subtotal,
    method,
    region: regionName,
    items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.price })),
  });

  if (!ready) return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;

  if (lines.length === 0 && !checkout.isPending && !checkout.isSuccess) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-10 text-muted" aria-hidden />}
        title="Nothing to check out"
        description="Add something to your cart first."
        className="py-24"
        action={<ButtonLink href="/products">Browse products</ButtonLink>}
      />
    );
  }

  const shipping = quote.data?.shippingAmount ?? null;
  const discount = appliedVoucher?.discount_amount ?? 0;
  const rawTotal = subtotal + (shipping ?? 0);
  const total = Math.max(0, rawTotal - discount);
  const options = quote.data?.options.filter((o) => o.available) ?? [];

  const payingFromWallet = paymentMethod?.kind === "wallet";
  const shortOnWallet = payingFromWallet && walletReady && walletBalance < total;
  const placing = checkout.isPending || walletCheckout.isPending;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Never a dead click: say why rather than returning silently.
    if (shipping === null) {
      toast.error("We're still pricing delivery. Give it a moment and try again.");
      return;
    }

    const order = {
      source: "cart" as const,
      items: toOrderItems(lines),
      subtotal_amount: subtotal,
      shipping_amount: shipping,
      delivery_method: method,
      discount_amount: discount,
      total_amount: total,
      voucher_code: appliedVoucher?.code ?? null,
      address_full_name: fullName.trim(),
      address_phone: phoneNumber.trim(),
      address_street: streetLine.trim(),
      address_city: cityName.trim(),
      address_region: regionName,
      delivery_instructions: notes.trim() || null,
      // `payment_type` is free text on the API (≤30 chars).
      payment_type: paymentMethod.kind,
      payment_label: paymentMethod.label,
    };

    const failed = (error: unknown) =>
      toast.error(error instanceof ApiError ? error.message : "We couldn’t start your payment. Please try again.");

    // Paying from the wallet settles server-side straight away — there is no hosted page to send
    // the shopper to, so the order is final on return and the cart can be emptied here.
    if (paymentMethod.kind === "wallet") {
      walletCheckout.mutate(order, {
        onSuccess: ({ order: placed, message }) => {
          clear();
          toast.success(message || "Order placed");
          router.push(`/orders/${placed.id}`);
        },
        onError: failed,
      });
      return;
    }

    // Opened now, while we are still inside the click, because a popup asked for
    // later -- once the checkout call comes back -- is blocked as unrequested.
    // It starts blank and is pointed at the provider when we have the URL.
    const payWindow = window.open("", "_blank");

    checkout.mutate(
      {
        ...order,
        // Honoured by Paystack. KutanaPay has no return-URL field at all, which
        // is why the shopper is kept on our own result page below rather than
        // relying on the provider to send them back.
        callback_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`,
      },
      {
        onSuccess: (session) => {
          // Noted before either navigation, so an outstanding payment can be
          // picked back up even if this tab goes away.
          rememberPendingPayment(session.reference, "order");
          const result = `/checkout/success?reference=${encodeURIComponent(session.reference)}`;

          if (payWindow && !payWindow.closed) {
            // They pay next door; this tab waits on the result page and settles
            // itself the moment the charge lands. Nobody has to find their way
            // back to the site, which with KutanaPay they otherwise could not.
            payWindow.location.replace(session.authorization_url);
            router.push(result);
            return;
          }

          // Popup blocked. Hand the whole tab over, and let the stash bring
          // them to the result page whenever they next open the site.
          window.location.assign(session.authorization_url);
        },
        onError: (error) => {
          payWindow?.close();
          failed(error);
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <Step number={1} title="Delivery address">
          {addresses.length > 0 && (
            <div className="mb-5 space-y-2.5">
              {addresses.map((address) => (
                <ChoiceCard
                  key={address.id}
                  name="address"
                  value={address.id}
                  checked={selectedAddress?.id === address.id}
                  onChange={setAddressChoice}
                  title={`${address.label}${address.isDefault ? " · Default" : ""}`}
                  description={`${address.fullName} · ${address.street}, ${address.city}, ${address.region}`}
                />
              ))}
              <ChoiceCard
                name="address"
                value="new"
                checked={addressChoice === "new"}
                onChange={setAddressChoice}
                title="Deliver somewhere else"
                description="Use a one-off address for this order"
              />
            </div>
          )}

          {/* Rendered, not CSS-hidden: a `required` field inside a hidden block is invalid and
              unfocusable, which makes the browser refuse to submit the form and do nothing at all. */}
          {!usingSaved && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="name" label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="sm:col-span-2" />
              <Field id="phone" label="Phone number" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Field id="street" label="Street address" autoComplete="street-address" required value={street} onChange={(e) => setStreet(e.target.value)} className="sm:col-span-2" />
              <RegionCitySelect
                idPrefix="checkout"
                required
                cityLabel="City or town"
                region={region}
                city={city}
                onRegionChange={setRegion}
                onCityChange={setCity}
              />
            </div>
          )}

          {/* Always available: delivery notes belong to this order, not to the saved address. */}
          <Field
            id="notes"
            label="Delivery notes"
            hint="Optional"
            placeholder="Landmark, gate code, leave with security…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(!usingSaved && "mt-4")}
          />
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
          <PaymentMethodPicker
            value={paymentMethod}
            options={paymentOptions}
            onChange={(method) => setPaymentMethodId(method.id)}
          />
        </Step>
      </div>

      <div className="space-y-5 lg:sticky lg:top-40">
        <OrderSummary
          totals={{ items: subtotal, delivery: shipping, total: rawTotal, vendors: new Set(lines.map((l) => l.storeId)).size }}
          discount={discount}
        >
          <Button
            type="submit"
            size="lg"
            variant="accent"
            className="w-full"
            disabled={placing || shipping === null || shortOnWallet}
          >
            <Lock className="size-4" aria-hidden />
            {placing
              ? payingFromWallet
                ? "Placing order…"
                : "Starting payment…"
              : `${payingFromWallet ? "Pay from wallet" : "Pay"} ${formatMoney(total)}`}
          </Button>
          {shortOnWallet && (
            <p className="mt-2 text-center text-xs text-danger">
              Your wallet has {formatMoney(walletBalance)}. Top it up or choose another payment method.
            </p>
          )}
          <p className="mt-3 text-center text-xs text-muted">
            {count} {count === 1 ? "item" : "items"} · Need to change something?{" "}
            <Link href="/cart" className="underline underline-offset-2 hover:text-foreground">
              Back to cart
            </Link>
          </p>
        </OrderSummary>

        <VoucherCard
          lines={lines}
          subtotal={subtotal}
          shipping={shipping}
          appliedVoucher={appliedVoucher}
          onApplyVoucher={setAppliedVoucher}
          onRemoveVoucher={() => setAppliedVoucher(null)}
        />
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
