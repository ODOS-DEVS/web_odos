import { VENDOR_ENDPOINTS } from "@/libs/api-endpoint";
import { apiFetch } from "./http";
import type {
  CampaignBrief,
  CampaignSubmissionResult,
  CampaignWorkspace,
  VendorCampaignSubmission,
} from "@/types/vendor";
import type {
  BusinessHours,
  MerchandisingOptIn,
  VendorDeliverySettings,
  VendorFlashNomination,
  VendorStoreProfile,
  VendorStoreSection,
  VendorStoreUpdate,
} from "@/types/vendor";


/* ---------- Campaign submission wire shapes ---------- */

type CampaignBriefRead = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  thumbnail_image_url?: string | null;
  theme_color?: string | null;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  submission_deadline?: string | null;
  submission_closes_at?: string | null;
  accepts_submissions?: boolean;
  requires_proposed_price?: boolean;
  min_discount_percent?: number | null;
  max_products?: number | null;
  product_count?: number;
};

type CampaignSubmissionRead = {
  id: string;
  campaign_id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  current_price?: number | null;
  proposed_price?: number | null;
  proposed_old_price?: number | null;
  discount_percent?: number | null;
  vendor_note?: string | null;
  status: string;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
};

type CampaignWorkspaceRead = {
  campaign: CampaignBriefRead;
  submissions: CampaignSubmissionRead[];
};

type CampaignSubmissionResultRead = {
  campaign_slug: string;
  submitted: number;
  rejected: number;
  outcomes: { product_id: string; accepted: boolean; reason?: string | null; detail?: string | null }[];
};

const toCampaignBrief = (c: CampaignBriefRead): CampaignBrief => ({
  id: c.id,
  slug: c.slug,
  title: c.title,
  subtitle: c.subtitle ?? null,
  description: c.description ?? null,
  bannerImageUrl: c.banner_image_url ?? null,
  thumbnailImageUrl: c.thumbnail_image_url ?? null,
  themeColor: c.theme_color ?? null,
  status: c.status,
  startsAt: c.starts_at ?? null,
  endsAt: c.ends_at ?? null,
  submissionDeadline: c.submission_deadline ?? null,
  submissionClosesAt: c.submission_closes_at ?? null,
  acceptsSubmissions: Boolean(c.accepts_submissions),
  requiresProposedPrice: Boolean(c.requires_proposed_price),
  minDiscountPercent: c.min_discount_percent ?? null,
  maxProducts: c.max_products ?? null,
  productCount: c.product_count ?? 0,
});

const toCampaignSubmission = (s: CampaignSubmissionRead): VendorCampaignSubmission => ({
  id: s.id,
  campaignId: s.campaign_id,
  productId: s.product_id,
  productTitle: s.product_title,
  productImageUrl: s.product_image_url ?? null,
  currentPrice: s.current_price ?? null,
  proposedPrice: s.proposed_price ?? null,
  proposedOldPrice: s.proposed_old_price ?? null,
  discountPercent: s.discount_percent ?? null,
  vendorNote: s.vendor_note ?? null,
  status: s.status,
  reviewNotes: s.review_notes ?? null,
  createdAt: s.created_at,
  updatedAt: s.updated_at,
});

/* ---------- Wire shapes ---------- */

type VendorStoreRead = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  audience_slugs?: string[] | null;
  market_id?: string | null;
  location?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  twitter_url?: string | null;
  whatsapp_url?: string | null;
  website_url?: string | null;
  region: string;
  city: string;
  banner_image_url?: string | null;
  logo_image_url?: string | null;
  status: string;
  is_on_vacation?: boolean;
  vacation_message?: string | null;
  business_hours?: BusinessHours | null;
};

type DeliverySettingsRead = {
  economy_fee?: number | null;
  express_fee?: number | null;
  same_day_fee?: number | null;
  free_delivery_threshold?: number | null;
  express_enabled?: boolean;
  same_day_enabled?: boolean;
  default_economy_fee: number;
  default_express_fee: number;
  default_same_day_fee: number;
  default_free_delivery_threshold: number;
  badge?: string | null;
  max_fee?: number;
  max_free_delivery_threshold?: number;
  is_custom?: boolean;
};

type SectionRead = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  cover_image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
};

type NominationRead = {
  id: string;
  event_id?: string | null;
  event_title?: string | null;
  product_id: string;
  product_title?: string | null;
  product_image_url?: string | null;
  proposed_price?: number | null;
  proposed_old_price?: number | null;
  stock_limit?: number | null;
  units_sold?: number | null;
  units_remaining?: number | null;
  max_per_user?: number | null;
  vendor_note?: string | null;
  status: string;
  review_notes?: string | null;
  created_at: string;
};


