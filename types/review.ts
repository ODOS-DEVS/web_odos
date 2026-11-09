/** A review the shopper wrote. The API keys these by order + product, not by order item. */
export type MyReview = {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};
