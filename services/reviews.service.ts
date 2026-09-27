import { REVIEWS_ENDPOINTS } from "@/libs/api-endpoint";
import type { ProductReviewRead } from "@/types/api";
import type { Review } from "@/types/catalog";
import { apiFetch } from "./http";
import { toReview } from "./mappers";

export const reviewsService = {
  async forProduct(productId: string, limit = 20): Promise<Review[]> {
    const rows = await apiFetch<ProductReviewRead[]>(REVIEWS_ENDPOINTS.forProduct(productId), { query: { limit } });
    return rows.map(toReview);
  },
};
