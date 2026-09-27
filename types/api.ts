/**
 * Friendly names for the generated OpenAPI schemas (`types/api-schema.d.ts`, regenerate with `pnpm api:types`).
 * These are the wire shapes. Screens use the UI models in `types/catalog.ts` etc.; `services/mappers.ts`
 * converts between the two.
 */
import type { components } from "./api-schema";

type Schemas = components["schemas"];

export type AuthToken = Schemas["AuthToken"];
export type UserRead = Schemas["UserRead"];
export type UserCreate = Schemas["UserCreate"];
export type UserUpdate = Schemas["UserUpdate"];
export type MessageResponse = Schemas["MessageResponse"];

export type CategoryRead = Schemas["CategoryRead"];
export type MarketRead = Schemas["MarketRead"];
export type StoreRead = Schemas["StoreRead"];
export type StoreSectionRead = Schemas["StoreSectionRead"];
export type ProductRead = Schemas["ProductRead"];
export type ProductReviewRead = Schemas["ProductReviewRead"];
export type PromoBannerRead = Schemas["PromoBannerRead"];
export type MerchandisingCampaignRead = Schemas["MerchandisingCampaignRead"];
export type FlashSaleEventRead = Schemas["FlashSaleEventRead"];

export type DeliveryQuoteRequest = Schemas["DeliveryQuoteRequest"];
export type DeliveryQuoteRead = Schemas["DeliveryQuoteRead"];
export type DeliveryOptionRead = Schemas["DeliveryOptionRead"];

export type CartItemRead = Schemas["CartItemRead"];
export type CartItemCreate = Schemas["CartItemCreate"];

export type OrderRead = Schemas["OrderRead"];
export type OrderCreate = Schemas["OrderCreate"];
export type OrderItemCreate = Schemas["OrderItemCreate"];
export type OrderItemRead = Schemas["OrderItemRead"];
export type OrderPackageRead = Schemas["OrderPackageRead"];

export type AddressRead = Schemas["AddressRead"];
export type AddressCreate = Schemas["AddressCreate"];
export type PaymentMethodRead = Schemas["PaymentMethodRead"];
export type CustomerWalletRead = Schemas["CustomerWalletRead"];
export type WishlistItemRead = Schemas["WishlistItemRead"];
export type StoreVoucherRead = Schemas["StoreVoucherRead"];
export type ChatThreadRead = Schemas["ChatThreadRead"];
export type ChatMessageRead = Schemas["ChatMessageRead"];
