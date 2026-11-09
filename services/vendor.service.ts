import {
  VENDOR_ANALYTICS_ENDPOINTS,
  VENDOR_ENDPOINTS,
  VENDOR_INVENTORY_ENDPOINTS,
  VENDOR_PRODUCTS_ENDPOINTS,
  VENDOR_PROMOTIONS_ENDPOINTS,
  VENDOR_STORE_ENDPOINTS,
} from "@/libs/api-endpoint";
import type {
  VendorAnalyticsRead,
  VendorApplicationCreate,
  VendorApplicationRead,
  VendorCustomerRead,
  VendorDashboardRead,
  VendorDeliverySettingsRead,
  VendorInventoryMovementRead,
  VendorInventoryStatsRead,
  VendorPayoutInstitutionRead,
  VendorProfileRead,
  VendorReturnRequestRead,
  VendorReviewRead,
  VendorStoreRead,
  VendorStoreSectionRead,
  VendorVoucherRead,
  VendorWalletRead,
} from "@/types/vendor";
import { apiFetch } from "./http";

export type {
  VendorAnalyticsRead,
  VendorApplicationCreate,
  VendorApplicationRead,
  VendorCustomerRead,
  VendorDashboardRead,
  VendorDeliverySettingsRead,
  VendorInventoryMovementRead,
  VendorInventoryStatsRead,
  VendorPayoutInstitutionRead,
  VendorProfileRead,
  VendorReturnRequestRead,
  VendorReviewRead,
  VendorStoreRead,
  VendorStoreSectionRead,
  VendorVoucherRead,
  VendorWalletRead,
};

