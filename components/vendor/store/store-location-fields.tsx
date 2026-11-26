"use client";

import { useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { inputClass } from "@/components/ui/field";
import { useMarkets } from "@/hooks/use-catalog";
import { cn } from "@/libs/cn";

/**
 * Where the store actually is, and which market it trades in.
 *
 * The app has had this since store setup shipped; the website read the three
 * fields and wrote them straight back unchanged, so a vendor who set their
 * store up here had no way to place it on the map or pick a market, and no
 * way to correct either afterwards.
 *
 * Three ways in, because no single one works for every vendor:
 *
 * - "Use my current location" for someone standing in their shop. Browser
 *   geolocation only, so there is no map dependency to add and nothing to
 *   configure.
 * - Typing the address, for setting the store up from somewhere else.
 * - Entering the coordinates by hand, which is the escape hatch when the
 *   place has no address anyone would recognise — common enough in Ghana
 *   that leaving it out would strand real vendors.
 *
 * Deliberately not a map picker: that needs a mapping library and a key, and
 * the three routes above already cover the cases. The app keeps its map.
 */
export function StoreLocationFields({
  address,
  latitude,
  longitude,
  marketId,
  onChange,
}: {
  address: string;
  latitude: number | null;
  longitude: number | null;
  marketId: string | null;
  onChange: (next: {
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    marketId?: string | null;
  }) => void;
}) {
  const { data: markets } = useMarkets();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const hasPin = latitude != null && longitude != null;

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError("This browser can't share a location. Enter the coordinates below instead.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? "Location access was blocked. Allow it for this site, or enter the coordinates below."
            : "We couldn't read your location just now. Try again, or enter the coordinates below.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // Empty clears the pin; a half-entered pair is not a location.
  const setCoordinate = (key: "latitude" | "longitude", raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return onChange({ [key]: null });
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) onChange({ [key]: parsed });
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Street address or landmark</span>
        <input
          className={inputClass}
          value={address}
          onChange={(event) => onChange({ address: event.target.value })}
          maxLength={255}
          placeholder="e.g. Shop 14, Madina Market, opposite the lorry station"
        />
        <span className="mt-1 block text-xs text-muted">
          What you would tell a rider on the phone. A landmark is often clearer than a street name.
        </span>
      </label>

      <div className="rounded-2xl border border-line bg-surface-muted p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 text-accent" aria-hidden />
            {hasPin ? "Store pinned" : "Store not pinned yet"}
          </p>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="press inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-foreground disabled:opacity-60"
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="size-4 text-accent" aria-hidden />
            )}
            {locating ? "Finding you…" : "I'm at my store"}
          </button>
        </div>

        <p className="mt-2 text-xs text-muted">
          Pinning the store is what lets ODOS quote delivery accurately and show you to nearby
          shoppers. Tap the button while you are at the shop, or type the coordinates in.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Latitude</span>
            <input
              className={cn(inputClass, "h-10")}
              inputMode="decimal"
              value={latitude ?? ""}
              onChange={(event) => setCoordinate("latitude", event.target.value)}
              placeholder="5.6667"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Longitude</span>
            <input
              className={cn(inputClass, "h-10")}
              inputMode="decimal"
              value={longitude ?? ""}
              onChange={(event) => setCoordinate("longitude", event.target.value)}
              placeholder="-0.1870"
            />
          </label>
        </div>

        {locateError ? <p className="mt-2 text-xs text-danger">{locateError}</p> : null}

        {hasPin ? (
          <button
            type="button"
            onClick={() => onChange({ latitude: null, longitude: null })}
            className="press mt-3 text-xs font-medium text-muted underline underline-offset-4 hover:text-foreground"
          >
            Clear the pin
          </button>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Market <span className="font-normal text-muted">(optional)</span>
        </span>
        <select
          className={inputClass}
          value={marketId ?? ""}
          onChange={(event) => onChange({ marketId: event.target.value || null })}
        >
          <option value="">Not in a listed market</option>
          {(markets ?? []).map((market) => (
            <option key={market.id} value={market.id}>
              {market.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">
          Shoppers browsing a market see the stores trading in it. Leave this unset if you trade
          somewhere that is not on the list.
        </span>
      </label>
    </div>
  );
}
