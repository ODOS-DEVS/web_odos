"use client";

import Link from "next/link";
import type { Store } from "@/types/catalog";
import { useIsStoreFavorite, useStoreFavorites } from "@/hooks/use-store-favorites";
import { Media } from "@/components/ui/media";
import { SectionHeading } from "@/components/ui/section-heading";
import { favoriteShareActions, SpeedDial } from "@/components/ui/speed-dial";

/** A row of nearby vendor cards — a photo-led alternative to the `StoreCard` list in "Stores near you". */
export function MarketNearYou({ stores }: { stores: Store[] }) {
  if (stores.length === 0) return null;

  return (
    <div>
      <SectionHeading title="Market near you" />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {stores.slice(0, 4).map((store) => (
          <li key={store.id} className="w-[84%] shrink-0 snap-start sm:w-auto sm:shrink">
            <MarketCard store={store} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarketCard({ store }: { store: Store }) {
  const { toggle } = useStoreFavorites();
  const saved = useIsStoreFavorite(store.id);

  const actions = favoriteShareActions({
    name: store.name,
    href: `/stores/${store.slug}`,
    saved,
    onToggleFavorite: () => toggle(store),
  });

  return (
    <Link href={`/stores/${store.slug}`} className="group block touch-manipulation select-none">
      <div className="relative">
        <Media
          src={store.bannerUrl}
          name={store.name}
          className="aspect-3/4 rounded-3xl"
          sizes="(min-width: 640px) 22vw, 60vw"
          imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <SpeedDial actions={actions} className="absolute right-3 bottom-3" />
      </div>
      <p className="mt-3 truncate text-sm font-semibold">{store.name}</p>
    </Link>
  );
}
