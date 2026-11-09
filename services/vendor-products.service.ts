import { VENDOR_PRODUCTS_ENDPOINTS } from "@/libs/api-endpoint";
import type { MessageResponse, VendorProductRead } from "@/types/api";
import type { VendorProduct, VendorProductInput } from "@/types/vendor";
import { apiFetch } from "./http";

const toVendorProduct = (p: VendorProductRead): VendorProduct => ({
  id: p.id,
  name: p.name,
  description: p.description ?? "",
  category: p.category,
  categorySlug: p.category_slug ?? null,
  imageUrl: p.image_url ?? p.image_urls?.[0] ?? null,
  price: p.price,
  compareAtPrice: p.old_price && p.old_price > p.price ? p.old_price : null,
  stock: p.stock,
  availableStock: p.available_stock ?? p.stock,
  status: p.status,
  updatedAt: p.updated_at,
});

/**
 * Create and update take multipart form data (they also accept photo files under `images`), so the
 * fields are sent as strings. `old_price` empty clears the compare-at price.
 */
function toForm(input: VendorProductInput, { includeStatus }: { includeStatus: boolean }) {
  const form = new FormData();
  form.append("name", input.name.trim());
  form.append("description", input.description.trim());
  form.append("category", input.category.trim());
  if (input.categorySlug) form.append("category_slug", input.categorySlug);
  form.append("price", String(Math.round(input.price)));
  form.append("old_price", input.compareAtPrice ? String(Math.round(input.compareAtPrice)) : "");
  form.append("stock", String(Math.max(0, Math.round(input.stock))));
  if (includeStatus) form.append("status", input.status);
  if (input.photo) form.append("images", input.photo, input.photo.name);
  return form;
}

export const vendorProductsService = {
  async list(): Promise<VendorProduct[]> {
    // The endpoint pages at its own default; ask for plenty so the tab can filter and page locally.
    const rows = await apiFetch<VendorProductRead[]>(VENDOR_PRODUCTS_ENDPOINTS.products, {
      query: { limit: 200 },
      revalidate: false,
    });
    return rows.map(toVendorProduct).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  },

  /** New products are created live; a draft status is applied right after if asked for. */
  async create(input: VendorProductInput): Promise<VendorProduct> {
    const created = toVendorProduct(
      await apiFetch<VendorProductRead>(VENDOR_PRODUCTS_ENDPOINTS.products, {
        method: "POST",
        body: toForm(input, { includeStatus: false }),
      }),
    );
    return input.status !== created.status ? vendorProductsService.setStatus(created.id, input.status) : created;
  },

  async update(id: string, input: VendorProductInput): Promise<VendorProduct> {
    return toVendorProduct(
      await apiFetch<VendorProductRead>(VENDOR_PRODUCTS_ENDPOINTS.product(id), {
        method: "PATCH",
        body: toForm(input, { includeStatus: true }),
      }),
    );
  },

  async setStatus(id: string, status: string): Promise<VendorProduct> {
    return toVendorProduct(
      await apiFetch<VendorProductRead>(VENDOR_PRODUCTS_ENDPOINTS.status(id), { method: "PATCH", body: { status } }),
    );
  },

  remove: (id: string) => apiFetch<MessageResponse>(VENDOR_PRODUCTS_ENDPOINTS.product(id), { method: "DELETE" }),
};
