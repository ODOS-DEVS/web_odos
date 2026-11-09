/* eslint-disable @typescript-eslint/no-explicit-any -- campaign responses are untyped in the API spec, so they're mapped defensively */
import { VENDOR_PROMOTIONS_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";

export type VendorCampaign = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  bannerUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  productIds: string[];
  createdAt: string | null;
};

/** The body of POST /vendor/campaigns and PUT /vendor/campaigns/{id} (CreateCampaignRequest). */
export type VendorCampaignInput = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  product_ids?: string[] | null;
};

const toCampaign = (raw: any): VendorCampaign => {
  const c = raw?.campaign ?? raw ?? {};
  const productIds: string[] = Array.isArray(c.product_ids)
    ? c.product_ids.map(String)
    : Array.isArray(c.products)
      ? c.products.map((p: any) => String(p?.id ?? p?.product_id ?? p))
      : [];
  return {
    id: String(c.id ?? c.campaign_id ?? ""),
    title: c.title ?? c.name ?? "Untitled campaign",
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    bannerUrl: c.banner_image_url ?? c.banner_url ?? c.image_url ?? null,
    startsAt: c.starts_at ?? c.start_date ?? null,
    endsAt: c.ends_at ?? c.end_date ?? null,
    status: String(c.status ?? c.approval_status ?? "draft").toLowerCase(),
    productIds,
    createdAt: c.created_at ?? null,
  };
};

const rowsOf = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  for (const key of ["campaigns", "items", "data", "results"]) if (Array.isArray(res?.[key])) return res[key];
  return [];
};

/** /vendor/campaigns — the vendor's own store campaigns. */
export const vendorCampaignsService = {
  async list(): Promise<VendorCampaign[]> {
    const res = await apiFetch<any>(VENDOR_PROMOTIONS_ENDPOINTS.campaigns, { revalidate: false });
    return rowsOf(res).map(toCampaign);
  },

  async get(id: string): Promise<VendorCampaign> {
    return toCampaign(await apiFetch<any>(VENDOR_PROMOTIONS_ENDPOINTS.campaign(id), { revalidate: false }));
  },

  async create(input: VendorCampaignInput): Promise<VendorCampaign> {
    return toCampaign(await apiFetch<any>(VENDOR_PROMOTIONS_ENDPOINTS.campaigns, { method: "POST", body: input }));
  },

  async update(id: string, input: VendorCampaignInput): Promise<VendorCampaign> {
    return toCampaign(await apiFetch<any>(VENDOR_PROMOTIONS_ENDPOINTS.campaign(id), { method: "PUT", body: input }));
  },
};
