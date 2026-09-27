import type { CategoryRead, ProductRead, ProductReviewRead, StoreRead } from "@/types/api";
import type { Category, Product, ProductTag, Review, Store } from "@/types/catalog";
import type { OrderItemRead, OrderPackageRead, OrderRead } from "@/types/api";
import type { FulfilmentStatus, Order, OrderItem, OrderPackage } from "@/types/order";
import { rollupStatus } from "@/libs/orders";

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function toCategory(c: CategoryRead): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.title,
    subtitle: c.subtitle ?? "",
    imageUrl: c.image_url ?? null,
    subcategories: c.subcategories ?? [],
  };
}

export function toStore(s: StoreRead): Store {
  return {
    id: s.id,
    slug: s.slug,
    name: s.title,
    category: s.category ?? "",
    description: s.description ?? "",
    logoUrl: s.image_url ?? null,
    bannerUrl: s.image_banner_url ?? null,
    rating: s.rating ?? 0,
    city: s.city ?? null,
    region: s.region ?? null,
    address: s.address ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    whatsappUrl: s.whatsapp_url ?? null,
    deliveryBadge: s.delivery_badge ?? null,
    deliveryFeeFrom: s.delivery_fee_from ?? null,
    isOnVacation: Boolean(s.is_on_vacation),
    vacationMessage: s.vacation_message ?? null,
    marketSlug: s.market_slug ?? null,
  };
}

/** The API sends the review count as a string (or null). */
function toCount(value: string | number | null | undefined) {
  const n = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

export function toProduct(p: ProductRead): Product {
  const images = (p.image_urls?.length ? p.image_urls : p.image_url ? [p.image_url] : []).filter(Boolean) as string[];
  const created = p.created_at ? new Date(p.created_at).getTime() : 0;

  const tags: ProductTag[] = [];
  if (p.section === "popular") tags.push("popular");
  if (p.section === "flash-sale" || p.placement_tags?.includes("flash-sale") || p.flash_sale_event_slug) tags.push("flash");
  if (created && Date.now() - created < NEW_WINDOW_MS) tags.push("new");

  const slugs = new Set<string>([...(p.category_slugs ?? []), ...(p.category ? [slugify(p.category)] : [])]);

  return {
    id: p.id,
    name: p.title,
    description: p.description ?? "",
    price: p.price,
    compareAtPrice: p.old_price && p.old_price > p.price ? p.old_price : null,
    discountLabel: p.discount ?? null,
    storeId: p.store_id ?? null,
    categoryName: p.category ?? "",
    categorySlugs: [...slugs],
    subcategory: p.subcategory ?? null,
    rating: p.rating ?? 0,
    reviewCount: toCount(p.reviews),
    stock: p.stock ?? 0,
    images,
    colors: p.color_options ?? [],
    sizes: p.size_options ?? [],
    specifications: p.specifications ?? [],
    tags,
    flashSale:
      p.flash_sale_ends_at || p.flash_sale_event_title
        ? {
            endsAt: p.flash_sale_ends_at ?? null,
            unitsRemaining: p.flash_sale_units_remaining ?? null,
            eventTitle: p.flash_sale_event_title ?? null,
          }
        : null,
    createdAt: p.created_at ?? "",
  };
}

export function toReview(r: ProductReviewRead): Review {
  return {
    id: r.id,
    author: r.user_display_name,
    rating: r.rating,
    date: r.created_at,
    body: r.comment,
    vendorReply: r.vendor_reply ?? null,
  };
}

/* ---------- Orders ---------- */


/**
 * The API's order/package statuses are free-text with no documented enum, so match on stems
 * ("deliver", "dispatch"…) rather than exact values. Unknown values fall back to "pending".
 */
export function normaliseStatus(...values: (string | null | undefined)[]): FulfilmentStatus | null {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  if (!text) return null;
  if (/cancel|declin|reject/.test(text)) return "cancelled";
  if (/delay|problem|fail|return/.test(text)) return "delayed";
  if (/out[_ ]for|transit|dispatch|ship|on[_ ]the[_ ]way/.test(text)) return "out_for_delivery";
  if (/deliver|complete/.test(text) && !/pending|not/.test(text)) return "delivered";
  if (/prepar|process|pack|ready/.test(text)) return "preparing";
  if (/confirm|accept|paid/.test(text)) return "confirmed";
  return null;
}

const humanise = (status: string) => status.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function toOrderItem(i: OrderItemRead): OrderItem {
  return {
    id: i.id,
    productId: i.product_id,
    name: i.title,
    imageUrl: i.image_url ?? null,
    quantity: i.quantity,
    unitPrice: i.unit_price,
    lineTotal: i.line_total,
    size: i.selected_size ?? null,
    color: i.selected_color ?? null,
  };
}

function toPackage(p: OrderPackageRead, items: OrderItem[]): OrderPackage {
  let status: FulfilmentStatus = "pending";
  if (p.cancelled_at) status = "cancelled";
  else if (p.delivered_at) status = "delivered";
  else if (p.delivery_problem_reason) status = "delayed";
  else if (p.dispatched_at) status = "out_for_delivery";
  else status = normaliseStatus(p.delivery_status, p.vendor_status) ?? "pending";

  return {
    id: p.id,
    number: p.package_number,
    storeId: p.store_id ?? null,
    storeName: p.store_name ?? "Vendor",
    status,
    items,
    itemsSubtotal: p.items_subtotal,
    discountShare: p.discount_share,
    deliveryFee: p.delivery_fee,
    deliveryFeeWaived: p.delivery_fee_waived,
    eta: p.tracking_eta ?? null,
    problem: p.delivery_problem_reason ?? null,
  };
}

export function toOrder(o: OrderRead): Order {
  const items = o.items.map(toOrderItem);
  const byId = new Map(items.map((i) => [i.id, i]));
  const rawPackages = o.packages ?? [];

  const packages = rawPackages.map((p) => {
    const own = (p.item_ids ?? []).flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    // A single package with no item ids simply holds the whole order.
    return toPackage(p, own.length || rawPackages.length > 1 ? own : items);
  });

  return {
    id: o.id,
    number: o.order_number,
    placedAt: o.placed_at,
    status: packages.length ? rollupStatus(packages) : (normaliseStatus(o.delivery_status, o.vendor_status, o.status) ?? "pending"),
    paymentStatus: o.payment_status,
    paymentLabel: o.payment_label,
    deliveryMethod: o.delivery_method,
    subtotal: o.subtotal_amount,
    shipping: o.shipping_amount,
    discount: o.discount_amount,
    total: o.total_amount,
    packages,
    timeline: (o.timeline ?? []).map((e) => ({ at: e.occurred_at, label: e.note?.trim() || humanise(e.status) })),
    address: {
      name: o.address_full_name,
      phone: o.address_phone,
      street: o.address_street,
      city: o.address_city,
      region: o.address_region,
    },
  };
}
