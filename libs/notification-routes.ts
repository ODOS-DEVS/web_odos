import type { AppNotification } from "@/types/notification";

/**
 * Where tapping a notification should go on the web.
 *
 * Mirrors the mobile app's `utils/activityNavigation.ts`, which is the canonical map — the same
 * backend emits the same `route_type` to both clients, so the two must agree about what
 * "vendor_order" means. Mobile route names are translated to web paths here.
 *
 * An unmapped route returns `null` and the row renders as plain text rather than a link that
 * goes nowhere.
 */
export function notificationHref(notification: AppNotification): string | null {
  const { routeType, routeTargetId, kind } = notification;
  const id = routeTargetId?.trim() || null;

  switch (routeType) {
    case "order":
      return id ? `/orders/${id}` : "/orders";
    case "orders":
      return "/orders";
    case "profile":
      return "/account";
    case "customer_wallet":
      return "/account?tab=wallet";
    case "customer_vouchers":
      return "/account?tab=vouchers";
    case "customer_chat":
      return "/account?tab=chats";
    case "vendor_order":
      return id ? `/seller/orders/${id}` : "/seller/orders";
    case "vendor_wallet":
      return "/seller/wallet";
    case "vendor_vouchers":
      return "/seller/vouchers";
    case "vendor_chat":
      return "/seller/chats";
    case "vendor_product":
      return id ? `/seller/products/${id}` : "/seller/products";
    case "vendor_campaign":
      return "/seller/campaigns";
    case "vendor_campaign_submit":
      // The target is the campaign slug, so a campaign invitation opens that campaign's own
      // submission page rather than a generic list the vendor then has to search.
      return id ? `/seller/campaigns/${id}/submit` : "/seller/campaigns";
    case "vendor_flash_sale":
      return "/seller/flash-sales";
    default:
      break;
  }

  // No route named, so fall back on what the notification is about. Covers events the backend
  // emits without a destination — a settled payment, an approved application.
  if (kind.startsWith("withdrawal_") || kind.startsWith("payout_")) return "/seller/wallet";
  if (kind.startsWith("vendor_order")) return id ? `/seller/orders/${id}` : "/seller/orders";
  if (kind.startsWith("order_")) return id ? `/orders/${id}` : "/orders";
  if (kind.startsWith("booking_")) return "/account?tab=bookings";
  if (kind === "account_ready" || kind.startsWith("vendor_application") || kind === "vendor_rejected") {
    return "/account?tab=vendor";
  }
  if (kind.startsWith("voucher")) return "/account?tab=vouchers";
  return null;
}

/** Broad grouping for the icon and tint, so a payout does not look like a chat message. */
export type NotificationTone = "order" | "money" | "message" | "promo" | "account" | "stock";

export function notificationTone(notification: AppNotification): NotificationTone {
  const k = notification.kind;
  if (k.startsWith("withdrawal_") || k.startsWith("payout_") || k.includes("payment") || k.includes("wallet")) {
    return "money";
  }
  if (k.includes("chat") || k.includes("message")) return "message";
  if (k.includes("voucher") || k.includes("campaign") || k.includes("flash")) return "promo";
  if (k.includes("stock") || k.includes("inventory")) return "stock";
  if (k.includes("order") || k.includes("booking") || k.includes("delivery")) return "order";
  return "account";
}
