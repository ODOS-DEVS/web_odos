/** Temporary dummy seller-center data standing in for the real vendor dashboard endpoints. */

export type SellerStats = {
  storeName: string;
  awaitingConfirmation: number;
  awaitingShipment: number;
  todaySales: number;
  todayOrders: number;
  toConfirmToday: number;
  ordersRefundedToday: number;
  fulfilledPercent: number;
};

export const MOCK_SELLER_STATS: SellerStats = {
  storeName: "Nationwide Sneakers",
  awaitingConfirmation: 13,
  awaitingShipment: 9,
  todaySales: 200,
  todayOrders: 0,
  toConfirmToday: 13,
  ordersRefundedToday: 0,
  fulfilledPercent: 55,
};

export type SellerProfile = {
  storeName: string;
  email: string;
  businessType: string;
  address: string;
  supportEmail: string;
  phone: string;
};

export const MOCK_SELLER_PROFILE: SellerProfile = {
  storeName: "Nationwide Sneaker store",
  email: "nationwide@example.com",
  businessType: "Registered business",
  address: "Dew Street 9, New Gbawe",
  supportEmail: "info@odos.market",
  phone: "+233 54 184 7005",
};
