export type Promo = {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  price: string;
  originalPrice: string;
  imageSrc: string;
  bgClass: string;
};

export const PROMOS: Promo[] = [
  {
    id: "apple-watch",
    href: "/products?tag=flash",
    eyebrow: "TODAY'S BEST DEAL",
    title: "APPLE WATCH",
    price: "GHC 300",
    originalPrice: "GHC 500",
    imageSrc: "/images/apple-watch.png",
    bgClass: "bg-[#383b46]",
  },
  {
    id: "nike",
    href: "/products?category=fashion",
    eyebrow: "TODAY'S BEST DEAL",
    title: "NIKE",
    price: "GHC 300",
    originalPrice: "GHC 500",
    imageSrc: "/images/nike.png",
    bgClass: "bg-[#16232b]",
  },
];

export type Tile = {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  price: string;
  originalPrice: string;
  imageSrc: string;
  bgClass: string;
  layout: "hero" | "row";
};

export const TILES: Tile[] = [
  {
    id: "nike-hero",
    href: "/products?tag=flash",
    eyebrow: "TODAY'S BEST DEAL",
    title: "NIKE",
    price: "GHC 300",
    originalPrice: "GHC 500",
    imageSrc: "/images/nike1.jpg",
    bgClass: "bg-[#3b3c3e]",
    layout: "hero",
  },
  {
    id: "nike-blue",
    href: "/products?tag=flash",
    eyebrow: "TODAY'S BEST DEAL",
    title: "NIKE",
    price: "GHC 300",
    originalPrice: "GHC 500",
    imageSrc: "/images/nike2.jpg",
    bgClass: "bg-[#0f468d]",
    layout: "row",
  },
  {
    id: "nike-dark",
    href: "/products?category=fashion",
    eyebrow: "TODAY'S BEST DEAL",
    title: "NIKE",
    price: "GHC 300",
    originalPrice: "GHC 500",
    imageSrc: "/images/nike.png",
    bgClass: "bg-[#16232b]",
    layout: "row",
  },
];

export type Deal = {
  id: number;
  title: string;
  description: string;
  href: string;
  image: string;
};

export const DEALS: Deal[] = [
  {
    id: 1,
    title: "Christmas Deals",
    description: "This Christmas, find great deals, discover amazing businesses, and make every purchase count with ODOS.market.",
    href: "/products?tag=christmas",
    image: "/images/christmas-decorating.jpg",
  },
  {
    id: 2,
    title: "End of Year Sale",
    description: "Wrap up the year with massive savings on tech, fashion, and home essentials. Don't miss out!",
    href: "/products?tag=sale",
    image: "/images/christmas-decorating.jpg",
  },
  {
    id: 3,
    title: "Winter Collection",
    description: "Stay warm and stylish this season. Explore our exclusive winter collection with amazing discounts.",
    href: "/products?tag=winter",
    image: "/images/christmas-decorating.jpg",
  },
  {
    id: 4,
    title: "Gift Guide 2026",
    description: "Find the perfect gift for your loved ones. Curated selections for every personality and budget.",
    href: "/products?tag=gifts",
    image: "/images/christmas-decorating.jpg",
  },
  {
    id: 5,
    title: "Flash Deals",
    description: "Limited time offers on top brands. Hurry up before they are gone forever!",
    href: "/products?tag=flash",
    image: "/images/christmas-decorating.jpg",
  },
];
