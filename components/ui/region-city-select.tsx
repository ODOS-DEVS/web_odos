"use client";

import { useId } from "react";
import { inputClass } from "@/components/ui/field";
import { GHANA_REGIONS, getCitiesForRegion, matchGhanaRegion } from "@/libs/ghana-locations";

/**
 * Region, and the towns inside it — the same pair of dropdowns the mobile app uses, from the same
 * dataset. Picking a region narrows the towns; a town saved earlier that is not in the list (an
 * older free-text value, or one typed on another client) is kept as an option so editing a profile
 * never silently drops it.
 */
export function RegionCitySelect({
  region,
  city,
  onRegionChange,
  onCityChange,
  required = false,
  cityLabel = "Town / city",
  idPrefix,
}: {
  region: string;
  city: string;
  onRegionChange: (region: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  cityLabel?: string;
  /** Set when two of these can appear on one page, so the label/input ids stay unique. */
  idPrefix?: string;
}) {
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;
  const regionId = `${prefix}-region`;
  const cityId = `${prefix}-city`;

  const towns = getCitiesForRegion(region, city);

  const onRegion = (next: string) => {
    onRegionChange(next);
    // The towns list changes with the region, so a town from the old one would be wrong.
    if (city && !getCitiesForRegion(next).includes(city)) onCityChange("");
  };

  return (
    <>
      <div>
        <label htmlFor={regionId} className="mb-1.5 block text-sm font-medium">
          Region
        </label>
        <select
          id={regionId}
          name="region"
          required={required}
          value={matchGhanaRegion(region) ?? ""}
          onChange={(e) => onRegion(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a region
          </option>
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={cityId} className="mb-1.5 block text-sm font-medium">
          {cityLabel}
        </label>
        <select
          id={cityId}
          name="city"
          required={required}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={towns.length === 0}
          className={inputClass}
        >
          <option value="" disabled>
            {towns.length === 0 ? "Pick a region first" : `Select a ${cityLabel.toLowerCase()}`}
          </option>
          {towns.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
