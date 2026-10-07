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

export type ReturnRequest = {
  id: string;
  itemId: string;
  type: ReturnRequestType;
  quantity: number;
  reason: string;
  details: string;
  photoNames: string[];
  status: ReturnRequestStatus;
  createdAt: string;
};