type OptInRead = {
  id: string;
  campaign_id: string;
  campaign_title?: string | null;
  product_id?: string | null;
  status: string;
  created_at: string;
};

const toSection = (s: SectionRead): VendorStoreSection => ({
  id: s.id,
  title: s.title,
  slug: s.slug,
  description: s.description ?? null,
  coverImageUrl: s.cover_image_url ?? null,
  sortOrder: s.sort_order,
  isActive: s.is_active,
  productCount: s.product_count ?? 0,
});

export const vendorStoreService = {
  async profile(): Promise<VendorStoreProfile> {
    const s = await apiFetch<VendorStoreRead>(VENDOR_ENDPOINTS.store, { revalidate: false });
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      category: s.category,
      marketId: s.market_id ?? null,
      location: s.location ?? null,
      phone: s.phone ?? null,
      region: s.region,
      city: s.city,
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      instagramUrl: s.instagram_url ?? null,
      facebookUrl: s.facebook_url ?? null,
      tiktokUrl: s.tiktok_url ?? null,
      twitterUrl: s.twitter_url ?? null,
      whatsappUrl: s.whatsapp_url ?? null,
      websiteUrl: s.website_url ?? null,
      logoUrl: s.logo_image_url ?? null,
      bannerUrl: s.banner_image_url ?? null,
      status: s.status,
      isOnVacation: Boolean(s.is_on_vacation),
      vacationMessage: s.vacation_message ?? null,
      businessHours: s.business_hours ?? null,
      audienceSlugs: s.audience_slugs ?? [],
    };
  },

  /**
   * Saves the store. Like the product endpoint this is a whole-record write — name, description,
   * category, region and city are all required by the API on every call, not just the changed ones.
   * `business_hours` goes over as a JSON string; omitting it entirely leaves the stored hours alone.
   */
  updateProfile(input: VendorStoreUpdate) {
    const form = new FormData();
    form.append("name", input.name.trim());
    form.append("description", input.description.trim());
    form.append("category", input.category.trim());
    form.append("region", input.region.trim());
    form.append("city", input.city.trim());

    // Coordinates and audience slugs are not edited here, but the endpoint overwrites them from
    // the payload, so they have to go back or they are cleared.
    if (typeof input.latitude === "number") form.append("latitude", String(input.latitude));
    if (typeof input.longitude === "number") form.append("longitude", String(input.longitude));
    if (input.audienceSlugs?.length) form.append("audience_slugs", input.audienceSlugs.join(", "));

    const optional: [string, string | null | undefined][] = [
      ["market_id", input.marketId],
      ["location", input.location],
      ["phone", input.phone],
      ["instagram_url", input.instagramUrl],
      ["facebook_url", input.facebookUrl],
      ["tiktok_url", input.tiktokUrl],
      ["twitter_url", input.twitterUrl],
      ["whatsapp_url", input.whatsappUrl],
      ["website_url", input.websiteUrl],
      ["vacation_message", input.vacationMessage],
    ];
    for (const [key, value] of optional) {
      if (value !== undefined && value !== null) form.append(key, value);
    }

    if (typeof input.isOnVacation === "boolean") form.append("is_on_vacation", String(input.isOnVacation));
    if (input.businessHours) form.append("business_hours", JSON.stringify(input.businessHours));
    if (input.logo) form.append("logo_image", input.logo);
    if (input.banner) form.append("banner_image", input.banner);

    return apiFetch<unknown>(VENDOR_ENDPOINTS.store, { method: "PATCH", body: form, revalidate: false });
  },

  /* ---------- Delivery ---------- */

  async deliverySettings(): Promise<VendorDeliverySettings> {
    const d = await apiFetch<DeliverySettingsRead>(VENDOR_ENDPOINTS.deliverySettings, { revalidate: false });
    return {
      economyFee: d.economy_fee ?? null,
      expressFee: d.express_fee ?? null,
      sameDayFee: d.same_day_fee ?? null,
      freeDeliveryThreshold: d.free_delivery_threshold ?? null,
      expressEnabled: d.express_enabled ?? true,
      sameDayEnabled: d.same_day_enabled ?? true,
      defaultEconomyFee: d.default_economy_fee,
      defaultExpressFee: d.default_express_fee,
      defaultSameDayFee: d.default_same_day_fee,
      defaultFreeDeliveryThreshold: d.default_free_delivery_threshold,
      badge: d.badge ?? null,
      maxFee: d.max_fee ?? 200,
      maxFreeDeliveryThreshold: d.max_free_delivery_threshold ?? 5000,
      isCustom: Boolean(d.is_custom),
    };
  },

  /**
   * Only the fields sent are changed. `null` clears an override back to the platform default;
   * zero is a real price meaning "I deliver free", so the two are never conflated.
   */
  updateDeliverySettings(input: {
    economyFee?: number | null;
    expressFee?: number | null;
    sameDayFee?: number | null;
    freeDeliveryThreshold?: number | null;
    expressEnabled?: boolean;
    sameDayEnabled?: boolean;
  }) {
    return apiFetch<unknown>(VENDOR_ENDPOINTS.deliverySettings, {
      method: "PATCH",
      body: {
        economy_fee: input.economyFee,
        express_fee: input.expressFee,
        same_day_fee: input.sameDayFee,
        free_delivery_threshold: input.freeDeliveryThreshold,
        express_enabled: input.expressEnabled,
        same_day_enabled: input.sameDayEnabled,
      },
    });
  },

  /* ---------- Storefront sections ---------- */

  async sections(): Promise<VendorStoreSection[]> {
    const rows = await apiFetch<SectionRead[]>(VENDOR_ENDPOINTS.storeSections, { revalidate: false });
    return rows.map(toSection).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  createSection: (input: { title: string; description?: string | null }) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.storeSections, {
      method: "POST",
      body: { title: input.title, description: input.description ?? null },
    }),

  updateSection: (
    sectionId: string,
    changes: { title?: string; description?: string | null; isActive?: boolean },
  ) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.storeSection(sectionId), {
      method: "PATCH",
      body: { title: changes.title, is_active: changes.isActive },
    }),

  deleteSection: (sectionId: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.storeSection(sectionId), { method: "DELETE" }),

  reorderSections: (sectionIds: string[]) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.storeSectionsReorder, { method: "POST", body: { section_ids: sectionIds } }),

  sectionProducts: (sectionId: string) =>
    apiFetch<string[]>(VENDOR_ENDPOINTS.storeSectionProducts(sectionId), { revalidate: false }),

  /**
   * The finished shelf. PUT replaces rather than appends — a picker that posted additions
   * would silently keep anything the vendor had unticked.
   */
  setSectionProducts: (sectionId: string, productIds: string[]) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.storeSectionProducts(sectionId), {
      method: "PUT",
      body: { product_ids: productIds },
    }),

  uploadSectionCover: (sectionId: string, file: File) => {
    const form = new FormData();
    form.append("cover_image", file);
    return apiFetch<unknown>(VENDOR_ENDPOINTS.storeSectionCover(sectionId), {
      method: "POST",
      body: form,
    });
  },

  /* ---------- Flash sales and campaigns (both ODOS-reviewed) ---------- */

  async flashNominations(): Promise<VendorFlashNomination[]> {
    const rows = await apiFetch<NominationRead[]>(VENDOR_ENDPOINTS.flashSaleNominations, { revalidate: false });
    return rows.map((n) => ({
      id: n.id,
      eventId: n.event_id ?? null,
      eventTitle: n.event_title ?? null,
      productId: n.product_id,
      productTitle: n.product_title ?? null,
      productImageUrl: n.product_image_url ?? null,
      proposedPrice: n.proposed_price ?? null,
      proposedOldPrice: n.proposed_old_price ?? null,
      stockLimit: n.stock_limit ?? null,
      unitsSold: n.units_sold ?? null,
      unitsRemaining: n.units_remaining ?? null,
      maxPerUser: n.max_per_user ?? null,
      vendorNote: n.vendor_note ?? null,
      status: n.status,
      reviewNotes: n.review_notes ?? null,
      createdAt: n.created_at,
    }));
  },

  nominateForFlashSale: (input: {
    productId: string;
    eventId?: string | null;
    proposedPrice?: number | null;
    proposedOldPrice?: number | null;
    stockLimit?: number | null;
    maxPerUser?: number | null;
    vendorNote?: string | null;
  }) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.flashSaleNominations, {
      method: "POST",
      body: {
        product_id: input.productId,
        event_id: input.eventId ?? null,
        proposed_price: input.proposedPrice ?? null,
        proposed_old_price: input.proposedOldPrice ?? null,
        stock_limit: input.stockLimit ?? null,
        max_per_user: input.maxPerUser ?? null,
        vendor_note: input.vendorNote ?? null,
      },
    }),

  /**
   * Campaigns this vendor can nominate into right now — not the same set as the shopper-facing
   * live list, because nominations are collected before a seasonal sale opens.
   */
  async openCampaigns(): Promise<CampaignBrief[]> {
    const rows = await apiFetch<CampaignBriefRead[]>(VENDOR_ENDPOINTS.openMerchandisingCampaigns, {
      revalidate: false,
    });
    return rows.map(toCampaignBrief);
  },

  async campaignOptIns(): Promise<MerchandisingOptIn[]> {
    const rows = await apiFetch<OptInRead[]>(VENDOR_ENDPOINTS.merchandisingOptIns, { revalidate: false });
    return rows.map((o) => ({
      id: o.id,
      campaignId: o.campaign_id,
      campaignTitle: o.campaign_title ?? null,
      productId: o.product_id ?? null,
      status: o.status,
      createdAt: o.created_at,
    }));
  },

  optInToCampaign: (campaignId: string, productId: string) =>
    apiFetch<unknown>(VENDOR_ENDPOINTS.merchandisingOptIns, {
      method: "POST",
      body: { campaign_id: campaignId, product_id: productId },
    }),

  /* ---------- Campaign submission workspace ---------- */

  async campaignWorkspace(slug: string): Promise<CampaignWorkspace> {
    const row = await apiFetch<CampaignWorkspaceRead>(VENDOR_ENDPOINTS.campaignWorkspace(slug), {
      revalidate: false,
    });
    return {
      campaign: toCampaignBrief(row.campaign),
      submissions: row.submissions.map(toCampaignSubmission),
    };
  },

  async submitCampaignProducts(
    slug: string,
    items: { productId: string; proposedPrice?: number | null; vendorNote?: string | null }[],
  ): Promise<CampaignSubmissionResult> {
    const row = await apiFetch<CampaignSubmissionResultRead>(
      VENDOR_ENDPOINTS.campaignSubmissions(slug),
      {
        method: "POST",
        body: {
          items: items.map((item) => ({
            product_id: item.productId,
            proposed_price: item.proposedPrice ?? null,
            vendor_note: item.vendorNote ?? null,
          })),
        },
      },
    );
    return {
      campaignSlug: row.campaign_slug,
      submitted: row.submitted,
      rejected: row.rejected,
      outcomes: row.outcomes.map((outcome) => ({
        productId: outcome.product_id,
        accepted: outcome.accepted,
        reason: outcome.reason ?? null,
        detail: outcome.detail ?? null,
      })),
    };
  },
};

