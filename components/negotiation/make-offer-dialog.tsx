"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { inputClass } from "@/components/ui/field";
import { useSession } from "@/hooks/use-auth";
import { useStartNegotiation } from "@/hooks/use-negotiations";
import { cn } from "@/libs/cn";
import { formatMoney } from "@/libs/format";
import type { Product } from "@/types/catalog";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

/**
 * Make an offer on a negotiable product.
 *
 * Deliberately small: a price, a quantity and an optional note. The vendor's minimum is not
 * shown, hinted at, or validated against here — it is private, and an offer below it still
 * reaches the vendor to accept or decline. Everything checked here is checked again on the
 * server; this only stops the obviously pointless submission before it costs a round trip.
 */
export function MakeOfferDialog({
  product,
  selectedColor,
  selectedSize,
  className,
}: {
  product: Product;
  selectedColor?: string | null;
  selectedSize?: string | null;
  className?: string;
}) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const start = useStartNegotiation();

  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const offer = Number(price || 0);
  const tooHigh = offer > 0 && offer >= product.price;
  const saving = offer > 0 && offer < product.price ? product.price - offer : 0;
  const percent = saving > 0 ? Math.round((saving / product.price) * 100) : 0;

  const onOpen = () => {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
  };

  const submit = () => {
    start.mutate(
      {
        productId: product.id,
        unitPrice: offer,
        quantity,
        message: message.trim() || null,
        selectedColor: selectedColor ?? null,
        selectedSize: selectedSize ?? null,
      },
      {
        onSuccess: (negotiation) => {
          toast.success("Offer sent to the seller");
          setOpen(false);
          setPrice("");
          setMessage("");
          router.push(`/account/negotiations/${(negotiation as { id: string }).id}`);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "We couldn't send that offer."),
      },
    );
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={onOpen} className={cn(className)}>
        <Handshake className="size-4" aria-hidden />
        Make an offer
      </Button>

      {open && (
        <Drawer open onClose={() => setOpen(false)} title="Make an offer" labelId="make-offer">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-2xl bg-surface-muted p-4">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="mt-1 text-sm text-muted">
                  Listed at{" "}
                  <span className="font-semibold text-foreground">{formatMoney(product.price)}</span>
                </p>
                {product.negotiationNote && (
                  <p className="mt-2 text-xs text-muted">Seller says: {product.negotiationNote}</p>
                )}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Your offer per unit</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  autoFocus
                  placeholder={String(Math.max(1, Math.round(product.price * 0.9)))}
                  value={price}
                  onChange={(event) => setPrice(digitsOnly(event.target.value))}
                />
                {tooHigh ? (
                  <span className="mt-1.5 block text-xs text-danger">
                    That is at or above the listed price — just buy it at {formatMoney(product.price)}.
                  </span>
                ) : saving > 0 ? (
                  <span className="mt-1.5 block text-xs text-muted">
                    {percent}% below the listed price · {formatMoney(saving * quantity)} off in total
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Quantity</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(digitsOnly(event.target.value) || 1)))
                  }
                />
                <span className="mt-1.5 block text-xs text-muted">
                  The agreed price will cover exactly this many. Ask again for more later.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Message (optional)</span>
                <textarea
                  className={cn(inputClass, "h-24 resize-y py-3")}
                  maxLength={500}
                  placeholder="Tell the seller why — buying several, collecting in person…"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>

              {offer > 0 && !tooHigh && (
                <p className="rounded-xl border border-line px-4 py-3 text-sm">
                  You are offering <span className="font-semibold">{formatMoney(offer)}</span> each for{" "}
                  {quantity} — <span className="font-semibold">{formatMoney(offer * quantity)}</span>{" "}
                  total.
                </p>
              )}
            </div>

            <div className="border-t border-line p-5">
              <Button
                type="button"
                className="w-full"
                disabled={!offer || tooHigh || start.isPending}
                onClick={submit}
              >
                {start.isPending ? "Sending…" : "Send offer"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted">
                The seller can accept, decline, or come back with their own price.
              </p>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}
