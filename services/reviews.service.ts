import { REVIEWS_ENDPOINTS } from "@/libs/api-endpoint";
import type { ProductReviewRead } from "@/types/api";
import type { Review } from "@/types/catalog";
import type { MyReview } from "@/types/review";
import { apiFetch } from "./http";
import { toReview } from "./mappers";

/** `GET /reviews/me` — the shopper's own reviews, keyed by the order they came from. */
type UserReviewRead = {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  title: string;
  image_url?: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

export type ReviewInput = { orderId: string; productId: string; rating: number; comment: string };

function toMyReview(r: UserReviewRead): MyReview {
  return {
    id: r.id,
    orderId: r.order_id,
    orderNumber: r.order_number,
    productId: r.product_id,
    productName: r.title,
    imageUrl: r.image_url ?? null,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  };
}

export const reviewsService = {
  async forProduct(productId: string, limit = 20): Promise<Review[]> {
    const rows = await apiFetch<ProductReviewRead[]>(REVIEWS_ENDPOINTS.forProduct(productId), { query: { limit } });
    return rows.map(toReview);
  },

  async mine(): Promise<MyReview[]> {
    const rows = await apiFetch<UserReviewRead[]>(REVIEWS_ENDPOINTS.mine, { revalidate: false });
    return rows.map(toMyReview);
  },

  /** Creates or replaces the shopper's review for one product on one order. */
  upsert: (input: ReviewInput) =>
    apiFetch<unknown>(REVIEWS_ENDPOINTS.upsert, {
      method: "POST",
      body: { order_id: input.orderId, product_id: input.productId, rating: input.rating, comment: input.comment },
    }),
};
