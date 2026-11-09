/* eslint-disable @typescript-eslint/no-explicit-any -- the inventory responses are untyped in the API spec, so they're mapped defensively */
import { VENDOR_INVENTORY_ENDPOINTS, VENDOR_PRODUCTS_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryItem = {
  productId: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  stock: number;
  price: number;
  compareAtPrice: number | null;
  status: InventoryStatus;
};

export type InventoryStats = {
  trackedProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalUnits: number;
  inventoryValue: number;
};

export type InventoryMovement = {
  id: string;
  productId: string;
  productTitle: string;
  delta: number;
  stockAfter: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

export const LOW_STOCK_THRESHOLD = 5;

const num = (value: unknown, fallback = 0) => {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
};

/** Pulls the row array out of `[...]`, `{items}`, `{products}`, `{data}`, `{alerts}` or `{inventory}`. */
const rowsOf = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  for (const key of ["items", "products", "data", "alerts", "inventory", "results"]) {
    if (Array.isArray(res?.[key])) return res[key];
  }
  return [];
};

const toItem = (raw: any): InventoryItem => {
  const product = raw?.product ?? raw;
  const stock = num(raw?.stock ?? raw?.stock_quantity ?? raw?.quantity ?? raw?.current_stock ?? product?.stock);
  const status: InventoryStatus = /out/i.test(raw?.stock_status ?? raw?.status ?? "")
    ? "out_of_stock"
    : /low/i.test(raw?.stock_status ?? raw?.status ?? "")
      ? "low_stock"
      : stock <= 0
        ? "out_of_stock"
        : stock <= num(raw?.low_stock_threshold ?? raw?.threshold, LOW_STOCK_THRESHOLD)
          ? "low_stock"
          : "in_stock";
  const compare = raw?.compare_at_price ?? raw?.old_price ?? product?.compare_at_price ?? product?.old_price;
  return {
    productId: String(raw?.product_id ?? product?.id ?? raw?.id ?? ""),
    name: raw?.title ?? raw?.name ?? raw?.product_title ?? raw?.product_name ?? product?.title ?? product?.name ?? "Product",
    sku: raw?.sku ?? product?.sku ?? null,
    imageUrl: raw?.image_url ?? raw?.image_urls?.[0] ?? raw?.images?.[0] ?? product?.image_url ?? product?.image_urls?.[0] ?? null,
    stock,
    price: num(raw?.price ?? raw?.current_price ?? product?.price),
    compareAtPrice: compare == null ? null : num(compare),
    status,
  };
};

const toStats = (res: any): InventoryStats => {
  const s = res?.stats ?? res ?? {};
  return {
    trackedProducts: num(s.total_tracked_products ?? s.total_products ?? s.total),
    inStock: num(s.in_stock_products ?? s.in_stock),
    lowStock: num(s.low_stock_products ?? s.low_stock),
    outOfStock: num(s.out_of_stock_products ?? s.out_of_stock),
    totalUnits: num(s.total_inventory_units ?? s.total_units ?? s.total_stock),
    inventoryValue: num(s.estimated_inventory_value ?? s.inventory_value ?? s.total_value),
  };
};

/** /vendor/inventory/* — every call except stock/price edits is scoped to the vendor's `store_id`. */
export const vendorInventoryService = {
  async list(params: {
    storeId: string;
    search?: string;
    status?: InventoryStatus | "";
    skip?: number;
    limit?: number;
  }): Promise<{ items: InventoryItem[]; total: number }> {
    const res = await apiFetch<any>(VENDOR_INVENTORY_ENDPOINTS.inventory, {
      query: {
        store_id: params.storeId,
        skip: params.skip ?? 0,
        limit: params.limit ?? 20,
        search: params.search?.trim() || undefined,
        status: params.status || undefined,
      },
      revalidate: false,
    });
    const items = rowsOf(res).map(toItem);
    return { items, total: num(res?.total ?? res?.count ?? res?.total_count, items.length) };
  },

  async stats(storeId: string): Promise<InventoryStats> {
    const res = await apiFetch<any>(VENDOR_INVENTORY_ENDPOINTS.stats, { query: { store_id: storeId }, revalidate: false });
    return toStats(res);
  },

  async lowStock(storeId: string, threshold = LOW_STOCK_THRESHOLD): Promise<InventoryItem[]> {
    const res = await apiFetch<any>(VENDOR_INVENTORY_ENDPOINTS.lowStockAlerts, {
      query: { store_id: storeId, threshold },
      revalidate: false,
    });
    return rowsOf(res).map(toItem);
  },

  setStock(productId: string, newStock: number) {
    return apiFetch<unknown>(VENDOR_INVENTORY_ENDPOINTS.stock(productId), {
      method: "PATCH",
      query: { new_stock: Math.max(0, Math.round(newStock)) },
    });
  },

  setPrice(productId: string, newPrice: number, oldPrice?: number | null) {
    return apiFetch<unknown>(VENDOR_INVENTORY_ENDPOINTS.price(productId), {
      method: "PATCH",
      query: { new_price: newPrice, old_price: oldPrice ?? undefined },
    });
  },

  bulkUpdate(storeId: string, updates: { productId: string; stock: number }[]) {
    return apiFetch<unknown>(VENDOR_INVENTORY_ENDPOINTS.bulkUpdate, {
      method: "POST",
      body: {
        store_id: storeId,
        updates: updates.map((u) => ({ product_id: u.productId, stock: Math.max(0, Math.round(u.stock)) })),
      },
    });
  },

  async movements(limit = 20, offset = 0): Promise<InventoryMovement[]> {
    const res = await apiFetch<any>(VENDOR_PRODUCTS_ENDPOINTS.inventoryMovements, {
      query: { limit, offset },
      revalidate: false,
    });
    return rowsOf(res).map((m: any) => ({
      id: String(m.id),
      productId: String(m.product_id ?? ""),
      productTitle: m.product_title ?? "Product",
      delta: num(m.delta ?? m.quantity_change),
      stockAfter: num(m.stock_after ?? m.quantity_after),
      reason: m.reason ?? "",
      note: m.note ?? null,
      createdAt: m.created_at,
    }));
  },
};
