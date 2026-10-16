import type { FulfilmentStatus } from "@/types/order";

/** Temporary dummy seller-center data standing in for the real vendor dashboard endpoints. */

/** A real (seeded, stable) photo from Lorem Picsum — passes straight through `cloudinaryLoader`. */
const img = (seed: string, w = 800, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export type SellerStats = {
  storeName: string;
  awaitingConfirmation: number;
  awaitingShipment: number;
  todaySales: number;
  todayOrders: number;
  toConfirmToday: number;
  ordersRefundedToday: number;
  fulfilledPercent: number;
};

export const MOCK_SELLER_STATS: SellerStats = {
  storeName: "Nationwide Sneakers",
  awaitingConfirmation: 13,
  awaitingShipment: 9,
  todaySales: 200,
  todayOrders: 0,
  toConfirmToday: 13,
  ordersRefundedToday: 0,
  fulfilledPercent: 55,
};

export type SellerProfile = {
  storeName: string;
  email: string;
  businessType: string;
  address: string;
  supportEmail: string;
  phone: string;
};

export const MOCK_SELLER_PROFILE: SellerProfile = {
  storeName: "Nationwide Sneaker store",
  email: "nationwide@example.com",
  businessType: "Registered business",
  address: "Dew Street 9, New Gbawe",
  supportEmail: "info@odos.market",
  phone: "+233 54 184 7005",
};

export type VendorOrderItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
};

export type VendorOrder = {
  id: string;
  number: string;
  placedAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: { street: string; city: string; region: string };
  status: FulfilmentStatus;
  paymentStatus: "paid" | "refunded";
  items: VendorOrderItem[];
  deliveryFee: number;
  total: number;
};

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

/** Orders placed on this seller's store, across every stage of fulfilment. */
export const MOCK_VENDOR_ORDERS: VendorOrder[] = [
  {
    id: "vorder-2041",
    number: "ODOS-2041",
    placedAt: daysAgo(0),
    buyerName: "Kofi Mensah",
    buyerEmail: "kofi.mensah@example.com",
    buyerPhone: "+233 24 111 2233",
    address: { street: "12 Liberation Rd", city: "Accra", region: "Greater Accra" },
    status: "pending",
    paymentStatus: "paid",
    items: [{ id: "vi-1", name: "Air Max Retro", imageUrl: img("odos-vprod-air-max-retro"), quantity: 1, unitPrice: 405 }],
    deliveryFee: 15,
    total: 420,
  },
  {
    id: "vorder-2040",
    number: "ODOS-2040",
    placedAt: daysAgo(0),
    buyerName: "Ama Owusu",
    buyerEmail: "ama.owusu@example.com",
    buyerPhone: "+233 20 334 9981",
    address: { street: "9 Ring Road East", city: "Accra", region: "Greater Accra" },
    status: "pending",
    paymentStatus: "paid",
    items: [
      { id: "vi-2", name: "Classic Low Sneakers", imageUrl: img("odos-vprod-classic-low-sneakers"), quantity: 2, unitPrice: 150 },
      { id: "vi-3", name: "No-Show Socks (3-pack)", imageUrl: img("odos-vprod-no-show-socks"), quantity: 1, unitPrice: 45 },
    ],
    deliveryFee: 20,
    total: 365,
  },
  {
    id: "vorder-2037",
    number: "ODOS-2037",
    placedAt: daysAgo(1),
    buyerName: "Yaw Boateng",
    buyerEmail: "yaw.boateng@example.com",
    buyerPhone: "+233 54 773 1102",
    address: { street: "3 Spintex Rd", city: "Accra", region: "Greater Accra" },
    status: "confirmed",
    paymentStatus: "paid",
    items: [{ id: "vi-4", name: "Running Trainers", imageUrl: img("odos-vprod-running-trainers"), quantity: 1, unitPrice: 295 }],
    deliveryFee: 15,
    total: 310,
  },
  {
    id: "vorder-2033",
    number: "ODOS-2033",
    placedAt: daysAgo(2),
    buyerName: "Esi Darko",
    buyerEmail: "esi.darko@example.com",
    buyerPhone: "+233 26 445 7781",
    address: { street: "21 Oyarifa Main St", city: "Accra", region: "Greater Accra" },
    status: "preparing",
    paymentStatus: "paid",
    items: [{ id: "vi-5", name: "Canvas High-Tops", imageUrl: img("odos-vprod-canvas-high-tops"), quantity: 1, unitPrice: 245 }],
    deliveryFee: 15,
    total: 260,
  },
  {
    id: "vorder-2028",
    number: "ODOS-2028",
    placedAt: daysAgo(3),
    buyerName: "Kwabena Asante",
    buyerEmail: "kwabena.asante@example.com",
    buyerPhone: "+233 55 220 6634",
    address: { street: "8 Tema Station Rd", city: "Tema", region: "Greater Accra" },
    status: "out_for_delivery",
    paymentStatus: "paid",
    items: [
      { id: "vi-6", name: "Suede Chukka Boots", imageUrl: img("odos-vprod-suede-chukka-boots"), quantity: 1, unitPrice: 320 },
      { id: "vi-7", name: "Shoe Care Kit", imageUrl: img("odos-vprod-shoe-care-kit"), quantity: 1, unitPrice: 105 },
    ],
    deliveryFee: 20,
    total: 445,
  },
  {
    id: "vorder-2015",
    number: "ODOS-2015",
    placedAt: daysAgo(7),
    buyerName: "Abena Yeboah",
    buyerEmail: "abena.yeboah@example.com",
    buyerPhone: "+233 27 998 4420",
    address: { street: "14 Labone Crescent", city: "Accra", region: "Greater Accra" },
    status: "delivered",
    paymentStatus: "paid",
    items: [{ id: "vi-8", name: "Everyday Slip-Ons", imageUrl: img("odos-vprod-everyday-slip-ons"), quantity: 1, unitPrice: 175 }],
    deliveryFee: 15,
    total: 190,
  },
  {
    id: "vorder-2009",
    number: "ODOS-2009",
    placedAt: daysAgo(10),
    buyerName: "Nana Adjei",
    buyerEmail: "nana.adjei@example.com",
    buyerPhone: "+233 24 661 3357",
    address: { street: "5 Legon Hills", city: "Accra", region: "Greater Accra" },
    status: "delivered",
    paymentStatus: "paid",
    items: [{ id: "vi-9", name: "Air Max Retro", imageUrl: img("odos-vprod-air-max-retro"), quantity: 1, unitPrice: 405 }],
    deliveryFee: 15,
    total: 420,
  },
  {
    id: "vorder-1998",
    number: "ODOS-1998",
    placedAt: daysAgo(14),
    buyerName: "Efua Antwi",
    buyerEmail: "efua.antwi@example.com",
    buyerPhone: "+233 50 112 8847",
    address: { street: "30 Dansoman High St", city: "Accra", region: "Greater Accra" },
    status: "cancelled",
    paymentStatus: "refunded",
    items: [{ id: "vi-10", name: "Classic Low Sneakers", imageUrl: img("odos-vprod-classic-low-sneakers"), quantity: 1, unitPrice: 165 }],
    deliveryFee: 15,
    total: 180,
  },
  {
    id: "vorder-1987",
    number: "ODOS-1987",
    placedAt: daysAgo(18),
    buyerName: "Kofi Mensah",
    buyerEmail: "kofi.mensah@example.com",
    buyerPhone: "+233 24 111 2233",
    address: { street: "12 Liberation Rd", city: "Accra", region: "Greater Accra" },
    status: "delivered",
    paymentStatus: "paid",
    items: [{ id: "vi-11", name: "Running Trainers", imageUrl: img("odos-vprod-running-trainers"), quantity: 1, unitPrice: 295 }],
    deliveryFee: 15,
    total: 310,
  },
  {
    id: "vorder-1975",
    number: "ODOS-1975",
    placedAt: daysAgo(25),
    buyerName: "Ama Owusu",
    buyerEmail: "ama.owusu@example.com",
    buyerPhone: "+233 20 334 9981",
    address: { street: "9 Ring Road East", city: "Accra", region: "Greater Accra" },
    status: "delivered",
    paymentStatus: "paid",
    items: [{ id: "vi-12", name: "Everyday Slip-Ons", imageUrl: img("odos-vprod-everyday-slip-ons"), quantity: 1, unitPrice: 175 }],
    deliveryFee: 15,
    total: 190,
  },
];

