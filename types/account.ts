/** A delivery address saved on the shopper's account. */
export type SavedAddress = {
  id: string;
  /** Always present in the UI: the backend's optional label falls back to the city. */
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  /** Ghana Post GPS code, when the shopper gave one. */
  gpsCode: string | null;
  isDefault: boolean;
};

/** A product the shopper saved. Server-backed through `/wishlist` when signed in. */
export type FavoriteItem = {
  productId: string;
  storeId: string | null;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  savedAt: string;
};
