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



/** Background colours the collage cycles through, since products carry no brand colour. */
export const TILE_BACKGROUNDS = ["bg-[#3b3c3e]", "bg-[#0f468d]", "bg-[#16232b]"] as const;
