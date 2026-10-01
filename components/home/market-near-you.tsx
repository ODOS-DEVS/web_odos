"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import type { Store } from "@/types/catalog";
import { cn } from "@/libs/cn";
import { Media } from "@/components/ui/media";
import { SectionHeading } from "@/components/ui/section-heading";

/** A row of nearby vendor cards — a photo-led alternative to the `StoreCard` list in "Stores near you". */
export function MarketNearYou({ stores }: { stores: Store[] }) {
  if (stores.length === 0) return null;

  return (
    <div>
      <SectionHeading title="Market near you" />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stores.slice(0, 4).map((store) => (
          <li key={store.id}>
            <MarketCard store={store} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarketCard({ store }: { store: Store }) {
  const [saved, setSaved] = useState(false);

  const toggleSaved = (event: MouseEvent) => {
    event.preventDefault();
    setSaved((value) => !value);
  };

  return (
    <Link href={`/stores/${store.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl">
        <Media
          src={store.bannerUrl}
          name={store.name}
          className="aspect-[3/4]"
          sizes="(min-width: 640px) 22vw, 45vw"
          imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <button
          type="button"
          onClick={toggleSaved}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${store.name} from saved` : `Save ${store.name}`}
          className="press absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-surface/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-danger"
        >
          <Heart className={cn("size-4", saved && "fill-danger text-danger")} aria-hidden />
        </button>
      </div>
      <p className="mt-3 truncate text-sm font-semibold">{store.name}</p>
    </Link>
  );
}
