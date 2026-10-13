"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/catalog";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

type Variant = { size?: string | null; color?: string | null };

export function useAddToCart(product: Product) {
  const router = useRouter();
  const { add } = useCart();

  return (quantity = 1, variant: Variant = {}) => {
    add({ product, quantity, size: variant.size ?? null, color: variant.color ?? null });
    toast.success(`Added ${product.name}`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };
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
