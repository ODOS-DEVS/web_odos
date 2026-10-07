import type { ReturnEligibleItem } from "@/types/returns";

/** Temporary dummy data standing in for a `returnsService`. Delete along with `mocks/`. */

export const MOCK_RETURN_ELIGIBLE_ITEMS: ReturnEligibleItem[] = [
  {
    id: "return-item-1",
    orderId: "order-1000",
    orderNumber: "ODOS-1000",
    name: "Mikey",
    imageUrl: null,
    variant: "Cross Reiss HO14681",
    deliveredAt: "2025-08-16T00:00:00.000Z",
    quantity: 1,
    unitPrice: 134,
  },
];