/* ---------- Promotion analytics ---------- */

export type PromoChannel = {
  entityType: string;
  trackedEntities: number;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
};

export type PromoPerformer = {
  entityId: string;
  entityLabel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
};

export type PromoOverview = {
  days: number;
  channels: PromoChannel[];
  totalDiscountGiven: number;
  totalRedemptions: number;
  topPerformers: PromoPerformer[];
};

type PromoOverviewRead = {
  days: number;
  channels: {
    entity_type: string;
    tracked_entities: number;
    impressions: number;
    clicks: number;
    conversions: number;
    click_through_rate: number;
    conversion_rate: number;
  }[];
  total_discount_given: number;
  total_redemptions: number;
  top_performers: {
    entity_id: string;
    entity_label: string;
    impressions: number;
    clicks: number;
    conversions: number;
    click_through_rate: number;
    conversion_rate: number;
  }[];
};

export const vendorAnalyticsService = {
  /** Campaign and voucher performance for this store. Banners are marketplace-wide and admin-only. */
  async promoOverview(days = 30): Promise<PromoOverview> {
    const o = await apiFetch<PromoOverviewRead>(VENDOR_ENDPOINTS.promoOverview, { query: { days }, revalidate: false });
    return {
      days: o.days,
      channels: (o.channels ?? []).map((c) => ({
        entityType: c.entity_type,
        trackedEntities: c.tracked_entities,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        clickThroughRate: c.click_through_rate,
        conversionRate: c.conversion_rate,
      })),
      totalDiscountGiven: o.total_discount_given,
      totalRedemptions: o.total_redemptions,
      topPerformers: (o.top_performers ?? []).map((p) => ({
        entityId: p.entity_id,
        entityLabel: p.entity_label,
        impressions: p.impressions,
        clicks: p.clicks,
        conversions: p.conversions,
        clickThroughRate: p.click_through_rate,
        conversionRate: p.conversion_rate,
      })),
    };
  },
};
