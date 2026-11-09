export type ReturnRequestType = "refund" | "exchange" | "return";
export type ReturnRequestStatus = "pending" | "approved" | "rejected";

/** A delivered order line the shopper can still file a return/exchange/refund request against. */
export type ReturnEligibleItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  name: string;
  imageUrl: string | null;
  variant: string;
  deliveredAt: string;
  quantity: number;
  unitPrice: number;
};

/** A filed request. `status` is free text on the wire, so unknown values are kept as-is. */
export type ReturnRequest = {
  id: string;
  orderId: string;
  itemId: string;
  type: ReturnRequestType;
  quantity: number;
  reason: string;
  details: string;
  status: string;
  evidenceImageUrls: string[];
  adminNote: string | null;
  refundAmount: number | null;
  createdAt: string;
};
