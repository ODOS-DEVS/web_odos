import type { CartGroup, CartLine } from "@/types/cart";
import type { Store } from "@/types/catalog";

export const MAX_LINE_QUANTITY = 20;

export const lineKey = (productId: string, size?: string | null, color?: string | null) =>
  [productId, size ?? "", color ?? ""].join("|");

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
/**
 * What a line actually costs the shopper: the privately agreed price when
 * there is one, otherwise the list price. The server recomputes this from the
 * agreement itself at checkout — this exists so the cart does not quote a
 * figure the shopper will not be charged.
 */
export const lineUnitPrice = (line: CartLine) => line.negotiatedUnitPrice ?? line.price;

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.quantity, 0);
export const maxQuantity = (line: CartLine) => Math.max(1, Math.min(line.stock || MAX_LINE_QUANTITY, MAX_LINE_QUANTITY));

/** Groups lines by vendor. Each group is delivered (and paid out) separately. */
export function groupLines(lines: CartLine[], stores: Map<string, Store>): CartGroup[] {
  const groups = new Map<string, CartGroup>();
  for (const line of lines) {
    const id = line.storeId ?? "unknown";
    const store = line.storeId ? stores.get(line.storeId) : undefined;
    const group = groups.get(id) ?? { storeId: line.storeId, store, name: store?.name ?? "Vendor", lines: [], subtotal: 0 };
    group.lines.push(line);
    group.subtotal += line.price * line.quantity;
    groups.set(id, group);
  }
  return [...groups.values()];
}
