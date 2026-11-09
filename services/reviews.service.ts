import { REVIEWS_ENDPOINTS } from "@/libs/api-endpoint";
import type { ProductReviewRead, ReviewUpsert, UserReviewRead } from "@/types/api";
import type { Review } from "@/types/catalog";
import { apiFetch } from "./http";
import { toReview } from "./mappers";

/** A review the signed-in shopper wrote, tied to the order it was bought in. */
export type MyProductReview = {
  id: string;
  orderId: string;
  productId: string;
  rating: number;
  comment: string;
  updatedAt: string;
};

const toMyReview = (r: UserReviewRead): MyProductReview => ({
  id: r.id,
  orderId: r.order_id,
  productId: r.product_id,
  rating: r.rating,
  comment: r.comment,
  updatedAt: r.updated_at,
});

export const reviewsService = {
  async forProduct(productId: string, limit = 20): Promise<Review[]> {
    const rows = await apiFetch<ProductReviewRead[]>(REVIEWS_ENDPOINTS.forProduct(productId), { query: { limit } });
    return rows.map(toReview);
  },

  /** Every review the signed-in shopper has written (login required). */
  async mine(): Promise<MyProductReview[]> {
    const rows = await apiFetch<UserReviewRead[]>(REVIEWS_ENDPOINTS.mine, { revalidate: false });
    return rows.map(toMyReview);
  },

  /** Creates or updates the shopper's review of a product they bought in `orderId`. */
  async upsert(input: { orderId: string; productId: string; rating: number; comment: string }): Promise<MyProductReview> {
    const body: ReviewUpsert = {
      order_id: input.orderId,
      product_id: input.productId,
      rating: input.rating,
      comment: input.comment,
    };
    return toMyReview(await apiFetch<UserReviewRead>(REVIEWS_ENDPOINTS.upsert, { method: "POST", body }));
  },
};