export const vendorService = {
  // -------------------------------------------------------------
  // Onboarding & Profile
  // -------------------------------------------------------------

  /** Retrieves the shopper's active vendor application, if any. */
  async myApplication(): Promise<VendorApplicationRead | null> {
    try {
      return await apiFetch<VendorApplicationRead>(VENDOR_ENDPOINTS.myApplication, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Submits an application to become a verified ODOS vendor. */
  async submitApplication(input: VendorApplicationCreate): Promise<VendorApplicationRead> {
    const body = {
      business_name: input.business_name,
      business_category: input.business_category,
      category: input.business_category,
      business_description: input.business_description,
      description: input.business_description,
      phone_number: input.phone_number,
      phone: input.phone_number,
      store_name: input.store_name,
      store_description: input.store_description,
      region: input.region,
      city: input.city,
      location_input: input.location_input ?? "",
      location: input.location_input ?? "",
      preferred_market: input.preferred_market ?? "",
      market: input.preferred_market ?? "",
      logo_url: input.logo_url ?? null,
      banner_url: input.banner_url ?? null,
      image_url: input.logo_url ?? null,
      image_banner_url: input.banner_url ?? null,
    };
    return await apiFetch<VendorApplicationRead>(VENDOR_ENDPOINTS.applications, {
      method: "POST",
      body,
    });
  },

  /** Gets the vendor profile for an approved seller. */
  async getProfile(): Promise<VendorProfileRead | null> {
    try {
      return await apiFetch<VendorProfileRead>(VENDOR_ENDPOINTS.me, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Gets seller dashboard metrics and attention items. */
  async getDashboard(): Promise<VendorDashboardRead | null> {
    try {
      return await apiFetch<VendorDashboardRead>(VENDOR_ENDPOINTS.dashboard, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Gets sales and product performance analytics. */
  async getAnalytics(period?: string): Promise<VendorAnalyticsRead | null> {
    try {
      return await apiFetch<VendorAnalyticsRead>(VENDOR_ENDPOINTS.analytics, {
        query: period ? { period } : undefined,
        revalidate: false,
      });
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------
  // Storefront & Curated Sections
  // -------------------------------------------------------------

  /** Gets public store profile as viewed/managed by vendor. */
  async getStore(): Promise<VendorStoreRead | null> {
    try {
      return await apiFetch<VendorStoreRead>(VENDOR_STORE_ENDPOINTS.store, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Updates storefront details (description, logo, banner, address). */
  async patchStore(input: Partial<VendorStoreRead>): Promise<VendorStoreRead> {
    return await apiFetch<VendorStoreRead>(VENDOR_STORE_ENDPOINTS.store, {
      method: "PATCH",
      body: input,
    });
  },

  /** Lists store sections created by this vendor. */
  async getSections(): Promise<VendorStoreSectionRead[]> {
    try {
      const res = await apiFetch<VendorStoreSectionRead[]>(VENDOR_STORE_ENDPOINTS.sections, { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Starter section name suggestions for empty shelves. */
  async getSectionSuggestions(): Promise<string[]> {
    try {
      const res = await apiFetch<string[]>(VENDOR_STORE_ENDPOINTS.sectionSuggestions, { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return ["Featured Collection", "New Arrivals", "Best Sellers", "Clearance Deals"];
    }
  },

  /** Creates a new storefront section shelf. */
  async createSection(input: { title: string; description?: string }): Promise<VendorStoreSectionRead> {
    return await apiFetch<VendorStoreSectionRead>(VENDOR_STORE_ENDPOINTS.sections, {
      method: "POST",
      body: input,
    });
  },

  /** Updates an existing section shelf. */
  async patchSection(sectionId: string, input: Partial<VendorStoreSectionRead>): Promise<VendorStoreSectionRead> {
    return await apiFetch<VendorStoreSectionRead>(VENDOR_STORE_ENDPOINTS.section(sectionId), {
      method: "PATCH",
      body: input,
    });
  },

  /** Deletes a section shelf. */
  async deleteSection(sectionId: string): Promise<unknown> {
    return await apiFetch<unknown>(VENDOR_STORE_ENDPOINTS.section(sectionId), {
      method: "DELETE",
    });
  },

  /** Reorders section shelves on storefront. */
  async reorderSections(sectionIds: string[]): Promise<unknown> {
    return await apiFetch<unknown>(VENDOR_STORE_ENDPOINTS.sectionsReorder, {
      method: "POST",
      body: { section_ids: sectionIds },
    });
  },

  /** Gets product ids tagged on a section shelf. */
  async getSectionProducts(sectionId: string): Promise<string[]> {
    try {
      const res = await apiFetch<string[]>(VENDOR_STORE_ENDPOINTS.sectionProducts(sectionId), { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Adds products to a section shelf. */
  async addSectionProducts(sectionId: string, productIds: string[]): Promise<unknown> {
    return await apiFetch<unknown>(VENDOR_STORE_ENDPOINTS.sectionProducts(sectionId), {
      method: "POST",
      body: { product_ids: productIds },
    });
  },

  /** Removes a product from a section shelf. */
  async removeSectionProduct(sectionId: string, productId: string): Promise<unknown> {
    return await apiFetch<unknown>(VENDOR_STORE_ENDPOINTS.sectionProduct(sectionId, productId), {
      method: "DELETE",
    });
  },

  // -------------------------------------------------------------
  // Customers & Feedback
  // -------------------------------------------------------------

  /** Lists customer accounts who have purchased from this store. */
  async getCustomers(query?: string, limit = 50, offset = 0): Promise<VendorCustomerRead[]> {
    try {
      const res = await apiFetch<VendorCustomerRead[]>(VENDOR_ENDPOINTS.customers, {
        query: { q: query, limit, offset },
        revalidate: false,
      });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /vendor/customers — buyers ranked by spend. Unlike `getCustomers`, errors are thrown so the
   * tab can tell "no customers yet" from "not a vendor" (403) or a failed request.
   */
  async customers(query?: string, limit = 100, offset = 0): Promise<VendorCustomerRead[]> {
    const res = await apiFetch<VendorCustomerRead[]>(VENDOR_ENDPOINTS.customers, {
      query: { q: query?.trim() || undefined, limit, offset },
      revalidate: false,
    });
    return Array.isArray(res) ? res : [];
  },

  /** Lists product reviews left for items sold by this vendor. */
  async getReviews(query?: string, limit = 50, offset = 0): Promise<VendorReviewRead[]> {
    try {
      const res = await apiFetch<VendorReviewRead[]>(VENDOR_ENDPOINTS.reviews, {
        query: { q: query, limit, offset },
        revalidate: false,
      });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Posts or updates the vendor's reply to a customer review. */
  async replyReview(reviewId: string, reply: string): Promise<VendorReviewRead> {
    return await apiFetch<VendorReviewRead>(VENDOR_ENDPOINTS.reviewReply(reviewId), {
      method: "PATCH",
      body: { reply },
    });
  },

  // -------------------------------------------------------------
  // Returns Management
  // -------------------------------------------------------------

  /** Lists customer return requests for products sold by this vendor. */
  async getReturns(): Promise<VendorReturnRequestRead[]> {
    try {
      const res = await apiFetch<VendorReturnRequestRead[]>(VENDOR_ENDPOINTS.returns, { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Gets details for a specific return request. */
  async getReturnDetail(id: string): Promise<VendorReturnRequestRead> {
    return await apiFetch<VendorReturnRequestRead>(VENDOR_ENDPOINTS.return(id), { revalidate: false });
  },

  /** Approves, rejects, or adds notes to a vendor return request. */
  async patchReturn(
    id: string,
    input: { status?: "approved" | "rejected" | string; admin_note?: string; refund_amount?: number }
  ): Promise<VendorReturnRequestRead> {
    return await apiFetch<VendorReturnRequestRead>(VENDOR_ENDPOINTS.return(id), {
      method: "PATCH",
      body: input,
    });
  },

  // -------------------------------------------------------------
  // Wallet & Payouts
  // -------------------------------------------------------------

  /** Retrieves seller earnings balance, commission rates, and pending withdrawals. */
  async getWallet(): Promise<VendorWalletRead | null> {
    try {
      return await apiFetch<VendorWalletRead>(VENDOR_ENDPOINTS.wallet, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Lists available banking and mobile money payout institutions in Ghana. */
  async getPayoutInstitutions(type: "bank" | "mobile_money"): Promise<VendorPayoutInstitutionRead[]> {
    try {
      const res = await apiFetch<VendorPayoutInstitutionRead[]>(VENDOR_ENDPOINTS.payoutInstitutions, {
        query: { payout_method_type: type },
        revalidate: false,
      });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Updates payout destination (bank account or momo number). */
  async patchPayoutDetails(input: {
    payout_method_type: "bank" | "mobile_money" | string;
    account_number: string;
    account_name: string;
    bank_code?: string;
    momo_network?: string;
  }): Promise<VendorWalletRead> {
    return await apiFetch<VendorWalletRead>(VENDOR_ENDPOINTS.payoutDetails, {
      method: "PATCH",
      body: input,
    });
  },

  /** Requests a fund withdrawal from the vendor wallet balance. */
  async requestWithdrawal(amount: number): Promise<{ message: string; withdrawal_id?: string }> {
    return await apiFetch<{ message: string; withdrawal_id?: string }>(VENDOR_ENDPOINTS.withdrawals, {
      method: "POST",
      body: { amount },
    });
  },

  // -------------------------------------------------------------
  // Delivery Settings
  // -------------------------------------------------------------

  /** Retrieves store-level delivery tiers and fee settings. */
  async getDeliverySettings(): Promise<VendorDeliverySettingsRead | null> {
    try {
      return await apiFetch<VendorDeliverySettingsRead>(VENDOR_ENDPOINTS.deliverySettings, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Patches store delivery fees and thresholds. */
  async patchDeliverySettings(input: Partial<VendorDeliverySettingsRead>): Promise<VendorDeliverySettingsRead> {
    return await apiFetch<VendorDeliverySettingsRead>(VENDOR_ENDPOINTS.deliverySettings, {
      method: "PATCH",
      body: input,
    });
  },

  // -------------------------------------------------------------
  // Vouchers & Promotions
  // -------------------------------------------------------------

  /** Lists store-specific discount vouchers created by this vendor. */
  async getVouchers(): Promise<VendorVoucherRead[]> {
    try {
      const res = await apiFetch<VendorVoucherRead[]>(VENDOR_PROMOTIONS_ENDPOINTS.vouchers, { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Creates a new vendor voucher. */
  async createVoucher(input: Partial<VendorVoucherRead>): Promise<VendorVoucherRead> {
    return await apiFetch<VendorVoucherRead>(VENDOR_PROMOTIONS_ENDPOINTS.vouchers, {
      method: "POST",
      body: input,
    });
  },

  /** Updates an existing vendor voucher. */
  async patchVoucher(voucherId: string, input: Partial<VendorVoucherRead>): Promise<VendorVoucherRead> {
    return await apiFetch<VendorVoucherRead>(VENDOR_PROMOTIONS_ENDPOINTS.voucher(voucherId), {
      method: "PATCH",
      body: input,
    });
  },

  /** Deletes an existing vendor voucher. */
  async deleteVoucher(voucherId: string): Promise<unknown> {
    return await apiFetch<unknown>(VENDOR_PROMOTIONS_ENDPOINTS.voucher(voucherId), {
      method: "DELETE",
    });
  },

  /** Gifts a discount voucher to a shopper by email. */
  async giftVoucher(voucherId: string, email: string): Promise<{ message: string }> {
    return await apiFetch<{ message: string }>(VENDOR_PROMOTIONS_ENDPOINTS.voucherGift(voucherId), {
      method: "POST",
      body: { email },
    });
  },

  // -------------------------------------------------------------
  // Inventory Analytics & Movement
  // -------------------------------------------------------------

  /** Overview statistics of store inventory levels and value. */
  async getInventoryStats(): Promise<VendorInventoryStatsRead | null> {
    try {
      return await apiFetch<VendorInventoryStatsRead>(VENDOR_INVENTORY_ENDPOINTS.stats, { revalidate: false });
    } catch {
      return null;
    }
  },

  /** Lists items currently at or below the safety threshold. */
  async getLowStockAlerts(): Promise<any[]> {
    try {
      const res = await apiFetch<any[]>(VENDOR_INVENTORY_ENDPOINTS.lowStockAlerts, { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Lists stock movements and inventory audit history. */
  async getInventoryMovements(productId?: string): Promise<VendorInventoryMovementRead[]> {
    try {
      const path = productId
        ? VENDOR_PRODUCTS_ENDPOINTS.productInventoryMovements(productId)
        : VENDOR_PRODUCTS_ENDPOINTS.inventoryMovements;
      const res = await apiFetch<VendorInventoryMovementRead[]>(path, { revalidate: false });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },
};
