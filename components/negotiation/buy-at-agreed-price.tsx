"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useProduct } from "@/hooks/use-catalog";
import { formatMoney } from "@/libs/format";
import type { NegotiationAgreement } from "@/types/negotiation";

/**
 * Spending an agreed price, in one click.
 *
 * This used to be a link to the product page, which meant a shopper who had
 * just finished haggling had to find the product again, re-pick the quantity
 * they had already agreed, add it to the basket and only then check out — with
 * the list price shown the whole way, because nothing carried the agreement.
 *
 * Both buttons put the agreed quantity in the basket at the agreed price. "Add
 * to basket" leaves them shopping, so a negotiated item can travel with
 * everything else and be paid for in one order; "Buy now" is the same add
 * followed by going straight to checkout.
 *
 * The price passed into the cart is for display. The server resolves the
 * agreement itself from the signed-in shopper and the product, so what is
 * charged comes from the agreement row, never from the browser — a cart line
 * edited by hand buys nothing cheaper.
 */
export function BuyAtAgreedPrice({
  productId,
  agreement,
}: {
  productId: string;
  agreement: NegotiationAgreement;
}) {
  const router = useRouter();
  const { add } = useCart();
  const { data: product, isPending, isError } = useProduct(productId);
  const [adding, setAdding] = useState<"cart" | "now" | null>(null);

  const total = agreement.agreedUnitPrice * agreement.quantity;

  const addToCart = (then: "stay" | "checkout") => {
    if (!product) return;
    setAdding(then === "stay" ? "cart" : "now");
    add({
      product,
      quantity: agreement.quantity,
      negotiatedUnitPrice: agreement.agreedUnitPrice,
      agreementReference: agreement.reference,
    });
    if (then === "checkout") {
      router.push("/checkout");
      return;
    }
    toast.success(
      `Added ${agreement.quantity} ${agreement.quantity === 1 ? "unit" : "units"} at ${formatMoney(
        agreement.agreedUnitPrice,
      )} each. Keep shopping — the agreed price travels with it.`,
    );
    setAdding(null);
  };

  if (isError) {
    return (
      <p className="mt-3 text-sm text-danger">
        We couldn&apos;t load this product just now, so the agreed price can&apos;t be added to your
        basket. Try again in a moment.
      </p>
    );
  }

  const soldOut = Boolean(product && product.stock <= 0);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="accent"
          className="w-full sm:w-auto"
          disabled={isPending || soldOut || adding !== null}
          onClick={() => addToCart("checkout")}
        >
          {adding === "now" || isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="size-4" aria-hidden />
          )}
          Buy now · {formatMoney(total)}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isPending || soldOut || adding !== null}
          onClick={() => addToCart("stay")}
        >
          Add to basket
        </Button>
      </div>
      {soldOut ? (
        <p className="text-sm text-danger">
          This product is out of stock, so the agreed price can&apos;t be used right now.
        </p>
      ) : (
        <p className="text-xs text-muted">
          {agreement.quantity} {agreement.quantity === 1 ? "unit" : "units"} at{" "}
          {formatMoney(agreement.agreedUnitPrice)} each. Add other items to the same order if you
          like — only this product is discounted.
        </p>
      )}
    </div>
  );
}
