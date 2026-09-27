"use client";

import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/catalog";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/libs/cn";
import { Button } from "@/components/ui/button";

type Variant = { size?: string | null; color?: string | null };

function useAddToCart(product: Product) {
  const router = useRouter();
  const { add } = useCart();

  return (quantity = 1, variant: Variant = {}) => {
    add({ product, quantity, size: variant.size ?? null, color: variant.color ?? null });
    toast.success(`Added ${product.name}`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };
}

/**
 * Icon-only quick add for product cards. Products with sizes/colours to choose from add their first
 * option — full control (and a chance to change it) is still on the product page.
 */
export function QuickAddButton({ product, className }: { product: Product; className?: string }) {
  const addToCart = useAddToCart(product);
  return (
    <button
      type="button"
      onClick={() => addToCart(1, { size: product.sizes[0] ?? null, color: product.colors[0] ?? null })}
      disabled={product.stock <= 0}
      aria-label={`Add ${product.name} to cart`}
      className={cn(
        "press z-10 grid size-10 place-items-center rounded-full bg-foreground text-background shadow-sm hover:opacity-85 disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      <Plus className="size-5" aria-hidden />
    </button>
  );
}

export function AddToCartButton({
  product,
  quantity,
  size,
  color,
  disabled,
  className,
}: {
  product: Product;
  quantity: number;
  size?: string | null;
  color?: string | null;
  disabled?: boolean;
  className?: string;
}) {
  const addToCart = useAddToCart(product);
  return (
    <Button
      size="lg"
      variant="accent"
      disabled={disabled}
      onClick={() => addToCart(quantity, { size, color })}
      className={className}
    >
      <ShoppingBag className="size-5" aria-hidden />
      Add to cart
    </Button>
  );
}
