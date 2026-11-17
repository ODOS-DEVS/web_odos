import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";

// Private to the shopper, so it is never indexed.
export const metadata: Metadata = { title: "Saved items", robots: { index: false } };

export default function WishlistPage() {
  return <WishlistView />;
}
