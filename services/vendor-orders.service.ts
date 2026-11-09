import { VENDOR_ORDERS_ENDPOINTS } from "@/libs/api-endpoint";
import type { FulfilmentStatus } from "@/types/order";
import { apiFetch } from "./http";
import { normaliseStatus } from "./mappers";

export type VendorOrderItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
};

export type VendorOrder = {
  id: string;
  number: string;
  placedAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: { street: string; city: string; region: string };
  status: FulfilmentStatus;
  paymentStatus: "paid" | "refunded";
  items: VendorOrderItem[];
  deliveryFee: number;
  total: number;
};

export function toVendorOrder(o: any): VendorOrder {
  const normStatus: FulfilmentStatus =
    normaliseStatus(o.delivery_status, o.vendor_status, o.status) ?? "pending";

  const rawItems = Array.isArray(o.items) ? o.items : [];
  const items: VendorOrderItem[] = rawItems.map((i: any) => ({
    id: String(i.id || crypto.randomUUID()),
    name: i.title || i.name || "Product",
    imageUrl: i.image_url || i.imageUrl || null,
    quantity: Number(i.quantity) || 1,
    unitPrice: Number(i.unit_price ?? i.unitPrice ?? i.price) || 0,
  }));

  const paymentStatus =
    o.payment_status === "refunded" || o.paymentStatus === "refunded" ? "refunded" : "paid";

  return {
    id: String(o.id),
    number: o.order_number || o.number || `ODOS-${String(o.id).slice(-4)}`,
    placedAt: o.placed_at || o.created_at || o.placedAt || new Date().toISOString(),
    buyerName:
      o.address_full_name ||
      o.buyer_name ||
      o.buyerName ||
      o.user_display_name ||
      o.customer_name ||
      "Customer",
    buyerEmail: o.buyer_email || o.buyerEmail || o.email || "",
    buyerPhone: o.address_phone || o.buyer_phone || o.buyerPhone || o.phone || "",
    address: {
      street: o.address_street || o.address?.street || "Delivery Address",
      city: o.address_city || o.address?.city || "Accra",
      region: o.address_region || o.address?.region || "Greater Accra",
    },
    status: normStatus,
    paymentStatus,
    items:
      items.length > 0
        ? items
        : [
            {
              id: "item-1",
              name: o.title || "Order Item",
              imageUrl: null,
              quantity: 1,
              unitPrice: Number(o.total_amount ?? o.total) || 0,
            },
          ],
    deliveryFee: Number(o.shipping_amount ?? o.delivery_fee ?? o.deliveryFee) || 0,
    total: Number(o.total_amount ?? o.total) || 0,
  };
}

export const vendorOrdersService = {
  /** Lists vendor orders from GET /vendor/orders */
  async list(): Promise<VendorOrder[]> {
    try {
      const res = await apiFetch<any>(VENDOR_ORDERS_ENDPOINTS.orders, { revalidate: false });
      const rows = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.orders)
        ? res.orders
        : Array.isArray(res?.data)
        ? res.data
        : [];
      return rows.map(toVendorOrder).sort((a: VendorOrder, b: VendorOrder) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
    } catch {
      return [];
    }
  },

  /** Retrieves a single vendor order by id */
  async get(id: string): Promise<VendorOrder | null> {
    try {
      const row = await apiFetch<any>(VENDOR_ORDERS_ENDPOINTS.order(id), { revalidate: false });
      return toVendorOrder(row);
    } catch {
      return null;
    }
  },

  /** Advances an order status (acknowledge or update status) */
  async advanceStatus(id: string, nextStatus: FulfilmentStatus): Promise<{ id: string; status: FulfilmentStatus }> {
    try {
      if (nextStatus === "confirmed") {
        try {
          await apiFetch(VENDOR_ORDERS_ENDPOINTS.acknowledge(id), { method: "POST" });
        } catch {
          await apiFetch(VENDOR_ORDERS_ENDPOINTS.status(id), {
            method: "PATCH",
            body: { status: nextStatus, vendor_status: nextStatus },
          });
        }
      } else {
        await apiFetch(VENDOR_ORDERS_ENDPOINTS.status(id), {
          method: "PATCH",
          body: { status: nextStatus, vendor_status: nextStatus },
        });
      }
    } catch {
      // Allow optimistic continuation
    }
    return { id, status: nextStatus };
  },
};
