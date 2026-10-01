"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/types/catalog";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatMoneyCompact } from "@/libs/format";
import { swatchColor } from "@/libs/color";
import { cn } from "@/libs/cn";
import { AddToCartButton } from "./add-to-cart-button";

function SizeGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (next: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">
        Size
        {value && <span className="ml-2 font-normal text-muted">{value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "press min-w-11 rounded-full border px-3.5 py-2 text-sm pointer-coarse:min-h-11",
              value === option ? "border-foreground bg-foreground text-background" : "border-line bg-surface hover:border-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Colour circle swatches, not text pills — matches how every fashion retailer picks colour (H&M, adidas, lululemon). */
function ColorGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (next: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">
        Colour
        {value && <span className="ml-2 font-normal text-muted">{value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              aria-label={option}
              title={option}
              onClick={() => onChange(option)}
              className={cn(
                "press grid size-10 place-items-center rounded-full ring-1 ring-line ring-offset-2 ring-offset-surface pointer-coarse:size-11",
                selected && "ring-2 ring-foreground",
              )}
            >
              <span
                className="grid size-7 place-items-center rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: swatchColor(option) }}
              >
                {selected && <Check className="size-4 mix-blend-difference text-white" aria-hidden />}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PurchasePanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  // Default to the first option, same as the card's quick-add — picking a size/colour is optional,
  // not a prerequisite for adding to cart.
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors[0] ?? null);

  const soldOut = product.stock <= 0;
  const max = Math.min(Math.max(product.stock, 1), 20);
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <div className="space-y-5">
      {product.colors.length > 0 && <ColorGroup options={product.colors} value={color} onChange={setColor} />}
      {product.sizes.length > 0 && <SizeGroup options={product.sizes} value={size} onChange={setSize} />}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={max} />
        <AddToCartButton
          product={product}
          quantity={quantity}
          size={size}
          color={color}
          disabled={soldOut}
          className="min-w-52 flex-1"
        />
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {soldOut ? (
          "Currently sold out"
        ) : lowStock ? (
          <span className="font-medium text-warning">Only {product.stock} left in stock</span>
        ) : (
          <>Subtotal {formatMoneyCompact(product.price * quantity)}</>
        )}
      </p>
    </div>
  );
}
