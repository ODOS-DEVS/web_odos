import { apiFetch } from "./http";

/** `POST /vendor/applications` — becoming a vendor. Multipart, because the logo/banner go up with it. */
export type VendorApplicationInput = {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  phoneNumber: string;
  region: string;
  city: string;
  storeName: string;
  storeDescription: string;
  storeLocation: string;
  /** The market's id, not its name. */
  marketId: string | null;
  whatsappNumber?: string | null;
  logo?: File | null;
  banner?: File | null;
  shopPhoto?: File | null;
};

export type VendorApplication = {
  id: string;
  status: string;
  businessName: string;
  storeName: string;
  reviewNote: string | null;
  createdAt: string;
};

type VendorApplicationRead = {
  id: string;
  status: string;
  business_name: string;
  store_name: string;
  review_note?: string | null;
  created_at: string;
};

function toApplication(a: VendorApplicationRead): VendorApplication {
  return {
    id: a.id,
    status: a.status,
    businessName: a.business_name,
    storeName: a.store_name,
    reviewNote: a.review_note ?? null,
    createdAt: a.created_at,
  };
}

const VENDOR_ENDPOINTS = {
  applications: "/vendor/applications",
  myApplication: "/vendor/applications/me",
} as const;

export const vendorService = {
  /** The shopper's own application, or null when they have never applied. */
  async myApplication(): Promise<VendorApplication | null> {
    const row = await apiFetch<VendorApplicationRead | null>(VENDOR_ENDPOINTS.myApplication, { revalidate: false });
    return row ? toApplication(row) : null;
  },

  apply(input: VendorApplicationInput) {
    const form = new FormData();
    form.append("business_name", input.businessName.trim());
    form.append("business_category", input.businessCategory);
    form.append("business_description", input.businessDescription.trim());
    form.append("phone_number", input.phoneNumber.trim());
    form.append("region", input.region);
    form.append("city", input.city.trim());
    form.append("store_name", input.storeName.trim());
    form.append("store_description", input.storeDescription.trim());
    form.append("store_location", input.storeLocation.trim());
    if (input.marketId) form.append("market_id", input.marketId);
    if (input.whatsappNumber?.trim()) form.append("whatsapp_number", input.whatsappNumber.trim());
    if (input.logo) form.append("logo_image", input.logo);
    if (input.banner) form.append("banner_image", input.banner);
    if (input.shopPhoto) form.append("shop_image", input.shopPhoto);

    return apiFetch<unknown>(VENDOR_ENDPOINTS.applications, { method: "POST", body: form, revalidate: false });
  },
};
