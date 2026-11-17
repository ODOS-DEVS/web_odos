import {
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Truck,
  Users,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Counts the sidebar can surface as a badge, resolved once in the shell. */
export type VendorNavCountKey = "orders" | "returns" | "chats" | "lowStock" | "notifications";

export type VendorNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Badge source. Absent means the item never shows a count. */
  count?: VendorNavCountKey;
  /** Matches nested routes too, e.g. /seller/orders/123. */
  nested?: boolean;
};

export type VendorNavGroup = { label: string; items: VendorNavItem[] };

export const VENDOR_NAV: VendorNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
      { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Selling",
    items: [
      { href: "/seller/orders", label: "Orders", icon: ShoppingBag, count: "orders", nested: true },
      { href: "/seller/products", label: "Products", icon: Package, nested: true },
      { href: "/seller/inventory", label: "Inventory", icon: Warehouse, count: "lowStock" },
      { href: "/seller/returns", label: "Returns", icon: RotateCcw, count: "returns" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/seller/vouchers", label: "Vouchers", icon: Ticket },
      { href: "/seller/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/seller/flash-sales", label: "Flash sales", icon: Zap },
      { href: "/seller/sections", label: "Storefront", icon: LayoutGrid },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/seller/customers", label: "Customers", icon: Users },
      { href: "/seller/chats", label: "Messages", icon: MessageSquare, count: "chats" },
      { href: "/seller/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/seller/wallet", label: "Earnings", icon: CreditCard },
      { href: "/seller/store", label: "Store profile", icon: Store },
      { href: "/seller/delivery", label: "Delivery", icon: Truck },
      { href: "/seller/notifications", label: "Notifications", icon: Bell, count: "notifications" },
      { href: "/seller/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_ITEMS = VENDOR_NAV.flatMap((group) => group.items);

export function isVendorNavItemActive(item: VendorNavItem, pathname: string) {
  if (pathname === item.href) return true;
  return Boolean(item.nested) && pathname.startsWith(`${item.href}/`);
}

/**
 * The page title for a path. Longest match wins so `/seller/orders/123` resolves to Orders
 * rather than to Dashboard, whose href is a prefix of every route here.
 */
export function vendorPageTitle(pathname: string) {
  const match = ALL_ITEMS.filter((item) => isVendorNavItemActive(item, pathname)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.label ?? "Seller Center";
}
