export type DeliverySpeed = "economy" | "express" | "same_day";

export type DeliveryOption = {
  id: DeliverySpeed;
  title: string;
  subtitle: string;
  eta: string;
  amount: number;
  badge: string | null;
  available: boolean;
  unavailableReason: string | null;
};

/** Per-vendor slice of a quote: each vendor delivers its own package, so fees are per vendor. */
export type PackageQuote = {
  storeId: string | null;
  storeName: string | null;
  itemsSubtotal: number;
  deliveryFee: number;
  feeWaived: boolean;
  freeThreshold: number;
  amountToFreeDelivery: number | null;
};

export type DeliveryQuote = {
  options: DeliveryOption[];
  selected: DeliverySpeed;
  shippingAmount: number;
  freeThreshold: number;
  sameDayCutoffPassed: boolean;
  packages: PackageQuote[];
};
