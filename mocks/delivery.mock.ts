import type { DeliveryQuoteInput } from "@/services/delivery.service";
import type { DeliveryOption, DeliveryQuote, DeliverySpeed, PackageQuote } from "@/types/delivery";
import { mockProduct, MOCK_STORES } from "./catalog.mock";

/** Temporary dummy delivery pricing standing in for `deliveryService`. Delete along with `mocks/`. */

const FREE_THRESHOLD = 200;
const SPEED_MULTIPLIER: Record<DeliverySpeed, number> = { economy: 1, express: 1.5, same_day: 2 };

function packageFeesFor(items: NonNullable<DeliveryQuoteInput["items"]>, method: DeliverySpeed): PackageQuote[] {
  const storeIds = [...new Set(items.map((i) => mockProduct(i.productId)?.storeId).filter((id): id is string => Boolean(id)))];

  return storeIds.map((storeId) => {
    const store = MOCK_STORES.find((s) => s.id === storeId);
    const itemsSubtotal = items
      .filter((i) => mockProduct(i.productId)?.storeId === storeId)
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const feeWaived = itemsSubtotal >= FREE_THRESHOLD;
    const deliveryFee = feeWaived ? 0 : Math.round((store?.deliveryFeeFrom ?? 15) * SPEED_MULTIPLIER[method]);
    return {
      storeId,
      storeName: store?.name ?? null,
      itemsSubtotal,
      deliveryFee,
      feeWaived,
      freeThreshold: FREE_THRESHOLD,
      amountToFreeDelivery: feeWaived ? null : FREE_THRESHOLD - itemsSubtotal,
    };
  });
}

export function mockDeliveryQuote(input: DeliveryQuoteInput): DeliveryQuote {
  const method = input.method ?? "economy";
  const items = input.items ?? [];
  const packagesFor = (speed: DeliverySpeed) => packageFeesFor(items, speed);
  const packages = packagesFor(method);
  const shippingAmount = packages.reduce((sum, p) => sum + p.deliveryFee, 0);

  const options: DeliveryOption[] = (["economy", "express", "same_day"] as const).map((id) => {
    const amount = packagesFor(id).reduce((sum, p) => sum + p.deliveryFee, 0);
    const titles: Record<DeliverySpeed, { title: string; subtitle: string; eta: string }> = {
      economy: { title: "Economy", subtitle: "Standard delivery", eta: "2-4 days" },
      express: { title: "Express", subtitle: "Faster delivery", eta: "1-2 days" },
      same_day: { title: "Same day", subtitle: "Order before 12pm", eta: "Today" },
    };
    return { id, ...titles[id], amount, badge: id === "same_day" ? "Fastest" : null, available: true, unavailableReason: null };
  });

  return { options, selected: method, shippingAmount, freeThreshold: FREE_THRESHOLD, sameDayCutoffPassed: false, packages };
}