export type VendorProductStatus = "active" | "draft";

export type VendorProduct = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: VendorProductStatus;
  updatedAt: string;
};

/** This seller's catalogue, editable through the Products tab's CRUD panel. */
export const MOCK_VENDOR_PRODUCTS: VendorProduct[] = [
  {
    id: "vprod-1",
    name: "Air Max Retro",
    category: "Sneakers",
    imageUrl: img("odos-vprod-air-max-retro"),
    price: 420,
    compareAtPrice: 480,
    stock: 18,
    status: "active",
    updatedAt: daysAgo(1),
  },
  {
    id: "vprod-2",
    name: "Classic Low Sneakers",
    category: "Sneakers",
    imageUrl: img("odos-vprod-classic-low-sneakers"),
    price: 180,
    compareAtPrice: null,
    stock: 42,
    status: "active",
    updatedAt: daysAgo(2),
  },
  {
    id: "vprod-3",
    name: "Running Trainers",
    category: "Sneakers",
    imageUrl: img("odos-vprod-running-trainers"),
    price: 310,
    compareAtPrice: null,
    stock: 7,
    status: "active",
    updatedAt: daysAgo(3),
  },
  {
    id: "vprod-4",
    name: "Canvas High-Tops",
    category: "Sneakers",
    imageUrl: img("odos-vprod-canvas-high-tops"),
    price: 260,
    compareAtPrice: 300,
    stock: 0,
    status: "active",
    updatedAt: daysAgo(5),
  },
  {
    id: "vprod-5",
    name: "Suede Chukka Boots",
    category: "Boots",
    imageUrl: img("odos-vprod-suede-chukka-boots"),
    price: 345,
    compareAtPrice: null,
    stock: 11,
    status: "active",
    updatedAt: daysAgo(6),
  },
  {
    id: "vprod-6",
    name: "No-Show Socks (3-pack)",
    category: "Accessories",
    imageUrl: img("odos-vprod-no-show-socks"),
    price: 45,
    compareAtPrice: null,
    stock: 120,
    status: "active",
    updatedAt: daysAgo(9),
  },
  {
    id: "vprod-7",
    name: "Shoe Care Kit",
    category: "Accessories",
    imageUrl: img("odos-vprod-shoe-care-kit"),
    price: 85,
    compareAtPrice: null,
    stock: 30,
    status: "draft",
    updatedAt: daysAgo(12),
  },
  {
    id: "vprod-8",
    name: "Everyday Slip-Ons",
    category: "Sneakers",
    imageUrl: img("odos-vprod-everyday-slip-ons"),
    price: 190,
    compareAtPrice: null,
    stock: 25,
    status: "draft",
    updatedAt: daysAgo(15),
  },
];
