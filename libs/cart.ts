import type { CartGroup, CartLine } from "@/types/cart";
import type { Store } from "@/types/catalog";

export const MAX_LINE_QUANTITY = 20;

export const lineKey = (productId: string, size?: string | null, color?: string | null) =>
  [productId, size ?? "", color ?? ""].join("|");

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
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
